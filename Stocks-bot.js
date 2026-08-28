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

            // البحث عن الصف اللي فيه "span" لونها أخضر، وجواه "span.stock-fillmax-btn"
            let foundGreen = await page.evaluate(() => {
                const rows = document.querySelectorAll('tr');
                for (let row of rows) {
                    const changeEl = row.querySelector('td, span'); // عناصر عمود الـ Change
                    const maxSpan = row.querySelector('span.stock-fillmax-btn');
                    
                    if (maxSpan && changeEl) {
                        // فحص لون عمود التغيرات
                        const style = window.getComputedStyle(changeEl);
                        const color = style.color;
                        if (color.includes('rgb(0, 128') || color.includes('rgb(0, 100') || color.includes('rgb(0, 255') || color.includes('rgb(0, 200')) {
                            maxSpan.click(); // دوس على الـ "Max" الأخضر اللي في نفس الصف
                            return true;
                        }
                    }
                }
                return false;
            });

            if (foundGreen) {
                console.log("✅ لقيت سهم أخضر، داست على Max (span)");
                await sleep(2000);

                // الضغط على زر Buy
                await page.evaluate(() => {
                    let buyBtn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Buy' && b.offsetParent !== null);
                    if (buyBtn) buyBtn.click();
                });
                await sleep(2000);

                // الضغط على YES للتأكيد
                await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button')].find(b => b.innerText.trim().toUpperCase() === 'YES' && b.offsetParent !== null);
                    if (yesBtn) yesBtn.click();
                });

                console.log("✅ تم الشراء بنجاح!");
            } else {
                console.log("⏳ مفيش أسهم خضراء في عمود التغيرات دلوقتي، هستنى 10 دقايق");
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
