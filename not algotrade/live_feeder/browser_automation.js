const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');

// Use the stealth plugin
puppeteer.use(StealthPlugin());

async function openUrl(url) {
  // Generate a random user agent
  const userAgent = randomUseragent.getRandom();
  
  // Launch a new browser instance with additional stealth options
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certifcate-errors',
      '--ignore-certifcate-errors-spki-list',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // Override the permissions API
  await page.evaluateOnNewDocument(() => {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  // Override the webdriver property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  // Override the languages property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  });

  // Override the plugins property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
  });

  // Set a realistic viewport size
  await page.setViewport({
    width: 1366 + Math.floor(Math.random() * 100),
    height: 768 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false
  });

  // Set the random user agent
  await page.setUserAgent(userAgent);

  // Set additional headers to appear more like a real browser
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1'
  });

  // Enable JavaScript and cookies
  await page.setJavaScriptEnabled(true);
  await page.setCookie({
    name: 'cookieconsent_status',
    value: 'dismiss',
    domain: new URL(url).hostname
  });

  // Handle Cloudflare challenges
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('challenges.cloudflare.com')) {
      console.log('Cloudflare challenge detected');
      // Wait for the challenge to be solved
      await page.waitForFunction(() => {
        return !document.querySelector('iframe[src*="challenges.cloudflare.com"]');
      }, { timeout: 30000 });
    }
  });

  // Add random mouse movements and delays to simulate human behavior
  await page.goto(url, {
    waitUntil: ['networkidle0', 'domcontentloaded'],
    timeout: 90000
  });

  // Simulate random mouse movements
  await page.mouse.move(
    Math.random() * 800,
    Math.random() * 600,
    { steps: 50 }
  );

  // Wait for URL to change
  console.log('Initial URL:', url);
  
  try {
    // Wait for navigation with longer timeout
    await page.waitForNavigation({ 
      timeout: 90000, // 90 second timeout
      waitUntil: ['networkidle0', 'domcontentloaded']
    });
    
    // Wait for the page to fully load
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 45000 }); // 45 second timeout
    
    console.log('Page fully loaded');
    console.log('URL changed to:', page.url());
  } catch (error) {
    console.error('Error while waiting for URL change:', error.message);
  }

  // Capture and print the final URL after any redirections
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);

  // Extract the authorization code from the URL if it's a redirect from Fyers
  if (finalUrl.includes('code=')) {
    const urlObj = new URL(finalUrl);
    const authCode = urlObj.searchParams.get('code');
    if (authCode) {
      console.log('Authorization code extracted:', authCode);
      return authCode;
    }
  }
  
  return finalUrl;
}

// Export the function to be used in other scripts
module.exports = { openUrl };
