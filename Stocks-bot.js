const puppeteer = require('puppeteer-core');
const COOKIE_VALUE = 'حط_هنا_الكوكي_اللي_جبته'; // ضع الكوكي هنا

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(15000);

  try {
    // الدخول المباشر بالكوكي (بدون شاشة تحقق)
    await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
    await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log("✅ دخلنا لصفحة الأسهم بالكوكيز بدون تحقق!");

    while (true) {
      // نفس كود الشراء اللي عندك ...
      // ... (الباقي زي ما هو)
    }
  } catch (e) {
    console.log("❌ مشكلة:", e.message);
    await browser.close();
  }
})();
