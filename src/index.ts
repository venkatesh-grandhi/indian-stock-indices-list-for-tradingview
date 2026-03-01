import { exec } from 'child_process';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { config, buildCsvUrl, DownloadResult } from './config';

puppeteer.use(StealthPlugin());

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch CSV with retry logic and exponential backoff
 */
async function fetchWithRetry(
	page: Page,
	csvUrl: string,
	maxRetries: number = config.timeouts.maxRetries
): Promise<string> {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		const result = await page.evaluate((url: string) => {
			return fetch(url, {
				method: 'GET',
				headers: {
					'Accept': 'text/csv, application/json, text/plain, */*',
					'Referer': 'https://www.nseindia.com'
				}
			})
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				return response.text();
			})
			.catch(error => `Fetch failed: ${error}`);
		}, csvUrl);

		if (!result.startsWith('Fetch failed')) {
			return result;
		}

		console.warn(`Attempt ${attempt}/${maxRetries} failed for ${csvUrl}`);
		
		if (attempt < maxRetries) {
			const backoffDelay = config.timeouts.retryDelay * Math.pow(2, attempt - 1);
			console.log(`Retrying in ${backoffDelay}ms...`);
			await delay(backoffDelay);
		}
	}
	
	throw new Error(`Failed to fetch after ${maxRetries} retries: ${csvUrl}`);
}

(async () => {
	const results: DownloadResult[] = [];
	
	const browser = await puppeteer.launch({
		headless: config.browser.headless,
		args: [...config.browser.args]
	});
	const page = await browser.newPage();
	
	// Set a custom user agent
	await page.setUserAgent(config.browser.userAgent);

	// Override navigator.webdriver to prevent detection
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'webdriver', { get: () => false });
	});

	// Set extra HTTP headers to mimic real browsers
	await page.setExtraHTTPHeaders({
		'Accept-Language': 'en-US,en;q=0.9',
		'Referer': config.nseHomepage,
		'Accept': 'text/csv, application/json, text/plain, */*'
	});

	await page.goto(config.nseHomepage, { waitUntil: 'networkidle2' });
	await delay(config.timeouts.pageLoad);
	console.log('Visited NSE homepage, cookies set');

	// Download CSV for each index
	for (const [fileName, indexParam] of Object.entries(config.indices)) {
		const csvUrl = buildCsvUrl(indexParam);
		
		try {
			const csvData = await fetchWithRetry(page, csvUrl);
			
			const rawDir = path.resolve(__dirname, config.paths.rawDir);
			if (!fs.existsSync(rawDir)) {
				fs.mkdirSync(rawDir, { recursive: true });
			}
			const downloadPath = path.join(rawDir, `${fileName}.csv`);
			fs.writeFileSync(downloadPath, csvData);
			
			console.log(`Downloaded: ${fileName}.csv`);
			results.push({ fileName, success: true });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Failed to download ${fileName}: ${errorMessage}`);
			results.push({ fileName, success: false, error: errorMessage });
		}
	}

	await browser.close();

	// Summary
	const successful = results.filter(r => r.success).length;
	const failed = results.filter(r => !r.success).length;
	console.log(`\nDownload complete: ${successful} succeeded, ${failed} failed`);

	if (failed > 0) {
		console.error('Failed downloads:', results.filter(r => !r.success).map(r => r.fileName).join(', '));
	}

	// Run conversion script
	const scriptPath = path.resolve(__dirname, config.paths.converterScript);

	exec(`bash "${scriptPath}"`, (error: Error | null, stdout: string, stderr: string) => {
		if (error) {
			console.error(`Error executing script: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`Script stderr: ${stderr}`);
			return;
		}
		console.log(`Script output:\n${stdout}`);
	});
})();