const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل...");

  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    protocolTimeout: 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(60000);

  page.on('dialog', async dialog => { await dialog.accept(); });

  try {
    await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
    
    // ✅ التصحيح: استخدام الرابط الصحيح /stocks
    await page.goto('https://project-dark.co.uk/stocks', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log("✅ دخلنا لصفحة الأسهم بنجاح!");

    while (true) {
        try {
            if (!page.url().includes('stock')) {
                await page.goto('https://project-dark.co.uk/stocks', { waitUntil: 'domcontentloaded', timeout: 120000 });
            }

            console.log("🔄 بحاول أشتري...");

            // ⏳ ننتظر ظهور زر Max لمدة 20 ثانية (عشان الموبايل بطيء)
            try {
                await page.waitForSelector('span.stock-fillmax-btn', { timeout: 20000 });
            } catch (e) {
                console.log("⚠️ مفيش زر Max ظاهر في هذا الوقت، هستنى دورة جديدة");
                await sleep(600000); // انتظر 10 دقايق
                continue;
            }

            // دوس على أول زر Max
            let foundMax = await page.evaluate(() => {
                let maxBtn = document.querySelector('span.stock-fillmax-btn');
                if (maxBtn) { maxBtn.click(); return true; }
                return false;
            });

            if (foundMax) {
                console.log("✅ داست على Max، بستنى النافذة تفتح...");

                // الضغط على زر Buy الرئيسي
                await page.waitForSelector('#bottomBuyBtn', { timeout: 10000 }).catch(() => {});
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                console.log("✅ داست على زر Buy");

                // الضغط على زر YES المرئي
                await sleep(2000);
                let purchaseSuccess = await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button, span')].find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetParent !== null);
                    if (yesBtn) { yesBtn.click(); return true; }
                    return false;
                });

                if (purchaseSuccess) {
                    console.log("✅ تم الشراء بنجاح!");
                } else {
                    console.log("⚠️ مش لاقي زر YES (يمكن مفيش أسهم متاحة)");
                }
            } else {
                console.log("⏳ مفيش زر Max ظاهر حالياً، هستنى 10 دقايق");
            }

        } catch (e) {
            console.log("⚠️ حصل خطأ في الفحص:", e.message);
        }

        console.log("⏳ هستنى 10 دقايق للفحص الجاي...");
        await sleep(600000);
    }

  } catch (e) {
    console.log("❌ مشكلة كبيرة في السكريبت:", e.message);
    await browser.close();
  }
})();
