const { exec } = require('child_process');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

(async () => {
	const browser = await puppeteer.launch({ headless: false, args: ['--disable-http2'] });
	const page = await browser.newPage();
	
	// Set a custom user agent
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

	// Override navigator.webdriver to prevent detection
	await page.evaluateOnNewDocument(() => {
		Object.defineProperty(navigator, 'webdriver', { get: () => false });
	});

	// Set extra HTTP headers to mimic real browsers
	await page.setExtraHTTPHeaders({
		'Accept-Language': 'en-US,en;q=0.9',
		'Referer': 'https://www.nseindia.com',
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Accept': 'text/csv, application/json, text/plain, */*'
	});

	await page.goto('https://www.nseindia.com', { waitUntil: 'networkidle2' });
	await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
	console.log('Visited first URL');

	// Navigate to CSV URL and download the file
	const csvUrls = {
		Nifty50:			'https://www.nseindia.com/api/equity-stockIndices?csv=true&index=NIFTY%2050&selectValFormat=crores',
		NiftyNext50:		'https://www.nseindia.com/api/equity-stockIndices?csv=true&index=NIFTY%20NEXT%2050&selectValFormat=crores',
		NiftyMidCap150:		'https://www.nseindia.com/api/equity-stockIndices?csv=true&index=NIFTY%20MIDCAP%20150&selectValFormat=crores',
		NiftySmallCap250:	'https://www.nseindia.com/api/equity-stockIndices?csv=true&index=NIFTY%20SMALLCAP%20250&selectValFormat=crores',
		NiftyMicroCap250:	'https://www.nseindia.com/api/equity-stockIndices?csv=true&index=NIFTY%20MICROCAP%20250&selectValFormat=crores',
		FnO:				'https://www.nseindia.com/api/equity-stockIndices?csv=true&index=SECURITIES%20IN%20F%26O&selectValFormat=crores'
	};

	for(const [ fileName, csvUrl ] of Object.entries(csvUrls)) {
		const csvData = await page.evaluate((csvUrl: string) => {
			return fetch(csvUrl, {
				method: 'GET',
				headers: {
					'Accept': 'text/csv, application/json, text/plain, */*',
					'Referer': 'https://www.nseindia.com'
				}
			})
			.then(response => response.text())
			.catch(error => `Fetch failed: ${error}`);
		}, csvUrl);
		
		const downloadPath = path.resolve(__dirname, `../../DownloadedIndices/${fileName}.csv`);
		fs.writeFileSync(downloadPath, csvData);
		console.log('CSV file downloaded successfully.');
	}

	await browser.close();


	
	const scriptPath = path.resolve(__dirname, '../../ScripConverter.sh');

	exec(`sh "${scriptPath}"`, (error: Error | null, stdout: string, stderr: string) => {
		if (error) {
			console.error(`Error executing script: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`Script stderr: ${stderr}`);
			return;
		}
		console.log(`Script output: ${stdout}`);
	});
})();