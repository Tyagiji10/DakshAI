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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("daksh-voice")

app = FastAPI(title="DakshAI Voice Server", version="1.0.0")

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


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=False)
