import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf

# Ensure yfinance cache writes to a local, writable directory
CACHE_DIR = Path(__file__).resolve().parent / ".yfinance-cache"
CACHE_DIR.mkdir(exist_ok=True)
yf.cache.set_cache_location(str(CACHE_DIR))

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# ---- Config ----
TICKER = sys.argv[1] if len(sys.argv) > 1 else "SPY"
START_CASH = 100_000.0
REBAL_DROP = float(sys.argv[2]) / 100 if len(sys.argv) > 2 else 0.03   # sell after % drop from trailing high
REBUY_REB  = float(sys.argv[3]) / 100 if len(sys.argv) > 3 else 0.02   # rebuy after % rebound from trough

def fetch_ytd_hourly(ticker: str) -> pd.DataFrame:
    """
    Fetch YTD hourly close prices using yfinance.
    Returns a DataFrame with index=Datetime (tz-aware) and column 'Close'.
    """
    try:
        # YTD hourly data
        df = yf.download(
            ticker,
            period="ytd",
            interval="1h",
            auto_adjust=True,   # adjust for splits/dividends
            progress=False
        )
        if df.empty:
            raise RuntimeError("No data returned from yfinance.")
        df = df[['Close']].dropna()
        # Ensure strictly increasing datetime index
        df = df[~df.index.duplicated(keep="last")].sort_index()
        logging.info("Fetched %s rows from yfinance for %s", len(df), ticker.upper())
        return df
    except Exception as exc:  # noqa: BLE001
        logging.warning("Live fetch failed for %s: %s", ticker.upper(), exc)
        fallback_path = DATA_DIR / f"{ticker.upper()}_ytd_hourly.csv"
        if not fallback_path.exists():
            raise RuntimeError(
                f"Unable to fetch data for {ticker.upper()} and no fallback file found at {fallback_path}."
            ) from exc
        logging.info("Falling back to %s", fallback_path)
        fallback_df = pd.read_csv(fallback_path)
        if {"timestamp", "Close"} - set(fallback_df.columns):
            raise RuntimeError(f"Fallback file {fallback_path} missing required columns.")
        fallback_df["timestamp"] = pd.to_datetime(fallback_df["timestamp"], utc=True, errors="coerce")
        fallback_df = fallback_df.dropna(subset=["timestamp"]).set_index("timestamp")
        fallback_df = fallback_df[["Close"]].sort_index()
        if fallback_df.empty:
            raise RuntimeError(f"Fallback file {fallback_path} did not yield any rows.")
        logging.info("Loaded %s rows from fallback for %s", len(fallback_df), ticker.upper())
        return fallback_df

def simulate_stoploss_reentry(prices: pd.Series,
                              start_cash=START_CASH,
                              drop=REBAL_DROP,
                              rebound=REBUY_REB):
    """
    Vector-walk simulation (hourly):
      - start fully invested at first bar
      - while holding, update trailing high; sell when price <= peak * (1 - drop)
      - while out, update trough; rebuy when price >= trough * (1 + rebound)
    Returns:
      portfolio (Series), holding_flags (Series[bool])
    """
    p = prices.values
    n = len(p)

    cash = 0.0
    shares = start_cash / p[0]
    holding = True
    peak = p[0]
    trough = p[0]

    portfolio = np.zeros(n)
    flags = np.zeros(n, dtype=bool)

    for i in range(n):
        price = float(p[i])

        if holding:
            peak = max(peak, price)
            # drawdown from trailing high
            if price <= peak * (1 - drop):
                # sell everything
                cash = shares * price
                shares = 0.0
                holding = False
                trough = price  # reset trough
        else:
            trough = min(trough, price)
            # rebound from trough
            if price >= trough * (1 + rebound):
                # buy back in
                shares = cash / price
                cash = 0.0
                holding = True
                peak = price  # reset peak

        portfolio[i] = cash + shares * price
        flags[i] = holding

    return pd.Series(portfolio, index=prices.index), pd.Series(flags, index=prices.index)

