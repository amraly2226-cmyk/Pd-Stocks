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

            console.log("🔄 بحاول أشتري الأسهم الخضراء...");

            // 1) البحث عن زر Max الأخضر (span.stock-fillmax-btn)
            let foundGreenMax = await page.evaluate(() => {
                const rows = document.querySelectorAll('tr');
                for (let row of rows) {
                    // فحص اللون الأخضر في الخلايا
                    const hasGreen = [...row.querySelectorAll('td')].some(cell => {
                        const color = window.getComputedStyle(cell).color;
                        return color.includes('76, 175') || color.includes('0, 128') || color.includes('0, 200');
                    });

                    if (hasGreen) {
                        const maxSpan = row.querySelector('span.stock-fillmax-btn');
                        if (maxSpan) {
                            maxSpan.click();
                            return true;
                        }
                    }
                }
                return false;
            });

            if (foundGreenMax) {
                console.log("✅ لقيت سهم أخضر، داست على Max");
                await sleep(2000);

                // 2) الضغط على زر Buy الرئيسي (bottomBuyBtn)
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(2000);

                // 3) البحث عن زر YES في النافذة (سواء كان button أو span)
                await page.evaluate(() => {
                    // البحث في كل العناصر عن واحد نصه YES وليس مخفياً
                    let allEls = [...document.querySelectorAll('button, span, a, div')];
                    let yesBtn = allEls.find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetParent !== null);
                    if (yesBtn) yesBtn.click();
                });

                console.log("✅ تم الشراء بنجاح!");
            } else {
                console.log("⏳ مفيش أسهم خضراء دلوقتي، هستنى 10 دقايق");
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
