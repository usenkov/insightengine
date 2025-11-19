import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
  const filePath = path.join(__dirname, 'test.txt');
  if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'This is a test file for upload.');
  }

  try {
    const fileBlob = await fs.openAsBlob(filePath);
    const formData = new FormData();
    formData.append('file', fileBlob, 'test.txt');

    console.log('Attempting upload to http://localhost:3001/api/upload...');
    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);

  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testUpload();