def main():
    df = fetch_ytd_hourly(TICKER)
    prices = df["Close"]

    # Calculate buy-and-hold portfolio
    buy_hold_portfolio = (START_CASH / prices.iloc[0]) * prices

    # Calculate strategy portfolio
    portfolio, holding_flags = simulate_stoploss_reentry(
        prices, start_cash=START_CASH, drop=REBAL_DROP, rebound=REBUY_REB
    )

    # --- Create CSV 1: Buy & Hold Portfolio ---
    buy_hold_df = pd.DataFrame({
        'timestamp': [str(ts) for ts in prices.index],
        'price': [float(p) for p in prices.values],
        'portfolio_value': [float(v) for v in buy_hold_portfolio.values]
    })
    buy_hold_df.to_csv('buy_hold_portfolio.csv', index=False)
    print("Saved: buy_hold_portfolio.csv")

    # --- Create CSV 2: Strategy Portfolio ---
    strategy_df = pd.DataFrame({
        'timestamp': [str(ts) for ts in portfolio.index],
        'portfolio_value': [float(v) for v in portfolio.values],
        'holding': [int(h) for h in holding_flags.values]  # 1 = holding, 0 = out of market
    })
    strategy_df.to_csv('strategy_portfolio.csv', index=False)
    print("Saved: strategy_portfolio.csv")

    # --- Summary stats ---
    final_strategy = float(portfolio.iloc[-1])
    final_buyhold = float(buy_hold_portfolio.iloc[-1])
    outperformance = float(final_strategy - final_buyhold)

    # Count trades = number of flips between holding True/False
    flips = (holding_flags.astype(int).diff().fillna(0).abs() == 1).sum()
    trades = int(flips)

    # --- Write HTML report (without chart images) ---
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{TICKER} Strategy Report</title>
<style>
  body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: #222; }}
  h1 {{ margin: 0 0 6px; }}
  .sub {{ color:#666; margin-bottom: 24px; }}
  .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin: 16px 0 24px; }}
  .card {{ border: 1px solid #eee; border-radius: 12px; padding: 16px; }}
  .k {{ color:#555; font-size: 14px; }}
  footer {{ margin-top: 28px; color:#777; font-size: 13px; }}
  code {{ background:#f6f8fa; padding: 2px 6px; border-radius: 6px; }}
</style>
</head>
<body>
  <h1>{TICKER} — YTD Hourly Report</h1>
  <div class="sub">Stop-loss (−3%) / Re-entry (+2%) simulation starting with ${START_CASH:,.0f}</div>

  <div class="cards">
    <div class="card">
      <div class="k">Final strategy value</div>
      <div style="font-size:24px; font-weight:700;">${final_strategy:,.2f}</div>
    </div>
    <div class="card">
      <div class="k">Buy & hold (benchmark)</div>
      <div style="font-size:24px; font-weight:700;">${final_buyhold:,.2f}</div>
    </div>
    <div class="card">
      <div class="k">Outperformance vs buy & hold</div>
      <div style="font-size:24px; font-weight:700; color:{'#0a7a2a' if outperformance>=0 else '#b00020'};">
        ${outperformance:,.2f}
      </div>
    </div>
    <div class="card">
      <div class="k">Trade flips (state changes)</div>
      <div style="font-size:24px; font-weight:700;">{trades}</div>
    </div>
  </div>

  <h2>Data Files Generated</h2>
  <ul>
    <li><code>buy_hold_portfolio.csv</code> - Buy & hold portfolio values over time</li>
    <li><code>strategy_portfolio.csv</code> - Stop-loss/re-entry strategy portfolio values over time</li>
  </ul>

  <footer>
    Generated with Python (<code>yfinance</code>, <code>pandas</code>). 
    CSV files ready for D3.js visualization.
  </footer>
</body>
</html>
"""

    with open("report.html", "w", encoding="utf-8") as f:
        f.write(html)

    print("\nReport written to: report.html")
    print(f"\nSummary:")
    print(f"  Strategy final value: ${final_strategy:,.2f}")
    print(f"  Buy & hold final value: ${final_buyhold:,.2f}")
    print(f"  Outperformance: ${outperformance:,.2f}")
    print(f"  Number of trades: {trades}")


if __name__ == "__main__":
    main()
