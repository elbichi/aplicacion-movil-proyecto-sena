//archvios prin
const express = require('express');
const router = express.Router();

//importar las rutas modulares
const authRoutes = require('./auth');
const userRoutes = require('./user');
const categoryRoutes = require('./category');
const subcategoryRoutes = require('./subcategory');
const productRoutes = require('./product');
const { version } = require('mongoose');

//cada modulo tiene su propio espacio de nombre en la url
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/category', categoryRoutes);
router.use('/subcategory', subcategoryRoutes);
router.use('/product', productRoutes);


//permite verificar que el servidor este funcionando correctamanete
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servidor en funcionamiento',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

//proporciona documentacion basica sobre la api 
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bienvenido a la API de la gestion de productos',
        version: '1.0.0',
        endpoints:{
            auth: '/auth',
            user: '/user',
            category: '/category',
            subcategory: '/subcategory',
            product: '/product'
        },
        documentation:{
            postman:'importe la coleccion Postman para probar todos los endpoints',
            authentication:'usa /api/auth/login para obtener un token JMT'
        }

    });
});

module.exports = router;
