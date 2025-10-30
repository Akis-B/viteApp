const START_CASH = 100_000;
const DEFAULT_DROP = 3;
const DEFAULT_REENTRY = 2;

const createErrorResponse = (res, status, message) => {
  res.status(status).json({ success: false, error: message });
};

const simulateStrategy = (prices, timestamps, dropPct, reEntryPct) => {
  let cash = 0;
  let shares = START_CASH / prices[0];
  let holding = true;
  let peak = prices[0];
  let trough = prices[0];

  const strategyPortfolio = [];
  const buyHoldPortfolio = [];

  prices.forEach((price, index) => {
    if (holding) {
      peak = Math.max(peak, price);
      if (price <= peak * (1 - dropPct)) {
        cash = shares * price;
        shares = 0;
        holding = false;
        trough = price;
      }
    } else {
      trough = Math.min(trough, price);
      if (price >= trough * (1 + reEntryPct)) {
        shares = cash / price;
        cash = 0;
        holding = true;
        peak = price;
      }
    }

    const portfolioValue = cash + shares * price;
    const buyHoldValue = (START_CASH / prices[0]) * price;

    strategyPortfolio.push({
      timestamp: timestamps[index],
      portfolio_value: portfolioValue.toFixed(2),
      holding: holding ? '1' : '0'
    });

    buyHoldPortfolio.push({
      timestamp: timestamps[index],
      price: price.toFixed(2),
      portfolio_value: buyHoldValue.toFixed(2)
    });
  });

  return { strategyPortfolio, buyHoldPortfolio };
};

const fetchAlphaVantageData = async (ticker, apiKey) => {
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'TIME_SERIES_INTRADAY');
  url.searchParams.set('symbol', ticker);
  url.searchParams.set('interval', '60min');
  url.searchParams.set('outputsize', 'full');
  url.searchParams.set('apikey', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Alpha Vantage error: ${response.statusText}`);
  }

  const payload = await response.json();

  if (payload.Note) {
    throw new Error('Alpha Vantage rate limit reached. Please try again later.');
  }

  if (payload['Error Message']) {
    throw new Error(payload['Error Message']);
  }

  const series = payload['Time Series (60min)'];
  if (!series || typeof series !== 'object') {
    throw new Error('No intraday data returned from Alpha Vantage.');
  }

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const entries = Object.entries(series)
    .map(([timestamp, values]) => {
      const close = parseFloat(values['4. close']);
      const date = new Date(`${timestamp}Z`);
      return {
        timestamp,
        isoTimestamp: date.toISOString(),
        close,
        date
      };
    })
    .filter(({ close, date }) => Number.isFinite(close) && date >= startOfYear)
    .sort((a, b) => a.date - b.date);

  if (entries.length === 0) {
    throw new Error('Alpha Vantage response did not contain recent daily data.');
  }

  return {
    prices: entries.map((entry) => entry.close),
    timestamps: entries.map((entry) => entry.isoTimestamp)
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return createErrorResponse(res, 405, 'Method not allowed');
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return createErrorResponse(res, 500, 'ALPHA_VANTAGE_API_KEY is not set');
  }

  const ticker = typeof req.query.ticker === 'string' && req.query.ticker.trim()
    ? req.query.ticker.trim().toUpperCase()
    : 'SPY';

  const stopLossParam = parseFloat(typeof req.query.stopLoss === 'string' ? req.query.stopLoss : `${DEFAULT_DROP}`);
  const reEntryParam = parseFloat(typeof req.query.reEntry === 'string' ? req.query.reEntry : `${DEFAULT_REENTRY}`);

  const dropPct = Math.abs(isNaN(stopLossParam) ? DEFAULT_DROP : stopLossParam) / 100;
  const reEntryPct = Math.abs(isNaN(reEntryParam) ? DEFAULT_REENTRY : reEntryParam) / 100;

  try {
    const { prices, timestamps } = await fetchAlphaVantageData(ticker, apiKey);
    const { strategyPortfolio, buyHoldPortfolio } = simulateStrategy(prices, timestamps, dropPct, reEntryPct);

    return res.status(200).json({
      success: true,
      data: {
        buyHold: buyHoldPortfolio,
        strategy: strategyPortfolio
      }
    });
  } catch (error) {
    console.error('Error fetching Alpha Vantage data:', error);
    return createErrorResponse(res, 502, error.message || 'Failed to fetch data from Alpha Vantage');
  }
}
