import express from 'express';
import cors from 'cors';
import runStopLoss from './api/run-stoploss.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to run Python script and return CSV data
app.get('/api/run-stoploss', async (req, res) => {
    console.log('Processing stop-loss request', req.query);
    await runStopLoss(req, res);
});

const startServer = async () => {
    try {
        await app.listen(PORT);
        console.log(`API server running on http://localhost:${PORT}`);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
