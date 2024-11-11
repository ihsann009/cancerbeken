const { postPredictHandler, getHistoryHandler } = require('../services/predictService');

module.exports = [
    {
        method: 'POST',
        path: '/predict',
        handler: postPredictHandler,
        options: {
            payload: { output: 'stream', parse: true, allow: 'multipart/form-data',multipart: true },
        },
    },
    {
        method: 'GET',
        path: '/history/{id}',
        handler: getHistoryHandler,
    },
];
