import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  classifyGeminiError,
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
      const classified = classifyGeminiError(err);
      console.error(
        `[KrishiSetu /api/diagnose error] (${classified.category}, HTTP ${classified.httpStatus}):`,
        classified.rawMessage
      );

      if (classified.retryAfterSec) {
        res.setHeader('Retry-After', String(classified.retryAfterSec));
      }

      res.status(classified.httpStatus).json({
        error: classified.userMessage,
        code: classified.category,
        retryAfterSec: classified.retryAfterSec,
        retryable: classified.retryable,
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
      const classified = classifyGeminiError(err);
      console.error(
        `[KrishiSetu /api/tts error] (${classified.category}, HTTP ${classified.httpStatus}):`,
        classified.rawMessage
      );
      res.status(classified.httpStatus).json({
        error: 'Voice playback unavailable via Gemini TTS.',
        code: classified.category,
      });
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
