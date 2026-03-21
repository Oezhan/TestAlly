import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';
import { getLlmApiBaseUrl, isLlmConfigured } from './lib/llmConfig.js';
import { inferComponentFromPaste } from './lib/llmInferComponent.js';
import { probeLlmConnection } from './lib/llmProbe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo-root `.env` (works even if cwd is `server/`). Does not override vars already set in the shell.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.use(express.json({ limit: '60kb' }));

const MAX_INFER_CHARS = 50_000;

/** In-memory job ids until the real job manager exists (007). */
const analyzeJobs = new Map<string, true>();

app.post('/api/analyze', (req, res) => {
    const body = req.body as {
        code?: string;
        language?: string;
        description?: string;
        css?: string;
        js?: string;
    };
    if (!body?.code || typeof body.code !== 'string' || !body.code.trim()) {
        res.status(400).json({ error: 'Bad Request', message: 'code is required' });
        return;
    }
    const jobId = `job_${randomBytes(6).toString('hex')}`;
    analyzeJobs.set(jobId, true);
    res.status(202).json({
        status: 'accepted',
        jobId,
        statusUrl: `/api/status/${jobId}`,
        resultsUrl: `/api/manual-test/${jobId}`,
    });
});

app.get('/api/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    if (!analyzeJobs.has(jobId)) {
        res.status(404).json({ error: 'Not Found', message: 'Unknown job' });
        return;
    }
    res.json({
        status: 'completed',
        jobId,
        phase: 'COMPLETE',
        phaseIndex: 1,
        totalPhases: 1,
        description: 'Stub pipeline — replace with real analysis jobs.',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        resultsUrl: `/api/manual-test/${jobId}`,
    });
});

app.get('/api/manual-test/:jobId', (req, res) => {
    const { jobId } = req.params;
    if (!analyzeJobs.has(jobId)) {
        res.status(404).json({ error: 'Not Found', message: 'Unknown job' });
        return;
    }
    res.json({
        status: 'success',
        jobId,
        analysis: {
            component: {
                type: 'stub',
                description: 'Replace with real pipeline output.',
                confidence: 0,
            },
            automatedResults: {
                axeViolations: [],
                eslintMessages: [],
                customRuleFlags: [],
            },
            manualTests: [],
            allClear: true,
            summary: 'Analysis pipeline not wired yet — this is a placeholder response.',
        },
        metadata: {
            analysisTimeMs: 0,
            llmModelPrimary: 'n/a',
            llmModelValidation: 'n/a',
            axeVersion: 'n/a',
        },
    });
});

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        llm: {
            configured: isLlmConfigured(),
        },
    });
});

/** Active connectivity check: Ollama /api/tags or OpenAI-compatible GET /v1/models */
app.get('/api/health/llm', async (_req, res) => {
    if (!isLlmConfigured()) {
        res.status(503).json({
            ok: false,
            via: 'none',
            message: 'LLM_API_URL is not set',
        });
        return;
    }
    const result = await probeLlmConnection();
    if (result.ok) {
        res.json(result);
        return;
    }
    res.status(502).json(result);
});

/**
 * LLM-based split + classify for pasted component material (OpenAI-compatible API at LLM_API_URL).
 */
app.post('/api/infer-component', async (req, res) => {
    const raw = typeof req.body?.raw === 'string' ? req.body.raw : '';
    if (!raw.trim()) {
        res.status(400).json({ error: 'Bad Request', message: 'raw is required' });
        return;
    }
    if (!isLlmConfigured()) {
        res.status(503).json({
            error: 'Service Unavailable',
            message: 'LLM not configured (set LLM_API_URL)',
        });
        return;
    }
    try {
        const result = await inferComponentFromPaste(raw.slice(0, MAX_INFER_CHARS));
        res.json(result);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'LLM request failed';
        console.error('[infer-component]', err);
        res.status(502).json({ error: 'Bad Gateway', message });
    }
});

if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '../../client/dist');

    app.use(express.static(clientDist));

    app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`TestAlly server running on port ${PORT}`);
    const llmBase = getLlmApiBaseUrl();
    if (llmBase) {
        console.log(`LLM API base URL: ${llmBase.origin}`);
    } else {
        console.log('LLM_API_URL not set — configure LLM_API_URL (and optional LLM_TOKEN) for generation');
    }
});
