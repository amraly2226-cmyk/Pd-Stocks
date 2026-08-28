const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم (شراء كل الأخضر وبيع كل الأحمر) بيشتغل...");

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
    await page.goto('https://project-dark.co.uk/stocks', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log("✅ دخلنا لصفحة الأسهم بنجاح!");

    while (true) {
        try {
            if (!page.url().includes('stock')) {
                await page.goto('https://project-dark.co.uk/stocks', { waitUntil: 'domcontentloaded', timeout: 120000 });
            }

            // انتظر ظهور الجدول
            await page.waitForSelector('tr', { timeout: 20000 }).catch(() => {});

            // 1) بيع كل الصفوف الحمراء
            console.log("🔴 بدأت عملية بيع الصفوف الحمراء...");
            let soldCount = 0;
            for (let attempt = 0; attempt < 10; attempt++) {
                let foundRed = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        const isRed = [...row.querySelectorAll('td')].some(cell => {
                            const text = cell.innerText.trim();
                            return text.includes('£') && (text.includes('▼') || text.includes('↓'));
                        });

                        if (isRed) {
                            // ابحث عن أي زر/عنصر في نفس الصف نصه "Sell All"
                            const sellBtn = [...row.querySelectorAll('button, span, div')].find(b => b.innerText.trim() === 'Sell All' && b.offsetParent !== null);
                            if (sellBtn) {
                                sellBtn.click();
                                return true;
                            }
                        }
                    }
                    return false;
                });

                if (!foundRed) break;
                soldCount++;

                // انتظار نافذة التأكيد واضغط على SELL ALL
                await page.waitForFunction(() => document.body.innerText.includes('Sell All Holdings'), { timeout: 10000 }).catch(() => {});
                await page.evaluate(() => {
                    let confirmSell = [...document.querySelectorAll('button, span, div')].find(b => b.innerText.trim().toUpperCase() === 'SELL ALL');
                    if (confirmSell) confirmSell.click();
                });
                await sleep(3000);

                // انتظار تحديث الصفحة بعد البيع
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await sleep(2000);
                console.log(`✅ تم بيع الصف الأحمر رقم ${soldCount}`);
            }

            if (soldCount === 0) {
                console.log("⏳ مفيش أسهم حمراء للبيع حالياً.");
            } else {
                console.log(`🏁 خلصت بيع كل الصفوف الحمراء (${soldCount} صف).`);
            }

            // 2) شراء كل الصفوف الخضراء
            console.log("🟢 بدأت عملية شراء الصفوف الخضراء...");
            let boughtCount = 0;
            for (let attempt = 0; attempt < 10; attempt++) {
                let foundGreen = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        const isGreen = [...row.querySelectorAll('td')].some(cell => {
                            const text = cell.innerText.trim();
                            return text.includes('£') && (text.includes('▲') || text.includes('↑'));
                        });

                        if (isGreen) {
                            const maxSpan = row.querySelector('span.stock-fillmax-btn');
                            if (maxSpan) {
                                maxSpan.click();
                                return true;
                            }
                        }
                    }
                    return false;
                });

                if (!foundGreen) break;
                boughtCount++;

                await sleep(1500);

                // اضغط زر الشراء الرئيسي
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(1500);

                // اضغط على YES
                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button, span, div')].find(el => el.innerText.trim().toUpperCase() === 'YES');
                    if (yesBtn) yesBtn.click();
                });

                // انتظار التحديث
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await sleep(2000);
                console.log(`✅ تم شراء الصف الأخضر رقم ${boughtCount}`);
            }

            if (boughtCount === 0) {
                console.log("⏳ مفيش أسهم خضراء للشراء حالياً.");
            } else {
                console.log(`🏁 خلصت شراء كل الصفوف الخضراء (${boughtCount} صف).`);
            }

            // 3) انتظار 10 دقايق
            console.log("⏳ هستنى 10 دقايق قبل الدورة الجديدة...");
            await sleep(600000);

        } catch (e) {
            console.log("⚠️ حصل خطأ مؤقت، جاري إعادة المحاولة:", e.message);
            await sleep(5000);
        }
    }

  } catch (e) {
    console.log("❌ مشكلة كبيرة في السكريبت:", e.message);
    await browser.close();
  }
})();
