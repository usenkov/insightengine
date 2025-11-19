import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
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
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);

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
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: mimeType,
      displayName: displayName
    });

    console.log(`File Uploaded to Gemini: ${uploadResult.file.uri}`);

    // Wait for file to be processed
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === 'PROCESSING') {
      console.log('Waiting for file to be processed...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === 'FAILED') {
      throw new Error('File processing failed');
    }

    console.log(`File ready: ${file.state}`);

    // Clean up local file
    fs.unlinkSync(filePath);

    res.json({
      uri: file.uri,  // Returns full URI for Gemini Chat API
      name: file.displayName,
      mimeType: file.mimeType
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

    // Use gemini-2.0-flash which supports fileData
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let parts = [];
    
    if (fileUri) {
      // RAG Mode: Include the file in the context
      parts = [
        {
          fileData: {
            mimeType: mimeType || 'text/plain',
            fileUri: fileUri
          }
        },
        { text: message }
      ];
    } else {
      // Standard Mode
      parts = [{ text: message }];
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    res.json({
      role: 'model',
      content: text,
      citations: fileUri ? [{ title: 'Uploaded Document', uri: '#' }] : []
    });

  } catch (error) {
    console.error("Chat Error:", error);

    // Provide more detailed error messages
    let errorMessage = error.message;
    if (error.message?.includes('API key')) {
      errorMessage = 'Invalid API key. Please check your GEMINI_API_KEY.';
    } else if (error.message?.includes('file')) {
      errorMessage = 'Error accessing uploaded file. Please try uploading again.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    }

    res.status(500).json({
      error: errorMessage,
      details: error.message
    });
  }
});

// --- ROUTE 3: AUDIO PRODUCER ---
app.post('/api/audio', async (req, res) => {
  try {
    console.log("Generating Audio Script...");
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      systemInstruction: `You are a podcast producer. Generate a short, lively 2-person dialogue (Host vs Expert) about "Global Market Trends". Output strictly an array of JSON objects with "speaker" and "text" keys.`
    });

    const result = await model.generateContent("Generate script.", {
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

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