import * as admin from 'firebase-admin';
admin.initializeApp();

export const db = admin.firestore();
export const storage = admin.storage();
export const message = admin.messaging();

export const timestamp = admin.firestore.Timestamp.now();