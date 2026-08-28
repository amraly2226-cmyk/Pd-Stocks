const puppeteer = require('puppeteer-core');

const COOKIE_VALUE = "eyJpdiI6InptT2kwYW5BWkJ3aUZRNmdKb21rVUE9PSIsInZhbHVlIjoiTTk0MVV1SERXK3djTDBjMjdWWEZiQXRETW9NTm9wczJLZ3dhZXNUbzRlMEUrTjlJL051M2E3Z1piSnAwMzFCOTJnQjRvNDZGbXNrWi9vaGR5V1VaZXVtWWo4TFZYQmhYZXI5Q24weDV2aWdiWnBPOHc5a1M0YktLUGVxY2J0Z0oiLCJtYWMiOiI0OTI2ZTMxY2E3ZmViMjg3NjkwNGFkMjQyODM2YmQ4YmFjOTYxOTE3MGE1YjVhYjNkNWY1MGVmNWY0ZGIwNWRiIiwidGFnIjoiIn0%3D";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("🚀 بوت الأسهم بيشتغل (بحث عن الرسم الأخضر فقط)...");

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

            console.log("🔄 ببحث عن الأسهم اللي رسمها البياني أخضر...");

            // انتظر ظهور الجدول
            await page.waitForSelector('tr', { timeout: 20000 }).catch(() => {});

            // البحث عن صف فيه رسم بياني أخضر (SVG) ثم الضغط على Max
            let foundGreenChart = await page.evaluate(() => {
                const rows = document.querySelectorAll('tr');
                
                for (let row of rows) {
                    // البحث عن الرسم البياني (SVG أو Canvas) داخل الصف
                    const charts = row.querySelectorAll('svg, canvas');
                    let isGreenChart = false;
                    
                    for (let chart of charts) {
                        // فحص لون الرسم نفسه
                        const color = window.getComputedStyle(chart).color;
                        if (color.includes('76, 175') || color.includes('0, 128') || color.includes('0, 200') || color.includes('0, 255')) {
                            isGreenChart = true;
                            break;
                        }
                        
                        // فحص لون الخطوط في الرسم (Path / Polyline / Line)
                        const paths = chart.querySelectorAll('path, polyline, line');
                        for (let p of paths) {
                            const stroke = (p.getAttribute('stroke') || '').toLowerCase();
                            const fill = (p.getAttribute('fill') || '').toLowerCase();
                            if (stroke.includes('green') || stroke.includes('#4caf50') || stroke.includes('#00ff00') || 
                                fill.includes('green') || fill.includes('#4caf50') || fill.includes('#00ff00')) {
                                isGreenChart = true;
                                break;
                            }
                        }
                        if (isGreenChart) break;
                    }

                    if (isGreenChart) {
                        // لاقينا سهم رسمه أخضر، دلوقتي ندوس على زر Max جنبه (مع تجاهل زر Max في القياس)
                        const maxSpan = row.querySelector('span.stock-fillmax-btn');
                        if (maxSpan) {
                            maxSpan.click();
                            return true;
                        }
                    }
                }
                return false;
            });

            if (foundGreenChart) {
                console.log("✅ لقيت سهم رسمه أخضر، داست على Max!");
                await sleep(2000);

                // الضغط على زر Buy الرئيسي
                await page.evaluate(() => {
                    let buyBtn = document.getElementById('bottomBuyBtn');
                    if (buyBtn) buyBtn.click();
                });
                console.log("✅ داست على زر Buy");

                // انتظر النافذة واضغط YES
                await sleep(2500);
                let purchaseSuccess = await page.evaluate(() => {
                    let yesBtn = [...document.querySelectorAll('button, span')].find(el => el.innerText.trim().toUpperCase() === 'YES' && el.offsetWidth > 0);
                    if (yesBtn) { yesBtn.click(); return true; }
                    return false;
                });

                if (purchaseSuccess) {
                    console.log("✅ تم الشراء بنجاح!");
                } else {
                    console.log("⚠️ مش لاقي زر YES");
                }
            } else {
                console.log("⏳ مفيش أسهم رسمها أخضر دلوقتي (الرسم أحمر أو أصفر)، هستنى 10 دقايق");
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
