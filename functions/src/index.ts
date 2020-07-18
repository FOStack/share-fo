import * as functions from 'firebase-functions';
import * as puppeteer from 'puppeteer';
// import * as fb from './modules/facebook';

import { 
    db,
    timestamp
} from './modules/admin';

interface Workers {
    [key: string]: (options: any) => Promise<any>
}

const perform: Workers = {
    log: () => db.collection('logs').add({ hello: 'Howdy!'})
}

export const tasks = functions.runWith({memory: '2GB'}).pubsub
.schedule('0 0 * * *').onRun(async context => {
    const now = timestamp;
    const query = db.collection('tasks').where('performAt', '<=', now).where('status', '==', 'scheduled');
    const queue = await query.get();
    const jobs: Promise<any>[] = [];

    console.log({now, queue});

    queue.forEach(doc => {
        const { worker, options } = doc.data();
        
        const job = perform[worker](options)
                    .then(() => doc.ref.update({status: 'complete'}))
                    .catch((err) => doc.ref.update({status: 'error'}));

        jobs.push(job);
    });

    // fb.get();

    return await Promise.all(jobs);
});



const getContent = async () => {
    
    const browser = await puppeteer.launch({headless: true});
    
    const page = await browser.newPage();

    await page.goto('https://google.com');

    await page.type('input.gLFyf.gsfi', 'after:2020-01-01 site:twitter.com inurl:status *food *order');

    await page.keyboard.press('Enter');

    await page.waitFor(2000);

    // await page.waitForSelector('div#resultStats');
                
    const links = await page.$$('div.r');
    
    const i = Math.floor((Math.random() * links.length) + 1);
    
    await links[i].click();

    await page.waitFor(5000);

    const img:any = await page.screenshot({path: '1.png'});
    
    return db.collection('screenshots').add(img);
};



export const scrape = functions.runWith({memory: '1GB'}).pubsub
.schedule('*/10 * * * *').onRun(async context => {
    try {
        await getContent();
        return true;
    } catch (e) {
        return e;
    }
});