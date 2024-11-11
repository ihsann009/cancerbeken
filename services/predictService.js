const tf = require('@tensorflow/tfjs-node');
const { storeData, getData } = require('./dbService');
const { InputError } = require('../utils/errorHandler');

let model;

async function loadModel() {
    const modelPath = process.env.MODEL_URL || 'file://model/model.json';
    model = await tf.loadGraphModel(modelPath);
    return model;
}

async function postPredictHandler(request, h) {
    try {
        const { image } = request.payload;
        if (!image) throw new InputError('No image provided.');

        // Konversi stream `image` ke Buffer
        const imageBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            image.on('data', chunk => chunks.push(chunk));
            image.on('end', () => resolve(Buffer.concat(chunks)));
            image.on('error', reject);
        });

        // Decode buffer dan ubah menjadi tensor
        const tensor = tf.node.decodeImage(imageBuffer, 3)
            .resizeNearestNeighbor([224, 224])
            .expandDims()
            .toFloat();

        // Prediksi menggunakan model
        const prediction = model.predict(tensor);
        const score = prediction.dataSync()[0];
        const label = score > 0.5 ? 'Cancer' : 'Non-cancer';
        const suggestion = label === 'Cancer' ? 'Check with a doctor!' : 'No cancer detected.';

        const result = { label, suggestion, confidence: score };
        await storeData(result);

        return h.response({ status: 'success', data: result }).code(201);
    } catch (error) {
        console.error(error);
        return h.response({ status: 'fail', message: error.message }).code(400);
    }
}

async function getHistoryHandler(request, h) {
    const { id } = request.params;
    const data = await getData(id);
    if (!data) return h.response({ status: 'fail', message: 'Data not found' }).code(404);
    return h.response({ status: 'success', data }).code(200);
}

module.exports = { postPredictHandler, getHistoryHandler, loadModel };
