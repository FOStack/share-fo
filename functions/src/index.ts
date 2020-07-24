import * as functions from 'firebase-functions';
import * as puppeteer from 'puppeteer';
// import * as fb from './modules/facebook';

import { 
    db,
    timestamp,
    // storage
} from './modules/admin';

interface Workers {
    [key: string]: (options: any) => Promise<any>
}

// function paragraph(c:any, n:any) {
//     return c + n;
// }

const perform: Workers = {
    log: () => db.collection('logs').add({ hello: 'Howdy!'})
}

export const tasks = functions.runWith({memory: '2GB'}).pubsub
.schedule('0 0 * * *').onRun(async context => {
    console.log(context);
    const now = timestamp;
    const query = db.collection('tasks').where('performAt', '<=', now).where('status', '==', 'scheduled');
    const queue = await query.get();
    const jobs: Promise<any>[] = [];

    queue.forEach(doc => {
        const { worker, options } = doc.data();
        
        const job = perform[worker](options)
                    .then(() => doc.ref.update({status: 'complete'}))
                    .catch(async (err) => {
                        console.log({now, queue, err});
                        await doc.ref.update({status: 'error'})
                    });

        jobs.push(job);
    });

    // fb.get();

    return await Promise.all(jobs);
});



const getContent = async () => {
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--disable-gpu',
        //   '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--timeout=30000',
        //   '--no-first-run',
          '--no-sandbox',
          '--no-zygote',
          '--single-process',
        //   "--proxy-server='direct://'",
        //   '--proxy-bypass-list=*',
          '--deterministic-fetch',
        ],
    });
    
    const page = await browser.newPage();

    await page.goto('https://google.com');

    await page.type('input.gLFyf.gsfi', 
    'after:2020-05-01 site:twitter.com inurl:status ~food ~order'
    );

    await page.keyboard.press('Enter');

    await page.waitFor(5000);
                
    const links = await page.$$('div.r');

    await page.waitFor(1000);
    
    const i = Math.floor(Math.random() * (links.length - 1));
    
    const url = await links[i].$eval('a', e => e.getAttribute('href'));
    
    if(!url)
    return {index: i};

    await page.goto(url);

    await page.waitFor(5000);

    const post = await page.$eval(
    'div.css-901oao.r-jwli3a.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-bnwqim.r-qvutc0 span.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0', e => e.innerHTML
    );

    // const text = await page.evaluate((p:any) => p.contentText, post);

    // const data = await page.evaluate(() => {

    //     // function sources(c:any, v:any) {
    //     //     if(v.src.includes('media')) {
    //     //         c.push(v.src);
    //     //     }
    //     //     return c;
    //     // }
        
    //     const images = document.querySelectorAll('img');
    //     const text = document.querySelector(
    //     'div.css-901oao.r-jwli3a.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-bnwqim.r-qvutc0 span.css-901oao.css-16my406.r-1qd0xha.r-ad9z0x.r-bcqeeo.r-qvutc0'
    //     );

    //     return {
    //         images: Array.from(images).map(v => v.src),
    //         text: text||'Couldn\'t scrape'
    //     }
    // });

    await page.close();

    await browser.close();
    
    return {text: post};
};



export const scrape = functions.runWith({memory: '2GB', timeoutSeconds: 540}).pubsub
.schedule('0 * * * *').onRun(async (/*context*/) => {
    // try {
        const data = await getContent();
        // console.log({data, eventType: context.eventType});
        await db.collection('tweets').add(data);
        return true;
    // } catch (e) {
    //     console.log(JSON.stringify({message:e.message, eventType: context.eventType}));
    //     return e;
    // }
});