import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY;

// The JS SDK doesn't expose listModels conveniently for debugging 404s, 
// so we do a raw fetch to the REST API.
async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
}
listModels();
