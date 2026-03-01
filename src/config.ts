/**
 * Configuration for the Indian Stock Indices downloader
 */

export interface IndexConfig {
	name: string;
	urlParam: string;
}

export interface DownloadResult {
	fileName: string;
	success: boolean;
	error?: string;
}

export const config = {
	// NSE API base URL
	baseUrl: 'https://www.nseindia.com/api/equity-stockIndices',
	
	// NSE homepage for initial visit (sets cookies)
	nseHomepage: 'https://www.nseindia.com',
	
	// Stock indices to download
	indices: {
		Nifty50: 'NIFTY%2050',
		NiftyNext50: 'NIFTY%20NEXT%2050',
		NiftyMidCap150: 'NIFTY%20MIDCAP%20150',
		NiftySmallCap250: 'NIFTY%20SMALLCAP%20250',
		NiftyMicroCap250: 'NIFTY%20MICROCAP%20250',
		FnO: 'SECURITIES%20IN%20F%26O',
	} as Record<string, string>,
	
	// Browser configuration
	browser: {
		headless: process.env.HEADLESS === 'true',
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		args: ['--disable-http2'],
	},
	
	// Timing configuration (in milliseconds)
	timeouts: {
		pageLoad: 3000,
		retryDelay: 1000,
		maxRetries: 3,
	},
	
	// Output directories (relative to src/)
	paths: {
		rawDir: '../output/raw',
		converterScript: '../scripts/convertToTradingView.sh',
	},
} as const;

/**
 * Build the full CSV download URL for an index
 */
export function buildCsvUrl(indexParam: string): string {
	return `${config.baseUrl}?csv=true&index=${indexParam}&selectValFormat=crores`;
}
