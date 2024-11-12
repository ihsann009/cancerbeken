const tf = require('@tensorflow/tfjs-node');
const { storeData, getData } = require('./dbService');
const { InputError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

let model;

async function loadModel() {
    if (!model) {
        const modelPath = process.env.MODEL_URL || 'file://model/model.json';
        model = await tf.loadGraphModel(modelPath);
    }
    return model;
}

async function postPredictHandler(request, h) {
    try {
        const { image } = request.payload;
        if (!image) throw new InputError('No image provided.');

        // Hardcode maximum payload size to 1 MB (1000000 bytes)
        const MAX_SIZE = 1000000;
        const contentLength = request.headers['content-length'];
        
        if (contentLength && parseInt(contentLength) > MAX_SIZE) {
            return h.response({
                statusCode: 413,
                error: "Request Entity Too Large",
                message: "Payload content length greater than maximum allowed: 1000000"
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

        // Load the model if not loaded
        await loadModel();

        // Make prediction using the model
        const prediction = model.predict(tensor);
        const score = prediction.dataSync()[0];

        // Set strict threshold for ambiguous predictions
        const STRICT_THRESHOLD_LOW = 0.1;
        const STRICT_THRESHOLD_HIGH = 0.9;

        // If the prediction score falls within the ambiguous range
        if (score >= STRICT_THRESHOLD_LOW && score <= STRICT_THRESHOLD_HIGH) {
            return h.response({
                status: "fail",
                message: "Terjadi kesalahan dalam melakukan prediksi"
            }).code(400);
        }

        // Determine the label based on the score
        const label = score > 0.9 ? 'Cancer' : 'Non-cancer';
        const suggestion = label === 'Cancer' ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.';

        // Prepare the result for storage and response
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
