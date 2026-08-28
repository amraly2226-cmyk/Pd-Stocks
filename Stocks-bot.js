const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل (بيع ثم شراء الأخضر)...");

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

  // قبول أي بوب أب (Dialogs) تلقائياً
  page.on('dialog', async dialog => { await dialog.accept(); });

  try {
    await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
    await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'domcontentloaded', timeout: 120000 });
    console.log("✅ دخلنا لصفحة الأسهم بنجاح!");

    while (true) {
        try {
            // التأكد من أننا في صفحة الأسهم
            if (!page.url().includes('stock')) {
                await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'domcontentloaded', timeout: 120000 });
            }

            // =============================================
            // 1) عملية البيع (Sell All) أول كل دورة
            // =============================================
            console.log("🔄 هبدأ بعملية البيع: Sell All");
            
            // دوس على زر Sell All
            await page.evaluate(() => {
                const buttons = [...document.querySelectorAll('button')];
                // البحث عن زر الموجود تحت (Sell All)
                const sellBtn = buttons.find(b => b.innerText.trim() === 'Sell All' && b.offsetParent !== null);
                if (sellBtn) sellBtn.click();
            });
            await sleep(1500);

            // دوس على زر تأكيد البيع في البوب أب
            await page.evaluate(() => {
                const buttons = [...document.querySelectorAll('button')];
                const confirmSell = buttons.find(b => b.innerText.trim() === 'Sell All' && b.offsetParent !== null);
                if (confirmSell) confirmSell.click();
            });
            await sleep(3000); // انتظار البيع

            // =============================================
            // 2) عملية الشراء (شراء الأسهم الخضراء فقط)
            // =============================================
            console.log("🔄 بحاول أشتري الأسهم الخضراء...");

            // البحث عن كلمة (Max) الخضراء الصغيرة جنب الأسهم
            const foundGreenMax = await page.evaluate(() => {
                const rows = [...document.querySelectorAll('tr')]; // أو الـ divs الخاصة بالأسهم
                for (let r of rows) {
                    if (r.innerText.includes('£') && r.innerText.includes('Max')) {
                        // البحث عن الكلمة الخضراء (Max) داخل الصف
                        const maxBtn = [...r.querySelectorAll('button')].find(b => b.innerText.trim() === 'Max');
                        // البحث عن عنصر أخضر (الأخضر في اللعبة بيظهر بالقيم السالبة أو في النصوص)
                        // بناءً على الصورة، الكلمة الخضراء الصغيرة هي "Max" بجانب السهم
                        if (maxBtn) {
                            maxBtn.click();
                            return true;
                        }
                    }
                }
                return false;
            });

            if (foundGreenMax) {
                console.log("✅ لقيت سهم أخضر، داست على Max");
                await sleep(2000); // انتظار اختيار السهم

                // دوس على زر (Buy) من تحت
                await page.evaluate(() => {
                    const buttons = [...document.querySelectorAll('button')];
                    const buyBtn = buttons.find(b => b.innerText.trim() === 'Buy' && b.offsetParent !== null);
                    if (buyBtn) buyBtn.click();
                });
                await sleep(2000); // انتظار فتح صفحة التأكيد

                // دوس على زر التأكيد (Buy) في البوب أب
                await page.evaluate(() => {
                    const buttons = [...document.querySelectorAll('button')];
                    const confirmBuy = buttons.find(b => b.innerText.trim() === 'Buy' && b.offsetParent !== null);
                    if (confirmBuy) confirmBuy.click();
                });
                
                console.log("✅ تم الشراء بنجاح!");
            } else {
                console.log("⏳ مفيش أسهم خضراء دلوقتي، هستنى 10 دقايق");
            }

        } catch (e) {
            console.log("⚠️ حصل خطأ في الفحص:", e.message);
        }

        // الانتظار 10 دقائق قبل الدورة الجاية
        console.log("⏳ هستنى 10 دقايق للفحص الجاي...");
        await sleep(600000);
    }

  } catch (e) {
    console.log("❌ مشكلة كبيرة في السكريبت:", e.message);
    await browser.close();
  }
})();
