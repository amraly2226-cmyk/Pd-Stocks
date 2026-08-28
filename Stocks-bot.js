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
    await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log("✅ دخلنا لصفحة الأسهم بنجاح!");

    while (true) {
        try {
            if (!page.url().includes('stock')) {
                await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'domcontentloaded', timeout: 120000 });
            }

            console.log("🔄 بحاول أشتري...");

            // 1) البحث عن زر Max (أول عنصر ظاهر نصه Max)
            let foundMax = await page.evaluate(() => {
                let maxBtn = [...document.querySelectorAll('button, span, a, div')].find(el => el.innerText.trim() === 'Max' && el.offsetParent !== null);
                if (maxBtn) { maxBtn.click(); return true; }
                return false;
            });

            if (foundMax) {
                console.log("✅ لقيت زر Max، داست عليه");
                await sleep(2000);

                // 2) البحث عن زر Buy في النافذة المنبثقة (أو في أي مكان) والضغط عليه
                let clickedBuy = await page.evaluate(() => {
                    let buyBtn = [...document.querySelectorAll('button, span, a, div')].find(el => el.innerText.trim() === 'Buy' && el.offsetParent !== null);
                    if (buyBtn) { buyBtn.click(); return true; }
                    return false;
                });
                
                if (clickedBuy) {
                    console.log("✅ داست على زر Buy");
                    await sleep(2000);
                } else {
                    console.log("❌ مش لاقي زر Buy");
                }

                // 3) البحث عن زر YES في نافذة التأكيد والضغط عليه
                let clickedYes = await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button, span, a, div')].find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetParent !== null);
                    if (yesBtn) { yesBtn.click(); return true; }
                    return false;
                });

                if (clickedYes) {
                    console.log("✅ داست على زر YES، تم الشراء!");
                } else {
                    console.log("❌ مش لاقي زر YES");
                }
            } else {
                console.log("⏳ مفيش زر Max ظاهر على الشاشة حالياً، هستنى 10 دقايق");
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
