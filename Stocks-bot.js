const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم (بيع الأحمر في نفس الصف، وشراء الأخضر في نفس الصف)...");

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

            await page.waitForSelector('tr', { timeout: 20000 }).catch(() => {});

            // =============================================
            // 1) البيع: البحث عن صف فيه سعر أحمر وسهم نازل، والضغط على زر "Sell All" في نفس الصف
            // =============================================
            console.log("🔴 [1/2] ببدأ البحث عن الأسهم الحمراء لبيعها...");

            let sold = false;
            for (let attempt = 0; attempt < 5; attempt++) {
                let foundRed = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        // ابحث داخل الخلايا عن أي عنصر فيه "£" وعلامة السهم النازل "▼" أو "↓"
                        const isRed = [...row.querySelectorAll('td')].some(cell => {
                            const text = cell.innerText.trim();
                            return text.includes('£') && (text.includes('▼') || text.includes('↓'));
                        });

                        if (isRed) {
                            // ابحث داخل نفس الصف عن زر "Sell All" (سواء كان button أو span أو div) واضغط عليه
                            const sellBtnInRow = [...row.querySelectorAll('button, span, div')].find(b => b.innerText.trim() === 'Sell All' && b.offsetParent !== null);
                            if (sellBtnInRow) {
                                sellBtnInRow.click();
                                return true;
                            }
                        }
                    }
                    return false;
                });

                if (!foundRed) break;
                sold = true;

                // انتظر ظهور نافذة التأكيد، ثم اضغط على زر "SELL ALL" الأحمر جواها
                await page.waitForFunction(() => document.body.innerText.includes('Sell All Holdings'), { timeout: 10000 }).catch(() => {});
                await page.evaluate(() => {
                    let confirmSell = [...document.querySelectorAll('button, span, div')].find(b => b.innerText.trim().toUpperCase() === 'SELL ALL' && b.offsetParent !== null);
                    if (confirmSell) confirmSell.click();
                });
                await sleep(3000);
                console.log("✅ تم بيع سهم أحمر بنجاح!");
                
                // استنى اللعبة تحمّل بعد التحديث
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await sleep(1000);
            }

            // =============================================
            // 2) الشراء: البحث عن صف فيه سعر أخضر وسهم طالع، والضغط على زر "Max" في نفس الصف
            // =============================================
            console.log("🟢 [2/2] ببدأ البحث عن الأسهم الخضراء لشرائها...");

            let greenCount = 0;
            for (let attempt = 0; attempt < 5; attempt++) {
                let foundGreen = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        // ابحث داخل الخلايا عن أي عنصر فيه "£" وعلامة السهم الطالع "▲" أو "↑"
                        const isGreen = [...row.querySelectorAll('td')].some(cell => {
                            const text = cell.innerText.trim();
                            return text.includes('£') && (text.includes('▲') || text.includes('↑'));
                        });

                        if (isGreen) {
                            // ابحث عن زر "Max" في نفس الصف واضغط عليه
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

                greenCount++;
                console.log(`✅ لقيت سهم أخضر ${greenCount}، داست على Max`);
                await sleep(1500);

                // اضغط على زر الشراء الرئيسي
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(1500);

                // اضغط على زر YES للتأكيد
                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button, span, div')].find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetWidth > 0);
                    if (yesBtn) yesBtn.click();
                });

                // استنى التحديث بعد الشراء
                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await sleep(2000);
                console.log(`✅ تم شراء السهم الأخضر رقم ${greenCount}`);
            }

            if (greenCount === 0 && !sold) {
                console.log("⏳ مفيش أسهم حمراء للبيع أو خضراء للشراء في الدورة دي، هستنى 10 دقايق");
            }

            // انتظار 10 دقايق قبل الدورة الجديدة
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
