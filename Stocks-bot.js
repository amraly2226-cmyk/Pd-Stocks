const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6IjhOSXBseVlmekV6ck9uY1pmWnB2dnc9PSIsInZhbHVlIjoiaTN4OXcyZTF6VFRGWGRkUEJFTU1PMXNhTXpvclFsazZJajUxV1FZQzZybmRHZE1jV1F0cVZPZnlPNFIyS08wa1J0S01vNW9YTXJ0SzdwNy9ZbUZxdjVhdTl6WXQ0c2J4SXJEa2hZelp1Ly8zNWpIZWxza25lVURhOTdVY3NCL1UiLCJtYWMiOiIzMGNhMmQ0YmE5MmVmMzRhZDE2NDZkMDAzNmNmZDQ2MTFlNWE0NjMyODE3NjA3MGU1NGVhMzRmNGRhOWQ1MWE3IiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل...");

  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    protocolTimeout: 120000, // (غيّرنا من 0 لـ 120000 عشان ما يتجمدش)
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote', '--single-process']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(60000);

  // قبول أي نافذة منبثقة
  page.on('dialog', async dialog => { await dialog.accept(); });

  try {
    await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
    await page.goto('https://project-dark.co.uk/stocks', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await sleep(5000);
    console.log("✅ دخلنا لصفحة الأسهم بنجاح!");
  } catch (e) {
    console.log("⚠️ مشكلة في الدخول:", e.message);
  }

  while (true) {
    try {
      // 🔄 تحديث الصفحة قبل كل دورة
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
      await sleep(3000);

      // 1) البيع (لو في عناصر بيع ظاهرة)
      console.log("🔴 [1/2] فحص البيع...");
      let hasSell = await page.evaluate(() => {
        let sellBtns = [...document.querySelectorAll('button')].filter(b => b.innerText.trim() === 'Sell All');
        if (sellBtns.length > 0) {
          sellBtns[sellBtns.length - 1].click();
          return true;
        }
        return false;
      });
      
      if (hasSell) {
        await sleep(2000);
        // انتظر ظهور نافذة التأكيد ثم اضغط
        await page.waitForFunction(() => document.body.innerText.includes('Sell All Holdings') || document.body.innerText.includes('Confirm Sell All'), { timeout: 5000 }).catch(() => {});
        await page.evaluate(() => {
          let allBtns = [...document.querySelectorAll('button')];
          let confirmBtn = allBtns.find(b => b.innerText.trim() === 'SELL ALL' && b.offsetParent !== null);
          if (confirmBtn) confirmBtn.click();
        });
        await sleep(4000);
        console.log("✅ تم بيع كل الأسهم!");
      } else {
        console.log("⏳ مفيش حاجة للبيع دلوقتي");
      }

      // 2) الشراء (البحث عن السهم الأخضر بالدولار)
      console.log("🟢 [2/2] بدأت عملية شراء الأسهم الخضراء...");
      let boughtCount = 0;
      for (let attempt = 0; attempt < 5; attempt++) {
        // عشان ما يضغطش مرتين على نفس السهم، حطينا فلتر بسيط
        let foundGreen = await page.evaluate(() => {
          const rows = document.querySelectorAll('tr');
          for (let row of rows) {
            // البحث عن أي قيمة تبدأ بـ $ وفيها سهم أخضر
            const isGreen = [...row.querySelectorAll('td')].some(cell => {
              const text = cell.innerText.trim();
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
        await sleep(2000);

        // انتظر ظهور زر Buy ثم اضغط
        await page.waitForFunction(() => {
          let b = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Buy' && b.offsetParent !== null);
          if (b) b.click();
          return true;
        }, { timeout: 5000 }).catch(() => {});
        await sleep(2000);

        // انتظر ظهور زر YES ثم اضغط
        await page.waitForFunction(() => {
          let b = [...document.querySelectorAll('button, span, div')].find(b => b.innerText.trim().toUpperCase() === 'YES' && b.offsetWidth > 0);
          if (b) b.click();
          return true;
        }, { timeout: 5000 }).catch(() => {});
        await sleep(3000);
        console.log(`✅ تم شراء السهم الأخضر رقم ${boughtCount}`);
      }

      if (boughtCount === 0) {
        console.log("⏳ مفيش أسهم خضراء في الوقت الحالي (هستنى 10 دقايق)");
      }

      await sleep(600000); // 10 دقايق
    } catch (e) {
      console.log("⚠️ حصل خطأ مؤقت:", e.message);
      await sleep(5000);
    }
  }
})();
