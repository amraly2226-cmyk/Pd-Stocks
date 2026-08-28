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
    await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2', timeout: 120000 });
    console.log("✅ دخلنا لصفحة الأسهم بنجاح!");

    while (true) {
        try {
            if (!page.url().includes('stock')) {
                await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2', timeout: 120000 });
            }

            console.log("🔄 بحاول أشتري...");

            // ⏳ ننتظر ظهور الجدول (عشان الموبايل بطيء) لحد 15 ثانية
            await page.waitForSelector('span.stock-fillmax-btn', { timeout: 15000 }).catch(() => {});

            // نبحث عن أي زر Max ظاهر
            let foundMax = await page.evaluate(() => {
                let allEls = [...document.querySelectorAll('span, a, button, div')];
                // نبحث عن أي عنصر مكتوب عليه "Max" وليس مخفياً
                let maxBtn = allEls.find(el => el.innerText.trim() === 'Max' && el.offsetParent !== null);
                if (maxBtn) {
                    maxBtn.click();
                    return true;
                }
                return false;
            });

            if (foundMax) {
                console.log("✅ لقيت زر Max، داست عليه");
                await sleep(2000);

                // الضغط على زر Buy الرئيسي بالـ id
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(2000);

                // الضغط على زر YES في نافذة التأكيد
                await page.evaluate(() => {
                    let allEls = [...document.querySelectorAll('button, span, a, div, input')];
                    let yesBtn = allEls.find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetParent !== null);
                    if (yesBtn) yesBtn.click();
                });

                console.log("✅ تم الشراء بنجاح!");
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
