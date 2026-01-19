const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 1600, deviceScaleFactor: 2 } // High DPI
    });
    
    const page = await browser.newPage();
    const url = 'http://localhost:3005/_screenshots';
    const targetDir = path.join(__dirname, 'public/images');

    console.log(`Navigating to ${url}...`);
    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Ensure directory exists (though it should)
        if (!fs.existsSync(targetDir)){
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const targets = [
            { id: '#dashboard-mock', name: 'dashboard.png' },
            { id: '#durmah-mock', name: 'durmah.png' },
            { id: '#awy-mock', name: 'awy.png' },
            { id: '#yaag-mock', name: 'yaag.png' }
        ];

        for (const t of targets) {
            console.log(`Capturing ${t.name}...`);
            const element = await page.$(t.id);
            if (element) {
                await element.screenshot({ 
                    path: path.join(targetDir, t.name),
                    type: 'png'
                });
                console.log(`Saved ${t.name}`);
            } else {
                console.error(`Element ${t.id} not found!`);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
        process.exit(0);
    }
})();
