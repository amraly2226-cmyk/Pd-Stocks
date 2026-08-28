const puppeteer = require('puppeteer-core');

// ضع الكوكي بتاعك هنا (مثلاً من إضافة Cookie Editor في متصفح كيوي)
const COOKIE_VALUE = 'ضع_الكوكي_هنا';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل...");
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(15000);

  try {
    // الدخول المباشر بالكوكي
    await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
    await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log("✅ دخلنا لصفحة الأسهم بالكوكيز بدون تحقق!");

    while (true) {
      try {
        if (!page.url().includes('stock')) {
            await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2' });
        }
        const clickedMax = await page.evaluate(() => {
            const buttons = [...document.querySelectorAll('button')];
            const maxBtn = buttons.find(b => b.innerText.includes('Max') && b.offsetParent !== null);
            if (maxBtn) { maxBtn.click(); return true; }
            return false;
        });
        if (clickedMax) {
            console.log("🟢 لقيت الزر الأخضر Max، داست عليه");
            await sleep(1000);
            const clickedBuy = await page.evaluate(() => {
                const buttons = [...document.querySelectorAll('button')];
                const buyBtn = buttons.find(b => b.innerText.trim().toUpperCase() === 'BUY' && b.offsetParent !== null);
                if (buyBtn) { buyBtn.click(); return true; }
                return false;
            });
            if (clickedBuy) { console.log("✅ تم الضغط على زر Buy وتم الشراء!"); }
            else { console.log("⚠️ لقيت الزر الأخضر لكن مش لاقي زر Buy"); }
        } else { console.log("⏳ مفيش أسهم خضراء (Max)"); }
      } catch (e) { console.log("⚠️ خطأ في الفحص:", e.message); }
      console.log("⏳ هستنى 10 دقايق...");
      await sleep(600000);
      if (clickedBuy) { await sleep(420000); }
    }
  } catch (e) {
    console.log("❌ مشكلة كبيرة:", e.message);
    await browser.close();
  }
})();
