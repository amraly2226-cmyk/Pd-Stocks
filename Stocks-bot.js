const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل...");

  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    protocolTimeout: 0,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage', 
      '--disable-gpu',
      '--no-zygote', 
      '--single-process'
    ] 
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

            // 1) البيع: دوس على آخر زر Sell All (اللي تحت خالص اللي بيقول بيع كل الحاجات)
            console.log("🔄 هبدأ بعملية البيع الكلي: Sell All");
            
            await page.evaluate(() => {
                // هنختار آخر زر اسمه Sell All
                let sellBtns = [...document.querySelectorAll('button')].filter(b => b.innerText.trim() === 'Sell All' && b.offsetParent !== null);
                if (sellBtns.length > 0) {
                    sellBtns[sellBtns.length - 1].click(); // آخر زر هو الرئيسي
                }
            });
            await sleep(2000);

            // دوس على زر SELL ALL الأحمر داخل نافذة التأكيد
            await page.evaluate(() => {
                let confirmSell = [...document.querySelectorAll('button')].find(b => b.innerText.trim().toUpperCase() === 'SELL ALL' && b.offsetParent !== null);
                if (confirmSell) confirmSell.click();
            });
            await sleep(3000);

            // 2) الشراء: دوس على ماكس الأخضر
            console.log("🔄 بحاول أشتري الأسهم الخضراء...");

            let foundGreenMax = await page.evaluate(() => {
                const rows = document.querySelectorAll('tr');
                for (let row of rows) {
                    const maxBtn = [...row.querySelectorAll('button')].find(b => b.innerText.trim() === 'Max' && b.offsetParent !== null);
                    if (!maxBtn) continue;

                    // البحث عن أي عنصر أخضر جوه الصف (رسم بياني، أو أسعار، أو تغيير)
                    const hasGreen = row.innerHTML.includes('green') || row.innerHTML.includes('#00ff00') || row.innerHTML.includes('#00d26a') || row.innerHTML.includes('svg');

                    if (hasGreen) {
                        maxBtn.click();
                        return true;
                    }
                }
                return false;
            });

            if (foundGreenMax) {
                console.log("✅ لقيت سهم أخضر، داست على Max");
                await sleep(2000);

                // انزل تحت ودوس على زر Buy
                await page.evaluate(() => {
                    let buyBtn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Buy' && b.offsetParent !== null);
                    if (buyBtn) buyBtn.click();
                });
                await sleep(2000);

                // استنى نافذة التأكيد ودوس YES
                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().toUpperCase() === 'YES' && b.offsetParent !== null);
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
