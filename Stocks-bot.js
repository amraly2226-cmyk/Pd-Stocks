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

  // معالج النوافذ المنبثقة: هيقبل أي تأكيد (Confirm) تلقائياً فور ظهورها
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
            // 1) البيع: الضغط على الزر الرئيسي (#bottomSellAllBtn)
            // =============================================
            console.log("🔴 [1/2] ببدأ عملية البيع...");

            // انتظر حتى يظهر الزر الرئيسي (مهلة أطول)
            await page.waitForSelector('#bottomSellAllBtn', { timeout: 10000 }).catch(() => console.log("⚠️ مفيش زر البيع الرئيسي"));

            // اضغط عليه
            const sellAllClicked = await page.evaluate(() => {
                const btn = document.getElementById('bottomSellAllBtn');
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (sellAllClicked) {
                console.log("👆 داست على زر البيع الرئيسي");
                // ✅ النافذة هتتقفل تلقائياً من معالج الـ Dialog فوق!
                // ننتظر 4 ثواني عشان اللعبة تخلص البيع وتحدث
                await sleep(4000);
                console.log("✅ تم بيع كل الأسهم بنجاح!");
            } else {
                console.log("❌ ملقيتش زر البيع الرئيسي");
            }

            // =============================================
            // 2) الشراء: البحث عن كل الأسهم الخضراء وشرائها
            // =============================================
            console.log("🟢 [2/2] ببدأ عملية شراء الأسهم الخضراء...");
            let boughtCount = 0;
            for (let attempt = 0; attempt < 5; attempt++) {
                let foundGreen = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        // البحث عن سهم أخضر (سهم طالع أو سعر أخضر)
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

                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(1500);

                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button, span, div')].find(el => el.innerText.trim().toUpperCase() === 'YES');
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
