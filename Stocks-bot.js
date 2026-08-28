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

            // =============================================
            // 1) البيع الكلي (Sell All)
            // =============================================
            console.log("🔄 هبدأ بعملية البيع: Sell All");

            // نضغط على زر "Sell All" الموجود تحت خالص (اللي جنب Clear All و Buy)
            await page.evaluate(() => {
                let allSellAll = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Sell All');
                if (allSellAll.length > 0) {
                    allSellAll[allSellAll.length - 1].click(); // بنختار آخر واحد لتحت
                }
            });
            await sleep(2000);

            // ننتظر ظهور النافذة، وبعدين نضغط على الزر الأحمر "SELL ALL"
            await page.waitForSelector('button', { timeout: 5000 }).catch(() => {});
            await page.evaluate(() => {
                let confirmSell = [...document.querySelectorAll('button')].find(b => b.textContent.trim().toUpperCase() === 'SELL ALL');
                if (confirmSell) confirmSell.click();
            });
            await sleep(3000);

            // =============================================
            // 2) الشراء (الأسهم الخضراء)
            // =============================================
            console.log("🔄 بحاول أشتري الأسهم الخضراء...");

            // نبحث عن أول صف فيه اللون الأخضر وزر "Max"
            let foundGreenMax = await page.evaluate(() => {
                const rows = document.querySelectorAll('tr');
                for (let row of rows) {
                    const maxBtn = [...row.querySelectorAll('button')].find(b => b.textContent.trim() === 'Max');
                    if (maxBtn) {
                        const hasGreen = row.innerHTML.includes('green') || row.innerHTML.includes('#00ff00') || row.innerHTML.includes('#00d26a') || row.innerHTML.includes('svg');
                        if (hasGreen) {
                            maxBtn.click();
                            return true;
                        }
                    }
                }
                return false;
            });

            if (foundGreenMax) {
                console.log("✅ لقيت سهم أخضر، داست على Max");
                await sleep(2000);

                // ننزل تحت ونضغط على زر "Buy"
                await page.evaluate(() => {
                    let buyBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Buy');
                    if (buyBtn) buyBtn.click();
                });
                await sleep(2000);

                // نضغط على "YES" في نافذة التأكيد
                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button')].find(b => b.textContent.trim().toUpperCase() === 'YES');
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
