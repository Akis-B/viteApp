import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to run Python script and return CSV data
app.get('/api/run-stoploss', async (req, res) => {
    try {
        const ticker = req.query.ticker || 'SPY';
        const stopLoss = req.query.stopLoss || '3';
        const reEntry = req.query.reEntry || '2';
        console.log(`Running Python script for ticker: ${ticker}, stopLoss: ${stopLoss}%, reEntry: ${reEntry}%...`);

        // Run the Python script with ticker and strategy arguments
        const { stdout, stderr } = await execAsync(`python3 src/PythonTickerThing.py ${ticker} ${stopLoss} ${reEntry}`, {
            cwd: __dirname,
            timeout: 60000 // 60 second timeout
        });

        if (stderr) {
            console.warn('Python stderr:', stderr);
        }

        console.log('Python output:', stdout);

        // Read the generated CSV files
        const buyHoldPath = path.join(__dirname, 'buy_hold_portfolio.csv');
        const strategyPath = path.join(__dirname, 'strategy_portfolio.csv');

        const [buyHoldCsv, strategyCsv] = await Promise.all([
            fs.readFile(buyHoldPath, 'utf-8'),
            fs.readFile(strategyPath, 'utf-8')
        ]);

        // Parse CSV to JSON
        const parseCSV = (csv) => {
            const lines = csv.trim().split('\n');
            const headers = lines[0].split(',');
            return lines.slice(1).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index];
                    return obj;
                }, {});
            });
        };

        const buyHoldData = parseCSV(buyHoldCsv);
        const strategyData = parseCSV(strategyCsv);

        res.json({
            success: true,
            data: {
                buyHold: buyHoldData,
                strategy: strategyData
            }
        });

    } catch (error) {
        console.error('Error running Python script:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
