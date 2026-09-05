const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "ضع_الكوكي_الجديد_هنا";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل (نسخة إصلاح نافذة التأكيد)...");

  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] 
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 }); 
  page.setDefaultTimeout(60000);

  // 🔥 السر السحري هنا: يقبل أي نافذة تأكيد منبثقة (Confirm/Alert) تلقائياً
  page.on('dialog', async dialog => { await dialog.accept(); });

  try {
    await page.setCookie({ name: 'project-dark-session', value: COOKIE_VALUE, domain: '.project-dark.co.uk' });
    await page.goto('https://project-dark.co.uk/stocks', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(5000);
    console.log("✅ دخلنا صفحة الأسهم!");
  } catch (e) {
    console.log("⚠️ مشكلة في الدخول:", e.message);
  }

  while (true) {
    try {
      // 1) بيع كل الأسهم (باستخدام الزر الرئيسي في الأسفل)
      console.log("🔴 [1/2] بيع كل الأسهم...");

      // انتظر ظهور الزر الرئيسي "Sell All" في الأسفل
      let sellAllHandle = await page.waitForSelector('#bottomSellAllBtn', { visible: true, timeout: 10000 }).catch(() => null);
      if (!sellAllHandle) {
        sellAllHandle = await page.waitForSelector('text=Sell All >> nth=-1', { timeout: 5000 }).catch(() => null);
      }

      if (sellAllHandle) {
        await sellAllHandle.click();
        await sleep(2000);
        
        // 🔥 ننتظر ظهور زر التأكيد من خلال "Dialog" الذي سيقبله الـ page.on،
        // لكن أحياناً يظهر زر HTML. نبحث عنه هنا.
        let confirmSellHandle = await page.waitForSelector('button:has-text("SELL ALL"), span:has-text("SELL ALL")', { visible: true, timeout: 5000 }).catch(() => null);
        if (confirmSellHandle) {
          await confirmSellHandle.click();
          console.log("✅ تم الضغط على زر التأكيد!");
        }
      }
      
      await sleep(3000);

      // 2) شراء الأسهم الخضراء
      console.log("🟢 [2/2] شراء الأسهم الخضراء...");

      // ابحث عن أول صف فيه سهم صاعد وزر Max
      let maxFound = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr');
        for (let row of rows) {
          const isGreen = [...row.querySelectorAll('td')].some(cell => {
            const text = cell.innerText.trim();
            return (text.includes('↑') || text.includes('▲'));
          });

          if (isGreen) {
            const maxSpan = row.querySelector('span.stock-fillmax-btn');
            if (maxSpan) { 
              const rect = maxSpan.getBoundingClientRect();
              return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
          }
        }
        return null;
      });

      if (maxFound) {
        await page.mouse.click(maxFound.x, maxFound.y); // نقرة حقيقية
        await sleep(2000);
        
        let buyBtnHandle = await page.waitForSelector('#bottomBuyBtn', { visible: true, timeout: 5000 }).catch(() => null);
        if (buyBtnHandle) await buyBtnHandle.click();
        
        await sleep(1500);

        let yesBtnHandle = await page.waitForSelector('button:has-text("YES"), span:has-text("YES")', { visible: true, timeout: 5000 }).catch(() => null);
        if (yesBtnHandle) {
          await yesBtnHandle.click();
          console.log("✅ تم الضغط على زر تأكيد الشراء!");
        }
      } else {
        console.log("⏳ مفيش أسهم خضراء في الوقت الحالي، هستنى.");
      }

      // انتظار 10 دقايق
      console.log("⏳ هستنى 10 دقايق...");
      await sleep(600000);
    } catch (e) {
      console.log("⚠️ حصل خطأ مؤقت:", e.message);
      await sleep(5000);
    }
  }
})();
