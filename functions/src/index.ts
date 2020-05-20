import * as functions from 'firebase-functions';
import * as puppeteer from 'puppeteer';

import { 
    db,
    timestamp
} from './modules/admin';

interface Workers {
    [key: string]: (options: any) => Promise<any>
}

const workers: Workers = {
    log: () => db.collection('logs').add({ hello: 'Howdy!'})
}

export const tasks = functions.runWith({memory: '2GB'}).pubsub
.schedule('0 * * * *').onRun(async (context:any) => {
    const now = timestamp;
    const query = db.collection('tasks').where('performAt', '<=', now).where('status', '==', 'scheduled');
    const queue = await query.get();
    const jobs: Promise<any>[] = [];

    console.log({now, queue});
    console.log('Puppeteer added');

    queue.forEach((doc:any) => {
        const { worker, options } = doc.data();
        
        const job = workers[worker](options)
                    .then(() => doc.ref.update({status: 'complete'}))
                    .catch((err) => doc.ref.update({status: 'error'}));

        jobs.push(job);
    });

    let browser = await puppeteer.launch({
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto('https://homefry.app/', {waitUntil: 'networkidle2'});
        const buffer = await page.screenshot({fullPage: true});
        console.log(buffer);
        // res.type('image/png').send(buffer);
    } catch (e) {
        // res.status(500).send(e.toString());
    }

    return await Promise.all(jobs);
});