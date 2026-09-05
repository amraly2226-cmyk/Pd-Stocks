const puppeteer = require('puppeteer-core');

// ✅ الكوكي الجديد بتاعك
const COOKIE_VALUE = "eyJpdiI6IjhOSXBseVlmekV6ck9uY1pmWnB2dnc9PSIsInZhbHVlIjoiaTN4OXcyZTF6VFRGWGRkUEJFTU1PMXNhTXpvclFsazZJajUxV1FZQzZybmRHZE1jV1F0cVZPZnlPNFIyS08wa1J0S01vNW9YTXJ0SzdwNy9ZbUZxdjVhdTl6WXQ0c2J4SXJEa2hZelp1Ly8zNWpIZWxza25lVURhOTdVY3NCL1UiLCJtYWMiOiIzMGNhMmQ0YmE5MmVmMzRhZDE2NDZkMDAzNmNmZDQ2MTFlNWE0NjMyODE3NjA3MGU1NGVhMzRmNGRhOWQ1MWE3IiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل (مع ريفريش كل دورة)...");

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
            // 🔄 تحديث الصفحة قبل كل دورة جديدة (البحث عن أسعار جديدة)
            await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
            await sleep(2000);

            // انتظر ظهور الجدول
            await page.waitForSelector('tr', { timeout: 20000 }).catch(() => {});

            // 1) البيع (الطريقة المعتمدة الأصلية)
            console.log("🔴 [1/2] بدأت عملية البيع...");

            await page.evaluate(() => {
                const allSellBtns = [...document.querySelectorAll('button')].filter(b => b.innerText.trim() === 'Sell All');
                if (allSellBtns.length > 0) {
                    allSellBtns[allSellBtns.length - 1].click();
                }
            });
            await sleep(2000);

            await page.waitForFunction(() => document.body.innerText.includes('Sell All Holdings') || document.body.innerText.includes('Confirm Sell All'), { timeout: 5000 }).catch(() => {});
            
            await page.evaluate(() => {
                const allBtns = [...document.querySelectorAll('button')];
                const confirmBtn = allBtns.find(b => b.innerText.trim() === 'SELL ALL' && b.offsetParent !== null);
                if (confirmBtn) confirmBtn.click();
            });
            
            await sleep(4000);
            await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
            await sleep(1000);
            console.log("✅ تم بيع كل الأسهم بنجاح!");

            // 2) الشراء (الطريقة المعتمدة الأصلية)
            console.log("🟢 [2/2] بدأت عملية شراء الأسهم الخضراء...");
            let boughtCount = 0;
            for (let attempt = 0; attempt < 5; attempt++) {
                let foundGreen = await page.evaluate(() => {
                    const rows = document.querySelectorAll('tr');
                    for (let row of rows) {
                        const isGreen = [...row.querySelectorAll('td')].some(cell => {
                            const text = cell.innerText.trim();
                            // ✅ التعديل الوحيد: تغيير £ إلى $
                            return text.includes('$') && (text.includes('↑') || text.includes('▲'));
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
                    let yesBtn = [...document.querySelectorAll('button, span, div')].find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetWidth > 0);
                    if (yesBtn) yesBtn.click();
                });

                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
                await sleep(2000);
                console.log(`✅ تم شراء السهم الأخضر رقم ${boughtCount}`);
            }

            if (boughtCount === 0) {
                console.log("⏳ مفيش أسهم خضراء في الوقت الحالي.");
            }

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
