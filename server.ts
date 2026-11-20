import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  diagnoseCrop,
  synthesizeSpeech,
  type DiagnoseInput,
  type SupportedLanguage,
} from './src/server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'krishisetu' });
  });

  app.post('/api/diagnose', async (req, res) => {
    try {
      const body = req.body as Partial<DiagnoseInput>;
      const language: SupportedLanguage =
        body.language === 'bn' || body.language === 'hi' || body.language === 'en'
          ? body.language
          : 'en';

      if (!body.imageBase64 && !body.audioBase64 && !body.noteText?.trim()) {
        res.status(400).json({
          error: 'Please add a crop photo, record a voice note, or write a short description.',
          retryable: false,
        });
        return;
      }

      const result = await diagnoseCrop({
        imageBase64: body.imageBase64,
        imageMimeType: body.imageMimeType,
        audioBase64: body.audioBase64,
        audioMimeType: body.audioMimeType,
        noteText: body.noteText,
        language,
        district: body.district,
        cropHint: body.cropHint,
      });

      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected server error';
      console.error('[KrishiSetu /api/diagnose error]:', message);

      let statusCode = 502;
      let userMessage = 'Could not reach the crop advisor right now. Please tap Try Again.';

      if (message.includes('GEMINI_API_KEY') || message.includes('API_KEY_INVALID') || message.includes('403')) {
        statusCode = 500;
        userMessage =
          'The AI advisor key is not configured yet. Please check Settings > Secrets in AI Studio.';
      } else if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
        statusCode = 429;
        userMessage = 'Too many crop checks at once. Please wait a few seconds and tap Try Again.';
      }

      res.status(statusCode).json({
        error: userMessage,
        details: message,
        retryable: statusCode !== 500,
      });
    }
  });

  app.post('/api/tts', async (req, res) => {
    try {
      const { text, language } = req.body as {
        text?: string;
        language?: SupportedLanguage;
      };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required for speech output.' });
        return;
      }

      const lang: SupportedLanguage =
        language === 'bn' || language === 'hi' || language === 'en' ? language : 'en';

      const audio = await synthesizeSpeech(text.trim(), lang);
      res.json(audio);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'TTS generation failed';
      console.error('[KrishiSetu /api/tts error]:', message);
      res.status(502).json({ error: 'Voice playback unavailable via Gemini TTS.', details: message });
    }
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KrishiSetu server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start KrishiSetu server:', err);
  process.exit(1);
});
