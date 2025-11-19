import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
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

// --- ROUTE 1: UPLOAD (File Manager) ---
app.post('/api/upload', async (req, res) => {
  try {
    console.log("Uploading sample file...");
    
    // For this prototype, we upload a local sample file.
    // In a real app, you'd use 'multer' to handle the incoming file from req.
    const filePath = 'sample_data.txt';
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Sample file not found on server." });
    }

    // Upload to Gemini
    const uploadResult = await ai.files.upload({
      file: filePath,
      config: { 
        mimeType: 'text/plain',
        displayName: 'Global Market Trends Report' 
      }
    });

    console.log(`File Uploaded: ${uploadResult.file.uri}`);

    res.json({ 
      uri: uploadResult.file.uri, 
      name: uploadResult.file.displayName 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE 2: CHAT AGENT (RAG) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, fileUri } = req.body;
    console.log("Received Chat:", message, "File:", fileUri || "None");

    let contents = [];
    
    if (fileUri) {
      // RAG Mode: Include the file in the context
      contents = [{
        role: 'user',
        parts: [
          { fileData: { mimeType: 'text/plain', fileUri: fileUri } },
          { text: message }
        ]
      }];
    } else {
      // Standard Mode
      contents = [{ role: 'user', parts: [{ text: message }] }];
    }

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Flash supports PDF/Text and is fast
      contents: contents,
      config: { temperature: 0.7 }
    });

    // Defensive Check
    if (!result || !result.response || typeof result.response.text !== 'function') {
      console.error("❌ Invalid Response from Gemini (Chat):", JSON.stringify(result, null, 2));
      return res.status(500).json({ 
        role: 'model', 
        content: "I'm sorry, I'm having trouble connecting to the brain right now. Please try again.",
        citations: []
      });
    }

    const text = result.response.text();

    res.json({
      role: 'model',
      content: text,
      citations: fileUri ? [{ title: 'Uploaded Document', uri: '#' }] : []
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE 3: AUDIO PRODUCER ---
app.post('/api/audio', async (req, res) => {
  try {
    console.log("Generating Audio Script...");
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', 
      config: { 
        responseMimeType: "application/json",
        systemInstruction: `You are a podcast producer. Generate a short, lively 2-person dialogue (Host vs Expert) about "Global Market Trends". Output strictly an array of JSON objects with "speaker" and "text" keys.`
      },
      contents: [{ role: 'user', parts: [{ text: "Generate script." }] }]
    });

    // Defensive Check
    if (!result || !result.response || typeof result.response.text !== 'function') {
      console.error("❌ Invalid Response from Gemini (Audio):", JSON.stringify(result, null, 2));
      return res.status(500).json({ error: "Failed to generate audio script from AI." });
    }

    const text = result.response.text();
    
    let script;
    try {
      script = JSON.parse(text);
    } catch (e) {
      console.error("❌ JSON Parse Error:", text);
      return res.status(500).json({ error: "Failed to parse audio script." });
    }

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