const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل...");

  const browser = await puppeteer.launch({ 
    headless: true,
    // ✅ المسار الصحيح اللي طلع لك في which chromium-browser
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    protocolTimeout: 240000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(60000);

  try {
    await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
    await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log("✅ دخلنا لصفحة الأسهم بنجاح!");

    while (true) {
        try {
            if (!page.url().includes('stock')) {
                await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'domcontentloaded', timeout: 120000 });
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

                if (clickedBuy) {
                    console.log("✅ تم الضغط على زر Buy وتم الشراء!");
                } else {
                    console.log("⚠️ لقيت الزر الأخضر لكن مش لاقي زر Buy");
                }
            } else {
                console.log("⏳ مفيش أسهم خضراء (Max) دلوقتي، هستنى الدور الجاي");
            }

        } catch (e) {
            console.log("⚠️ حصل خطأ في الفحص:", e.message);
        }

        console.log("⏳ هستنى 10 دقايق للفحص الجاي...");
        await sleep(600000);

        if (clickedBuy) {
             console.log("⏳ اشتريت، هستنى 7 دقايق إضافية قبل ما أكمل...");
             await sleep(420000);
        }
    }

  } catch (e) {
    console.log("❌ مشكلة كبيرة في السكريبت:", e.message);
    await browser.close();
  }
})();
