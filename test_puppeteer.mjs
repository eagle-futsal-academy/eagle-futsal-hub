import puppeteer from 'puppeteer';

(async () => {
    try {
        console.log("Launching puppeteer...");
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
        page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
        
        console.log("Navigating to http://localhost:5175/ ...");
        await page.goto('http://localhost:5175/', { waitUntil: 'networkidle0' });
        
        console.log("DOM HTML (body):");
        const bodyStr = await page.evaluate(() => document.body.innerHTML);
        console.log(bodyStr.substring(0, 500));
        
        await browser.close();
        console.log("Done.");
    } catch(e) {
        console.error("Puppeteer Script Error:", e);
    }
})();
