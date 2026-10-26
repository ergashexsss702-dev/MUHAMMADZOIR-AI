import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Simple Rate Limiting Map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

const rateLimiter = (req: Request, res: Response, next: () => void) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'client';
  const ipKey = Array.isArray(ip) ? ip[0] : String(ip);
  const now = Date.now();

  const record = rateLimitMap.get(ipKey);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ipKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: "So'rovlar soni me'yoridan oshdi. Iltimos, bir daqiqadan so'ng qayta urinib ko'ring (Rate limit exceeded).",
    });
  }

  record.count++;
  next();
};

app.use('/api', rateLimiter);

// System prompt default for ZOIR AI
const DEFAULT_SYSTEM_INSTRUCTION = `Siz "ZOIR AI" - O'zbekiston va butun dunyo foydalanuvchilari uchun maxsus yaratilgan eng aqlli, muloyim va kuchli universal AI yordamchisiz.
Asosiy vazifalaringiz va fazilatlaringiz:
1. Til: Foydalanuvchi qaysi tilda murojaat qilsa (o'zbek, rus, ingliz va boshqa tillar), o'sha tilda ravon, tushunarli, tabiiy va imloviy xatosiz javob bering. O'zbek tilidagi so'rovlarga zamonaviy adabiy o'zbek tilida, aniq va hurmat bilan ("Siz" deb) javob bering.
2. Dasturlash: Python, JavaScript, TypeScript, React, HTML/CSS, SQL, C++, Java, PHP, Go kabi dasturlash tillarida to'liq, xatosiz, izohlangan va ishlaydigan kodlar yozing. Kodlarni chiroyli Markdown bloklarida taqdim eting.
3. Strukturaviy javob: Javoblarni o'qish qulay bo'lishi uchun sarlavhalar, ro'yxatlar, qalin shrift (bold) va jadvallardan o'rinli foydalaning.
4. Aniqlik va samimiylik: Har doim to'g'ri, faktik tekshirilgan va xavfsiz ma'lumot bering. Agar savol noaniq bo'lsa, aniqlashtirish so'rang.
5. Imkoniyatlar: Tarjima, matnlarni xulosa qilish (summarization), insholar, biznes rejalari, tahlillar va maslahatlar berish.`;

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'ZOIR AI',
    version: '1.0.0',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// API Chat Endpoint (Supports both SSE streaming and standard JSON)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      prompt,
      model = 'gemini-2.5-flash',
      stream = true,
      systemInstruction = DEFAULT_SYSTEM_INSTRUCTION,
      temperature = 0.7,
      useSearch = false,
      images = [],
    } = req.body;

    if (!messages.length && !prompt) {
      return res.status(400).json({ error: "Xabar yoki so'rov matni kiritilmadi (Prompt or messages required)." });
    }

    // Prepare contents array for @google/genai
    const contents: any[] = [];

    if (messages.length > 0) {
      for (const m of messages) {
        const parts: any[] = [];
        if (m.images && Array.isArray(m.images)) {
          for (const img of m.images) {
            parts.push({
              inlineData: {
                mimeType: img.mimeType || 'image/jpeg',
                data: img.data, // base64 string without data:image/... prefix
              },
            });
          }
        }
        if (m.text || m.content) {
          parts.push({ text: m.text || m.content });
        }
        contents.push({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts,
        });
      }
    } else {
      const parts: any[] = [];
      if (images && Array.isArray(images)) {
        for (const img of images) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: img.data,
            },
          });
        }
      }
      parts.push({ text: prompt });
      contents.push({
        role: 'user',
        parts,
      });
    }

    const selectedModel = model || 'gemini-2.5-flash';

    const config: any = {
      systemInstruction,
      temperature: Number(temperature) || 0.7,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const candidateModels = [
      selectedModel,
      selectedModel === 'gemini-2.5-flash' ? 'gemini-3.8-flash' : 'gemini-2.5-flash',
      'gemini-3.1-flash-lite',
    ].filter((v, i, a) => a.indexOf(v) === i);

    if (stream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let streamSucceeded = false;
      let lastErrorMessage = '';

      for (const currentModel of candidateModels) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents,
            config,
          });

          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ text, model: currentModel })}\n\n`);
            }
          }

          res.write('data: [DONE]\n\n');
          streamSucceeded = true;
          return res.end();
        } catch (err: any) {
          console.warn(`Model ${currentModel} error:`, err?.message || err);
          lastErrorMessage = err?.message || 'Model xatoligi';
          // Continue to next candidate model
        }
      }

      if (!streamSucceeded) {
        res.write(`data: ${JSON.stringify({ 
          error: "Hozirda sun'iy intellekt xizmati band bo'lganligi sababli so'rovni bajarib bo'lmadi. Iltimos, bir necha soniyadan so'ng qayta urinib ko'ring (" + lastErrorMessage + ")" 
        })}\n\n`);
        return res.end();
      }
    } else {
      // Unary non-streaming call with fallback
      let lastError: any = null;

      for (const currentModel of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents,
            config,
          });

          return res.json({
            text: response.text,
            model: currentModel,
          });
        } catch (err: any) {
          console.warn(`Unary model ${currentModel} error:`, err?.message || err);
          lastError = err;
        }
      }

      return res.status(503).json({
        error: "Hozirda modellar yuqori yuklama ostida. Iltimos, ozgina kutib qayta urinib ko'ring (" + (lastError?.message || '') + ")",
      });
    }
  } catch (error: any) {
    console.error('API Chat Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: error.message || "Kutilmagan server xatoligi yuz berdi. Iltimos qaytadan urinib ko'ring.",
      });
    }
  }
});

// API Text-to-Speech (TTS) using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Limit text length for TTS to prevent timeouts
    const trimmedText = text.slice(0, 1000);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: 'Natural, clear, helpful and articulate',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Audio generatsiya qilinmadi' });
    }

    return res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS Error:', err);
    return res.status(500).json({ error: err.message || 'TTS xatolik' });
  }
});

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZOIR AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
