const puppeteer = require('puppeteer-core');

const USERNAME = 'amr.aly.2226@gmail.com'; 
const PASSWORD = 'Gun@12345';
const COOKIE_VALUE = process.env.PD_COOKIE || "";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل...");

  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(15000);

  page.on('dialog', async dialog => { await dialog.accept(); });

  try {
    if (COOKIE_VALUE) {
        await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
        await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2', timeout: 60000 });
        console.log("✅ دخلنا لصفحة الأسهم بالكوكيز");
    } else {
        await page.goto('https://project-dark.co.uk/login', { waitUntil: 'networkidle2', timeout: 60000 });
        const inputs = await page.$$('input[type="text"], input[type="email"], input[type="password"]');
        if (inputs.length >= 2) {
           await inputs[0].type(USERNAME);
           await inputs[1].type(PASSWORD);
        }
        await page.click('button[type="submit"]').catch(() => {});
        await sleep(5000);
        await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2', timeout: 60000 });
        console.log("✅ دخلنا لصفحة الأسهم بعد تسجيل الدخول");
    }

    while (true) {
        try {
            if (!page.url().includes('stock')) {
                await page.goto('https://project-dark.co.uk/stock', { waitUntil: 'networkidle2' });
            }

            const clickedMax = await page.evaluate(() => {
                const buttons = [...document.querySelectorAll('button')];
                const maxBtn = buttons.find(b => b.innerText.includes('Max') && b.offsetParent !== null);
                if (maxBtn) {
                    maxBtn.click();
                    return true;
                }
                return false;
            });

            if (clickedMax) {
                console.log("🟢 لقيت الزر الأخضر Max، داست عليه");
                await sleep(1000);

                const clickedBuy = await page.evaluate(() => {
                    const buttons = [...document.querySelectorAll('button')];
                    const buyBtn = buttons.find(b => b.innerText.trim().toUpperCase() === 'BUY' && b.offsetParent !== null);
                    if (buyBtn) {
                        buyBtn.click();
                        return true;
                    }
                    return false;
                });

                if (clickedBuy) {
                    console.log("✅ تم الضغط على زر Buy وتم الشراء!");
                } else {
                    console.log("⚠️ لقيت الزر الأخضر لكن مش لاقي زر Buy، هجرب تاني بعد قليل");
                }
            } else {
                console.log("⏳ مفيش أسهم خضراء (Max) دلوقتي، هستنى الدور الجاي");
            }

        } catch (e) {
            console.log("⚠️ حصل خطأ في الفحص:", e.message);
        }

        console.log("⏳ هستنى 10 دقايق للفحص الجاي...");
        await sleep(600000);

        if (clickedBuy) {
             console.log("⏳ اشتريت، هستنى 7 دقايق إضافية قبل ما أكمل...");
             await sleep(420000);
        }
    }

  } catch (e) {
    console.log("❌ مشكلة كبيرة في السكريبت:", e.message);
    await browser.close();
  }
})();
