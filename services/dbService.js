const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

async function storeData(data) {
    const id = Date.now().toString();
    await db.collection('prediction').doc(id).set(data);
}

async function getData(id) {
    const doc = await db.collection('prediction').doc(id).get();
    return doc.exists ? doc.data() : null;
}

// Function to get all histories
async function getAllData() {
    const snapshot = await db.collection('prediction').get();
    if (snapshot.empty) {
        return [];
    }

    const allData = [];
    snapshot.forEach(doc => {
        allData.push({ id: doc.id, ...doc.data() });
    });

    return allData;
}

module.exports = { storeData, getData, getAllData };
