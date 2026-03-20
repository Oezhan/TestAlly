import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy' });
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
});
