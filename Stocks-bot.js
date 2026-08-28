const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل (نسخة إصلاح نهائية)...");

  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    protocolTimeout: 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(60000);

  // تجاهل أي نوافذ JavaScript تلقائياً (بس اللي هنا HTML فمش هتتأثر)
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

            // =============================================
            // 1) البيع: البحث عن زر Sell All الرئيسي والضغط عليه
            // =============================================
            console.log("🔴 [1/2] بدأت عملية البيع...");

            // اضغط على زر البيع (لو مش موجود بالـ ID، ندور على النص "Sell All" في شريط الأزرار)
            let sellClicked = await page.evaluate(() => {
                let sellBtn = document.getElementById('bottomSellAllBtn');
                if (!sellBtn) {
                    // نبحث عن زر "Sell All" في آخر الصفحة (تحت)
                    let allBtns = [...document.querySelectorAll('button')].filter(b => b.innerText.trim() === 'Sell All');
                    if (allBtns.length > 0) sellBtn = allBtns[allBtns.length - 1];
                }
                if (sellBtn) { sellBtn.click(); return true; }
                return false;
            });

            if (sellClicked) {
                // ⏳ ننتظر ظهور زر SELL ALL في النافذة المنبثقة (بحد أقصى 10 ثواني)
                try {
                    await page.waitForSelector('button:has-text("SELL ALL")', { visible: true, timeout: 10000 });
                } catch (e) {
                    console.log("⏳ مفيش أسهم متاحة للبيع (النافذة مش هتظهر)");
                }

                // الآن دوس على زر SELL ALL (من غير أي شروط offsetParent لأنه Modal)
                await page.evaluate(() => {
                    const allBtn = [...document.querySelectorAll('button')];
                    const confirmSell = allBtn.find(b => b.innerText.trim().toUpperCase() === 'SELL ALL');
                    if (confirmSell) confirmSell.click();
                });
                
                // انتظر البيع يتم ثم تحدث الصفحة
                await sleep(4000);
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await sleep(1000);
                console.log("✅ تم بيع كل الأسهم بنجاح!");
            } else {
                console.log("⚠️ ملقيتش زر البيع الرئيسي");
            }

            // =============================================
            // 2) الشراء: شراء كل الأسهم الخضراء
            // =============================================
            console.log("🟢 [2/2] بدأت عملية شراء الأسهم الخضراء...");
            let boughtCount = 0;
            for (let attempt = 0; attempt < 5; attempt++) {
                let foundGreen = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        const isGreen = [...row.querySelectorAll('td')].some(cell => {
                            const text = cell.innerText.trim();
                            return text.includes('£') && (text.includes('↑') || text.includes('▲'));
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
                console.log(`✅ لقيت سهم أخضر ${boughtCount}، داست على Max`);
                await sleep(1500);

                // دوس على زر Buy الرئيسي
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(1500);

                // دوس على زر YES
                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button')].find(el => el.innerText.trim().toUpperCase() === 'YES');
                    if (yesBtn) yesBtn.click();
                });

                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await sleep(2000);
                console.log(`✅ تم شراء السهم الأخضر رقم ${boughtCount}`);
            }

            if (boughtCount === 0) {
                console.log("⏳ مفيش أسهم خضراء في الوقت الحالي.");
            }

            // =============================================
            // 3) انتظار 10 دقايق للدورة الجديدة
            // =============================================
            console.log("⏳ هستنى 10 دقايق قبل ما نبدأ دورة جديدة...");
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
