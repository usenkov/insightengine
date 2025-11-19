require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json());

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file");
  process.exit(1);
}

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- ROUTE 1: CHAT AGENT (RAG) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Received Chat:", message);

    // Mocking RAG for now - In Phase 3 we connect the real File Store
    // But we use the REAL Gemini 3 model to generate the answer
    const model = ai.models.get({ model: 'gemini-3-pro-preview' });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.7 }
    });

    const text = result.response.text();

    res.json({
      role: 'model',
      content: text,
      // Mock citations until we connect the real File Store ID
      citations: [{ title: 'Market Analysis.txt', uri: '#' }]
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE 2: AUDIO PRODUCER ---
// This generates the script for your missing Audio Card
app.post('/api/audio', async (req, res) => {
  try {
    console.log("Generating Audio Script...");
    
    const model = ai.models.get({ 
      model: 'gemini-3-pro-preview',
      systemInstruction: `You are a podcast producer. Generate a short, lively 2-person dialogue (Host vs Expert) about "Global Market Trends". Output strictly an array of JSON objects with "speaker" and "text" keys.`
    });

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: "Generate script." }] }],
        generationConfig: { 
            responseMimeType: "application/json" 
        }
    });

    const script = JSON.parse(result.response.text());
    res.json({ script });

  } catch (error) {
    console.error("Audio Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- START ---
app.listen(PORT, () => {
  console.log(`✅ InsightEngine Brain is running on http://localhost:${PORT}`);
});