const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

async function storeData(data) {
    const id = Date.now().toString();
    await db.collection('predictions').doc(id).set(data);
}

async function getData(id) {
    const doc = await db.collection('predictions').doc(id).get();
    return doc.exists ? doc.data() : null;
}

module.exports = { storeData, getData };
