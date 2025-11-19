# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InsightEngine is an AI-powered research assistant built with React (Vite) + Express. It enables users to upload documents (PDF/TXT), interact with them via RAG (Retrieval-Augmented Generation) using Google Gemini, and generate audio overview podcasts from sources.

## Development Commands

### Frontend (Vite + React)
- `npm run dev` - Start Vite dev server on port 3000
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build

### Backend (Express + Gemini)
- `node server.js` - Start backend API server on port 3001
- Backend requires `GEMINI_API_KEY` in `.env` or `.env.local`

### Full Stack Development
Run both concurrently:
1. Terminal 1: `node server.js` (backend on :3001)
2. Terminal 2: `npm run dev` (frontend on :3000)

### Testing
- `node test_upload.js` - Test file upload endpoint
- `node test_chat.js` - Test chat endpoint with RAG

## Architecture

### Three-Tier Structure

**Frontend (Vite + React + TypeScript)**
- `App.tsx` - Main component with three views: landing, upload, studio
- `components/AudioPlayer.tsx` - Audio overview player with transcript
- `components/Header.tsx`, `components/Studio/` - UI components
- `types.ts` - TypeScript interfaces for state management
- `constants.ts` - Mock data and sample configurations

**Backend (Express + Node.js)**
- `server.js` - Three main API routes:
  1. `POST /api/upload` - Uploads files to Gemini File Manager, waits for processing
  2. `POST /api/chat` - RAG chat endpoint using Gemini 1.5 Flash with file context
  3. `POST /api/audio` - Generates podcast script using Gemini 2.0 Flash

**Environment Configuration**
- Frontend detects PROD vs DEV via `import.meta.env.PROD`
- In DEV: `API_BASE = http://localhost:3001`
- In PROD: `API_BASE = ''` (relative paths)

### Key Integration Points

**File Upload Flow**
1. Frontend uploads file via FormData → `/api/upload`
2. Backend uses `multer` to save to `uploads/` directory
3. Backend uploads to Gemini File Manager with proper MIME type
4. Backend polls file status until `state === 'ACTIVE'` (not 'PROCESSING')
5. Returns `file.name` (format: `files/xxxxx`) - NOT `file.uri`
6. Frontend stores `fileUri` and `mimeType` for chat context

**RAG Chat Flow**
1. Frontend sends message + `fileUri` + `mimeType` → `/api/chat`
2. Backend constructs Gemini request with `fileData` object:
   ```js
   {
     fileData: {
       mimeType: mimeType || 'text/plain',
       fileUri: fileUri  // Must be "files/xxxxx" format
     }
   }
   ```
3. Gemini 1.5 Flash generates response with file context
4. Frontend displays response with citation support

**Audio Generation Flow**
1. Frontend calls `/api/audio` with no body
2. Backend uses Gemini 2.0 Flash with system instruction to generate 2-person dialogue
3. Returns JSON array of `{ speaker, text }` objects
4. AudioPlayer component simulates playback with timed progression

## Important Technical Details

### Gemini File API
- Upload returns `file.uri` (full URL) but chat needs `file.name` (files/xxxxx format)
- MIME type detection: Force `text/plain` for `.txt` files detected as `application/octet-stream`
- File processing is asynchronous - must poll `getFile()` until state !== 'PROCESSING'
- Failed uploads leave orphaned files in `uploads/` - cleanup on error is critical

### Frontend State Management
- No Redux/Zustand - uses React `useState` for view state, messages, files
- Three views: `landing` (notebooks grid) → `upload` (source selector) → `studio` (chat interface)
- File list tracked in `files` state array with `{ name, type, checked }` structure
- Message history includes role ('user' | 'model'), content, citations array

### TypeScript Configuration
- `tsconfig.json` configured for React + ES modules
- Vite config aliases `@` to project root
- Environment variables passed via Vite's `define` config

## Known Issues

### Active Bug (see FIX_NEEDED.md)
Line 79 in `server.js` returns `uri: file.uri` but should return `uri: file.name` to match Gemini Chat API's expected format. The File API returns a full URL while the Chat API expects the short `files/xxxxx` format.

## Dependencies

**Critical Libraries**
- `@google/generative-ai` - Gemini SDK for chat and content generation
- `@google/generative-ai/server` - GoogleAIFileManager for file uploads
- `multer` - Multipart form handling for file uploads
- `lucide-react` - Icon library (Version pinned: 0.378.0)
- `express` 5.1.0 - Backend API server
- `cors` - Cross-origin resource sharing for dev mode

**Build Tools**
- Vite 6.2.0 with React plugin
- TypeScript 5.8.2
- Tailwind CSS (loaded via CDN in index.html)

## File Structure Notes

- `uploads/` - Temporary storage for files before Gemini upload (not tracked in git)
- `dist/` - Vite build output (not tracked in git)
- `metadata.json` - AI Studio project metadata
- Test files (`test_*.js`) use direct fetch to backend endpoints for debugging
- No separate `src/` directory - components live in `components/`, root files in project root
