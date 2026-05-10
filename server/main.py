"""
DakshAI Voice Server
────────────────────
Provides STT (Whisper) and TTS (Coqui XTTS-v2) endpoints for the AI Interview feature.

Install dependencies:
    pip install -r requirements.txt

Run:
    python main.py
    # OR:  uvicorn main:app --host 0.0.0.0 --port 5001 --reload
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import io
import os
import tempfile
import uvicorn
import logging

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import io
import os
import tempfile
import uvicorn
import logging
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("daksh-voice")

# ── Optional NLP (graceful degradation if not installed) ─────────────────────
NLP_AVAILABLE = False
_embed_model = None
_nlp = None

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    _embed_model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("✅ sentence-transformers loaded (all-MiniLM-L6-v2)")
    try:
        import spacy
        _nlp = spacy.load('en_core_web_sm')
        logger.info("✅ spaCy en_core_web_sm loaded")
    except Exception:
        logger.warning("⚠️  spaCy model not found. Run: python -m spacy download en_core_web_sm")
    NLP_AVAILABLE = True
except ImportError:
    logger.warning("⚠️  NLP packages not installed. ATS will use keyword-only scoring.")

app = FastAPI(title="DakshAI Server", version="2.0.0")


# ── CORS: allow Vite dev server ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lazy-loaded models to avoid slow startup when not used ────────────────────
_whisper_model = None
_tts_model = None


def get_whisper():
    global _whisper_model
    if _whisper_model is None:
        logger.info("Loading Whisper model (first run — may take a moment)...")
        try:
            from faster_whisper import WhisperModel
            # "base" is fast and accurate enough for interview transcription
            _whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            logger.info("✅ Whisper model loaded.")
        except ImportError:
            raise RuntimeError("faster-whisper not installed. Run: pip install faster-whisper")
    return _whisper_model


def get_tts():
    global _tts_model
    if _tts_model is None:
        logger.info("Loading XTTS-v2 model (first run — downloading ~2 GB on first use)...")
        try:
            from TTS.api import TTS
            _tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            logger.info("✅ XTTS-v2 model loaded.")
        except ImportError:
            raise RuntimeError("TTS not installed. Run: pip install TTS")
    return _tts_model


# ── Pydantic model for TTS request ───────────────────────────────────────────
class SpeakRequest(BaseModel):
    text: str
    language: str = "en"
    speaker: str = "Ana Florence"   # a neutral English XTTS-v2 speaker


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Accepts a WEBM/OGG/WAV audio blob and returns the Whisper transcript.
    """
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file received.")

        # Write to a temp file so Whisper can read it
        suffix = ".webm"
        if audio.filename:
            ext = os.path.splitext(audio.filename)[1]
            if ext: suffix = ext

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        model = get_whisper()
        segments, info = model.transcribe(tmp_path, beam_size=5, language=None)

        transcript = " ".join(seg.text.strip() for seg in segments).strip()
        detected_lang = info.language

        os.unlink(tmp_path)
        logger.info(f"Transcribed [{detected_lang}]: {transcript[:80]}...")

        return JSONResponse({"transcript": transcript, "language": detected_lang})

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/speak")
async def speak(request: SpeakRequest):
    """
    Accepts text + language and returns a WAV audio stream via XTTS-v2.
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Empty text provided.")

        tts = get_tts()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = tmp.name

        # Generate speech
        tts.tts_to_file(
            text=request.text[:800],   # cap to avoid extremely long gen
            language=request.language[:2],
            speaker=request.speaker,
            file_path=tmp_path
        )

        with open(tmp_path, "rb") as f:
            audio_data = f.read()

        os.unlink(tmp_path)
        logger.info(f"TTS generated {len(audio_data)//1024}KB for: {request.text[:60]}...")

        return StreamingResponse(io.BytesIO(audio_data), media_type="audio/wav",
                                 headers={"Content-Disposition": "inline; filename=speech.wav"})

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── ATS Score Engine ──────────────────────────────────────────────────────────

# In-memory embedding cache (text_hash → embedding vector)
_embed_cache: Dict[str, list] = {}

class ATSScoreRequest(BaseModel):
    jd_text: str
    sections: Dict[str, str]  # { skills, summary, experience, projects, education }

class ATSFeedbackRequest(BaseModel):
    score_result: dict
    resume_text: str
    jd_text: str

def _get_embedding(text: str) -> list:
    """Get embedding with in-memory caching."""
    key = hashlib.md5(text.encode()).hexdigest()
    if key in _embed_cache:
        return _embed_cache[key]
    emb = _embed_model.encode([text])[0].tolist()
    _embed_cache[key] = emb
    return emb

@app.post("/ats/score")
async def ats_score(request: ATSScoreRequest):
    """
    Semantic ATS scoring using sentence-transformers (all-MiniLM-L6-v2).
    Returns per-section cosine similarity scores (0-100) against JD.
    Falls back to keyword overlap if NLP unavailable.
    """
    try:
        if NLP_AVAILABLE and _embed_model:
            jd_emb = _get_embedding(request.jd_text)
            scores = {}
            suggestions = []

            for section, text in request.sections.items():
                if not text or not text.strip():
                    scores[section] = 0.0
                    continue
                sec_emb = _get_embedding(text)
                sim = float(cosine_similarity([jd_emb], [sec_emb])[0][0])
                # Normalize: cosine similarity is 0-1, scale to 0-100
                scores[section] = round(min(100, max(0, sim * 100)), 1)

            # spaCy-based named entity suggestions
            if _nlp:
                jd_doc = _nlp(request.jd_text[:5000])
                jd_ents = [e.text for e in jd_doc.ents if e.label_ in ('ORG','PRODUCT','GPE','SKILL')]
                resume_text = " ".join(request.sections.values())
                for ent in jd_ents[:20]:
                    if ent.lower() not in resume_text.lower():
                        suggestions.append({
                            "priority": 2,
                            "type": "keyword",
                            "message": f"Consider adding '{ent}' — detected as a key entity in the job description."
                        })

            return JSONResponse({
                **scores,
                "suggestions": suggestions[:8],
                "nlp_engine": "all-MiniLM-L6-v2 + spaCy"
            })
        else:
            # Fallback: keyword overlap ratio
            jd_tokens = set(request.jd_text.lower().split())
            scores = {}
            for section, text in request.sections.items():
                if not text.strip():
                    scores[section] = 0.0
                    continue
                sec_tokens = set(text.lower().split())
                overlap = len(jd_tokens & sec_tokens) / max(1, len(jd_tokens))
                scores[section] = round(min(100, overlap * 200), 1)
            return JSONResponse({**scores, "suggestions": [], "nlp_engine": "keyword_fallback"})

    except Exception as e:
        logger.error(f"ATS score error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ats/embed")
async def ats_embed(payload: dict):
    """Return embeddings for a list of texts. Used for client-side cosine similarity."""
    if not NLP_AVAILABLE or not _embed_model:
        raise HTTPException(status_code=503, detail="NLP not available. Install sentence-transformers.")
    texts = payload.get("texts", [])
    if not texts:
        raise HTTPException(status_code=400, detail="No texts provided.")
    embeddings = [_get_embedding(t) for t in texts[:10]]
    return JSONResponse({"embeddings": embeddings})


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=False)
