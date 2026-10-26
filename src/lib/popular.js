// Fortune 100 (2026): US exchange-listed stocks among the top 100 companies by revenue.
// Companies without a standard exchange-listed ticker are excluded.
// One ticker per company; Alphabet uses GOOGL and Berkshire Hathaway uses BRK.B.
// Source: https://fortune.com/ranking/fortune500/
// Ranking cross-check: https://www.sheetsteps.com/data/fortune-100-companies-2026

export const POPULAR_TICKERS = new Set([
  'AMZN', 'WMT', 'UNH', 'AAPL', 'GOOGL', 'CVS', 'BRK.B', 'MCK', 'XOM', 'COR',
  'MSFT', 'JPM', 'COST', 'CI', 'CAH', 'NVDA', 'META', 'ELV', 'CNC', 'BAC',
  'CVX', 'F', 'GM', 'C', 'HD', 'KR', 'VZ', 'PSX', 'MPC', 'SNEX',
  'HUM', 'T', 'GS', 'CMCSA', 'WFC', 'MS', 'VLO', 'DELL', 'TGT', 'TSLA',
  'DIS', 'JNJ', 'PEP', 'BA', 'UPS', 'RTX', 'FDX', 'PGR', 'LOW', 'ET',
  'PG', 'SYY', 'AXP', 'ACI', 'ADM', 'MET', 'HCA', 'LMT', 'COF', 'ALL',
  'CAT', 'IBM', 'LLY', 'MRK', 'AVGO', 'DAL', 'PFE', 'SNX', 'COP', 'GLXY',
  'ABBV', 'PRU', 'TJX', 'PFGC', 'UAL', 'ORCL', 'CSCO', 'HPQ', 'CHTR', 'AAL',
  'TSN', 'INTC', 'EPD', 'INGM', 'GD', 'UBER', 'TRV', 'BMY', 'KO', 'NKE',
]);
