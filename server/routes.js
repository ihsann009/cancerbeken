const { postPredictHandler, getHistoryHandler,getAllHistoriesHandler } = require('../services/predictService');

module.exports = [
    {
        method: 'POST',
        path: '/predict',
        handler: postPredictHandler,
        options: {
            payload: { maxBytes: 10485760, output: 'stream', parse: true, allow: 'multipart/form-data',multipart: true },
        },
    },
    {
        method: 'GET',
        path: '/predict/histories/{id}',
        handler: getHistoryHandler,
    },
    {
        method: 'GET',
        path: '/predict/histories',
        handler: getAllHistoriesHandler
    }
];
