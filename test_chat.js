import fetch from 'node-fetch';

async function testChat() {
  try {
    // Use the URI from the previous successful upload test
    // Note: This URI might be expired or invalid if the server restarted, but let's try.
    // Ideally we should upload a new file first.
    
    // 1. Upload a file first
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const filePath = path.join(__dirname, 'test.txt');
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, 'This is a test file for upload.');
    }
    
    const fileBlob = await fs.openAsBlob(filePath);
    const formData = new FormData();
    formData.append('file', fileBlob, 'test.txt');

    console.log('Uploading file...');
    const uploadResponse = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('Upload successful:', uploadData);
    
    const fileUri = uploadData.uri;
    const mimeType = uploadData.mimeType;

    // 2. Chat with the file
    console.log(`Chatting with file: ${fileUri} (${mimeType})...`);
    const chatResponse = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: "Summarize this file",
        fileUri: fileUri,
        mimeType: mimeType
      })
    });

    console.log('Chat Response status:', chatResponse.status);
    const text = await chatResponse.text();
    console.log('Chat Response body:', text);

  } catch (error) {
    console.error('Test Error:', error);
  }
}

testChat();
