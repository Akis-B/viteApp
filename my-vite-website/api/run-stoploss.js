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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return createErrorResponse(res, 405, 'Method not allowed');
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return createErrorResponse(res, 500, 'FINNHUB_API_KEY is not set');
  }

  const ticker = typeof req.query.ticker === 'string' && req.query.ticker.trim()
    ? req.query.ticker.trim().toUpperCase()
    : 'SPY';

  const stopLossParam = parseFloat(typeof req.query.stopLoss === 'string' ? req.query.stopLoss : `${DEFAULT_DROP}`);
  const reEntryParam = parseFloat(typeof req.query.reEntry === 'string' ? req.query.reEntry : `${DEFAULT_REENTRY}`);

  const dropPct = Math.abs(isNaN(stopLossParam) ? DEFAULT_DROP : stopLossParam) / 100;
  const reEntryPct = Math.abs(isNaN(reEntryParam) ? DEFAULT_REENTRY : reEntryParam) / 100;

  const now = Math.floor(Date.now() / 1000);
  const startOfYear = Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000);

  const candleUrl = new URL('https://finnhub.io/api/v1/stock/candle');
  candleUrl.searchParams.set('symbol', ticker);
  candleUrl.searchParams.set('resolution', '60');
  candleUrl.searchParams.set('from', `${startOfYear}`);
  candleUrl.searchParams.set('to', `${now}`);
  candleUrl.searchParams.set('token', apiKey);

  try {
    const response = await fetch(candleUrl.toString());
    if (!response.ok) {
      return createErrorResponse(res, response.status, `Finnhub error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.s !== 'ok' || !Array.isArray(data.c) || data.c.length === 0) {
      return createErrorResponse(res, 502, 'No candle data returned from Finnhub');
    }

    const prices = data.c;
    const timestamps = data.t.map((unix) => new Date(unix * 1000).toISOString());

    const { strategyPortfolio, buyHoldPortfolio } = simulateStrategy(prices, timestamps, dropPct, reEntryPct);

    return res.status(200).json({
      success: true,
      data: {
        buyHold: buyHoldPortfolio,
        strategy: strategyPortfolio
      }
    });
  } catch (error) {
    console.error('Error fetching Finnhub data:', error);
    return createErrorResponse(res, 500, 'Failed to fetch data from Finnhub');
  }
}
