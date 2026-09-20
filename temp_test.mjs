import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        console.log("Launching puppeteer...");
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
        page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
        
        console.log("Navigating to http://localhost:5175/ ...");
        await page.goto('http://localhost:5175/', { waitUntil: 'load', timeout: 10000 });
        
        console.log("Clicking 'Jadwal' tab...");
        await page.$$eval('button', buttons => {
            const btn = buttons.find(b => b.innerText.includes('Jadwal'));
            if(btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        
        console.log("Clicking 'Edit' button...");
        await page.$$eval('button', buttons => {
            const btn = buttons.find(b => b.innerText.includes('Edit'));
            if(btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 2000));
        
    } catch(e) {
        console.error("Puppeteer Script Error:", e);
    } finally {
        if(browser) await browser.close();
        console.log("Done.");
        process.exit(0);
    }
})();
