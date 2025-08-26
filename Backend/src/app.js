require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const { errorHandler, notFound } = require('./middlewares/errorHandler');
const apiRoutes = require('./routes');
const app = express();

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'exp://0.0.0.0:8081',
        'exp://0.0.0.0:8082',
        'exp://0.0.0.0:8083',
        'http://0.0.0.0:8081',
        'http://0.0.0.0:8082',
        'http://0.0.0.0:8083',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:8083',
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.url} ${req.path} - ${new Date().toDateString()} `);
        next();
    });
};

//configuracion de rutas
app.use('/api', apiRoutes);
app.get('/', (req, res) => {
    console.log('GET / peticion recibida desde ', req.ip);
    res.status(200).json({
        success: true,
        message: 'servidor del api de gestion de productos',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date,
        clienteIp: req.ip
    });
});

app.use(notFound);
app.use(errorHandler);
//conexion en la base de datos
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDb conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error al conectar a MongoDb: ${error.message}`);
        process.exit(1);
    }
};

//iniciando servidor
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        const HOST = process.env.HOST || '0.0.0.0';

        app.listen(PORT, HOST, () => {
            console.log(
                `Servidor iniciado
                puerto : ${PORT.toString().padEnd(49)} || Modo: ${process.env.NODE_ENV ||
                'development'.padEnd(37)} ||
                      URL local: http://localhost:${PORT.toString().padEnd(37)} ||
                      URL red: http://${HOST}:${PORT.toString().padEnd(37)}
                      
                      enpoints disponibles:
                      *Get /- informacion del servicio
                      *Get /api - informacion de la api
                      *post /api/auth/login - login -Login
                      *Get /api/users - Gestion de usuarios
                      *Get /api/categories - Gestion de categorias
                      *Get /api/subcategories - Gestion de subcategorias
                      *Get /api/products - Gestion de productos
                      
                      DOCUMENTACION DE POSTMAN:`);
        });

    } catch (error) {
        console.error(`Error al iniciar el servidor: ${error.message}`);
        process.exit(1);
    }
};


process.on('uncaughtException', (error) => {
    console.error(`|uncaught Exception|:`, error.message);
    process.exit(1);
});

//iniciar el servidor 
startServer();

process.on('unhandledRedection', (error) => {
    console.error(`|unhandled Promise Rejection|:`, error.message);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('SIGINT recibido. Cerrando Servidor gracefully..');
    mongoose.connection.close(() => {
        console.log('Conexion a mongoDB cerrada');
        process.exit(0);
    });
});

module.exports = app;
