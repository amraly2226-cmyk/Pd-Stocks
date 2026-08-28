const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل (بيع كل شيء ثم شراء الأخضر)...");

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

            // =============================================
            // 1) عملية البيع (Sell All) من الزر اللي تحت على اليمين
            // =============================================
            console.log("🔴 [1/3] هبدأ عملية البيع: الضغط على Sell All");

            // دوس على زر Sell All الرئيسي (اللي على اليمين تحت)
            await page.evaluate(() => {
                let sellAllBtn = document.getElementById('bottomSellBtn'); // الـ ID بتاعه
                if (!sellAllBtn) {
                    // لو مش لاقي الـ ID، يدور على أول زر نصه Sell All
                    sellAllBtn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Sell All' && b.offsetParent !== null);
                }
                if (sellAllBtn) sellAllBtn.click();
            });
            await sleep(2000);

            // اضغط على زر التأكيد "Sell All" اللي بيظهر في النافذة المنبثقة
            await page.evaluate(() => {
                let confirmSell = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Sell All' && b.offsetParent !== null);
                if (confirmSell) confirmSell.click();
            });
            await sleep(3000); // استنى البيع يتم
            console.log("✅ تم بيع كل الأسهم!");

            // =============================================
            // 2) عملية الشراء (الأسهم الخضراء)
            // =============================================
            console.log("🟢 [2/3] هبدأ عملية الشراء: البحث عن الأخضر...");

            // استنى ظهور الجدول
            await page.waitForSelector('tr', { timeout: 20000 }).catch(() => {});

            // شراء كل الأسهم اللي سعرها أخضر (فيها £ وسهم ↑)
            let greenCount = 0;
            for (let attempt = 0; attempt < 5; attempt++) {
                let foundGreen = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        for (let cell of row.querySelectorAll('td')) {
                            const text = cell.innerText.trim();
                            // البحث عن الخلية اللي فيها سعر أخضر مع سهم طالع
                            if (text.includes('£') && (text.includes('↑') || text.includes('▲'))) {
                                const maxSpan = row.querySelector('span.stock-fillmax-btn');
                                if (maxSpan) {
                                    maxSpan.click();
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                });

                if (!foundGreen) break;

                greenCount++;
                console.log(`✅ لقيت سهم أخضر ${greenCount}، داست على Max`);
                await sleep(1500);

                // اضغط على زر Buy الرئيسي (اللي تحت في النص)
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(1500);

                // اضغط على زر YES للتأكيد
                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button, span')].find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetWidth > 0);
                    if (yesBtn) yesBtn.click();
                });
                await sleep(2000);
                console.log(`✅ تم شراء السهم الأخضر رقم ${greenCount}`);
            }

            if (greenCount === 0) {
                console.log("⏳ مفيش أسهم خضراء دلوقتي، هستنى الدورة الجاية");
            }

            // =============================================
            // 3) انتظار 10 دقايق للدورة الجديدة
            // =============================================
            console.log("⏳ [3/3] هستنى 10 دقايق عشان نبيع ونشتري تاني...");
            await sleep(600000);

        } catch (e) {
            console.log("⚠️ حصل خطأ في الفحص:", e.message);
        }
    }

  } catch (e) {
    console.log("❌ مشكلة كبيرة في السكريبت:", e.message);
    await browser.close();
  }
})();
