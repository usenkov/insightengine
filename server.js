import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';

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

// Configure Multer
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// --- ROUTE 1: UPLOAD (File Manager) ---
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log("Uploading file...");
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const filePath = req.file.path;
    let mimeType = req.file.mimetype;
    const displayName = req.file.originalname;

    // FIX: Force text/plain for .txt files if detected as generic binary
    if (mimeType === 'application/octet-stream' && displayName.endsWith('.txt')) {
      mimeType = 'text/plain';
    }

    console.log(`Received file: ${displayName} (${mimeType})`);

    // Upload to Gemini
    const uploadResult = await ai.files.upload({
      file: filePath,
      config: { 
        mimeType: mimeType,
        displayName: displayName 
      }
    });

    console.log("Raw Upload Result Keys:", Object.keys(uploadResult));

    // Handle different SDK response structures
    const fileData = uploadResult.file || uploadResult;
    
    // The URI might be in 'uri' or 'name' (files/...)
    const fileUri = fileData.uri || fileData.name;

    if (!fileUri) {
      throw new Error(`Could not determine file URI from result: ${JSON.stringify(uploadResult)}`);
    }

    console.log(`File Uploaded to Gemini: ${fileUri}`);

    // Clean up local file
    fs.unlinkSync(filePath);

    res.json({ 
      uri: fileUri, 
      name: displayName, 
      mimeType: mimeType
    });

  } catch (error) {
    console.error("Upload Error:", error);
    // Try to clean up if error occurred
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE 2: CHAT AGENT (RAG) ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, fileUri, mimeType } = req.body;
    console.log("Received Chat:", message);
    console.log("File URI:", fileUri || "None");
    console.log("Mime Type:", mimeType || "Defaulting to text/plain");

    let contents = [];
    
    if (fileUri) {
      // RAG Mode: Include the file in the context
      contents = [{
        role: 'user',
        parts: [
          { fileData: { mimeType: mimeType || 'text/plain', fileUri: fileUri } },
          { text: message }
        ]
      }];
    } else {
      // Standard Mode
      contents = [{ role: 'user', parts: [{ text: message }] }];
    }

    const result = await ai.models.generateContent({
      model: 'models/gemini-1.5-flash',
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
    console.error("Chat Error Full Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTE 3: AUDIO PRODUCER ---
app.post('/api/audio', async (req, res) => {
  try {
    console.log("Generating Audio Script...");
    
    const result = await ai.models.generateContent({
      model: 'models/gemini-2.0-flash-exp', 
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