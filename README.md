# Indian Stock Indices List for TradingView

This project scrapes Indian stock indices from NSE India and converts them to TradingView-compatible format.

## Project Structure

```
indian-stock-indices-list-for-tradingview/
├── src/                         # TypeScript source files
│   ├── index.ts                # Main scraper script
│   └── config.ts               # Configuration (URLs, timeouts, paths)
├── scripts/                     # Shell scripts
│   └── convertToTradingView.sh # CSV to TradingView converter
├── output/                      # Generated output (gitignored)
│   ├── raw/                    # Raw CSV files from NSE India
│   └── tradingview/            # TradingView-ready format files
├── dist/                        # Compiled JavaScript (gitignored)
└── node_modules/               # Dependencies (gitignored)
```

## Installation

```bash
npm install
```

## Usage

### Quick Start (Recommended)
```bash
npm start
```
This will compile the TypeScript code and run the scraper in one command.

### Headless Mode (for CI/CD)
```bash
HEADLESS=true npm start
```

### Individual Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Download and convert indices**
   ```bash
   npm run download
   ```

### Clean Output
```bash
npm run clean
```
Removes both `dist/` and `output/` directories.

## Output

- **Raw CSVs**: `output/raw/*.csv` - Raw data from NSE India
- **TradingView TXT**: `output/tradingview/*.csv.txt` - TradingView format (comma-separated symbols with `NSE:` prefix)

## Indices Covered

- Nifty 50
- Nifty Next 50
- Nifty MidCap 150
- Nifty SmallCap 250
- Nifty MicroCap 250
- Securities in F&O