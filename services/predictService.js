const tf = require('@tensorflow/tfjs-node');
const { storeData, getData } = require('./dbService');
const { InputError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

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

        // Check if image size exceeds 1 MB (1,000,000 bytes)
        const MAX_SIZE = 1000000; // 1 MB in bytes
        const contentLength = request.headers['content-length'];
        
        if (contentLength && parseInt(contentLength) > MAX_SIZE) {
            return h.response({
                statusCode: 413,
                error: "Request Entity Too Large",
                message: "Payload content length greater than maximum allowed: ${MAX_SIZE}"
            }).code(413);
        }

        // Convert image stream to Buffer
        const imageBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            image.on('data', chunk => chunks.push(chunk));
            image.on('end', () => resolve(Buffer.concat(chunks)));
            image.on('error', reject);
        });

        // Decode buffer and convert it to tensor
        const tensor = tf.node.decodeImage(imageBuffer, 3)
            .resizeNearestNeighbor([224, 224])
            .expandDims()
            .toFloat();

        // Make prediction using the model
        const prediction = model.predict(tensor);
        const score = prediction.dataSync()[0];
        
        // Check if prediction is valid
        const label = score > 0.5 ? 'Cancer' : 'Non-cancer';
        
        // If the prediction does not result in a valid label
        if (label !== 'Cancer' && label !== 'Non-cancer') {
            return h.response({
                status: 'fail',
                message: 'Terjadi kesalahan dalam melakukan prediksi'
            }).code(400);
        }

        // Prepare the result for storage and response
        const suggestion = label === 'Cancer' ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.';
        const result = {
            id: uuidv4(),
            result: label,
            suggestion,
            createdAt: new Date().toISOString(),
        };

        // Store result in Firestore
        await storeData(result);

        // Return response in desired format
        return h.response({
            status: 'success',
            message: 'Model is predicted successfully',
            data: result,
        }).code(201);
    } catch (error) {
        console.error(error);
        return h.response({ status: 'fail', message: 'Terjadi kesalahan dalam melakukan prediksi' }).code(400);
    }
}

async function getHistoryHandler(request, h) {
    const { id } = request.params;
    const data = await getData(id);
    if (!data) return h.response({ status: 'fail', message: 'Data not found' }).code(404);
    return h.response({ status: 'success', data }).code(200);
}

module.exports = { postPredictHandler, getHistoryHandler, loadModel };


