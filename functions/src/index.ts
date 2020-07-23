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

function sources(c:any, v:any) {
    if(v.src.includes('media')) {
        c.push(v.src);
    }
    return c;
}

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
    
    const browser = await puppeteer.launch({headless: true});
    
    const page = await browser.newPage();

    await page.goto('https://google.com');

    await page.type('input.gLFyf.gsfi', 
    'after:2020-05-01 site:twitter.com inurl:status ~food ~order'
    );

    await page.keyboard.press('Enter');

    await page.waitFor(2000);

    // await page.waitForSelector('div#resultStats');
                
    const links = await page.$$('div.r');
    
    const i = Math.floor(Math.random() * links.length);
    
    await links[i].click();

    await page.waitFor(5000);

    const data = await page.evaluate(() => {
        
        const images = document.querySelectorAll('img');
        const text = document.querySelector('div.css-901oao');

        const info = {
            images: Array.from(images).reduce(sources, []),
            text: text?.textContent
        }

        return info;
    });

    // if(data.images.length > 0){
    // }
    await db.collection('tweets').add(data);

    await browser.close();
    
    return "complete";
};



export const scrape = functions.runWith({memory: '2GB'}).pubsub
.schedule('*/10 * * * *').onRun(async context => {
    try {
        await getContent();
        return true;
    } catch (e) {
        console.log(JSON.stringify({e, context}));
        return e;
    }
});