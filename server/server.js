const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(cors({
  origin: '*',
}));

app.get('/', (req, res) => {
  res.send('<h1 style="font-family: sans-serif;">Hello, world!</h1>');
});

app.post('/convert', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    // Read the uploaded PDF file
    const pdfPath = path.resolve(req.file.path);
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Extract text from the PDF
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    if (!text.trim()) {
      return res.status(400).send('No readable text found in the PDF');
    }

    // Convert text to speech
    const gtts = new gTTS(text, 'en'); // Language: 'en' for English
    const audioPath = `output-${Date.now()}.mp3`;

    gtts.save(audioPath, (err) => {
      if (err) {
        console.error('Error generating audio:', err);
        return res.status(500).send('Error generating audio');
      }

      // Send audio file as a response
      res.download(audioPath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }

        // Clean up temporary files
        fs.unlinkSync(pdfPath);
        fs.unlinkSync(audioPath);
      });
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal server error');
  }
});

app.post('/text-to-audio', async (req, res) => {
  try {
    const { text } = req.body;
    const { lang = 'en' } = req.query;

    if (!text || !text.trim()) {
      return res.status(400).send('No text provided or text is empty');
    }

    // Convert text to speech
    const gtts = new gTTS(text, lang); // Language: 'en' for English
    const audioPath = `output-${Date.now()}.mp3`;

    gtts.save(audioPath, (err) => {
      if (err) {
        console.error('Error generating audio:', err);
        return res.status(500).send('Error generating audio');
      }

      // Send audio file as a response
      res.download(audioPath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
        }

        // Clean up temporary files
        fs.unlinkSync(audioPath);
      });
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
