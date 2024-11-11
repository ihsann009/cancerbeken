require('dotenv').config();
const Hapi = require('@hapi/hapi');
const routes = require('./routes');
const loadModel = require('../services/predictService').loadModel;

const init = async () => {
    const server = Hapi.server({
        port: process.env.APP_PORT || 8080,
        host: process.env.APP_HOST || '0.0.0.0',
        routes: { cors: { origin: ['*'] } },
    });

    // Load model dan simpan di server.app agar dapat diakses di handler
    server.app.model = await loadModel();

    // Tambah rute API
    server.route(routes);

    await server.start();
    console.log(`Server running on ${server.info.uri}`);
};

init().catch(err => {
    console.error('Server startup error:', err);
    process.exit(1);
});
