const express=require('express');
const router =express.Router();

const{
    getProducts,
    getActiveProducts,
    getProductsByCategory,
    getProductsBySubcategory,
    getFeaturedProducts,
    getProductById,
    getProductBySku,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateProductStock,
    getProductStats
} = require('../controller/productController');

//Midllewares de autenticacion y autorizacion
const{
    verifyToken,
    verifyAdminOrCoordinador,
    verifyAdmin
} = require('../middlewares/auth');

//Middleware de validacion 
const {validateObjectId,} = require('../middlewares/errorHandler');

//producto 
router.get('/featured', getFeaturedProducts);

//Productos activos para frontend publico
router.get('/active', getActiveProducts);

//categorias activadas para el frontend publico
router.get('/category/:categoryId', validateObjectId('categoryId'), getProductsByCategory);
//subcategorias activadas para el frontend publico
router.get('/subcategory/:subcategoryId', validateObjectId('subcategoryId'), getProductsBySubcategory);

//aplicar verificacion de token a todos las rutas
router.use(verifyToken);

//estadistas de  los productos
router.get('/stats', verifyAdmin, getProductStats);

//optener los prioductos
router.post('/sku/:sku', verifyAdminOrCoordinador, getProductBySku);

//lista de todos los productos
router.get('/',  getProducts);

//producto por id
router.get('/:id', validateObjectId('id'),  getProductById);

//crear un nuevo producto
router.post('/', verifyAdminOrCoordinador, createProduct);

//actualizar un producto
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateProduct);

//eliminar un producto
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteProduct);

//activar o desactivar un producto
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleProductStatus);

//actualizar productos por stock
router.patch('/:id/stock', validateObjectId('id'), verifyAdminOrCoordinador, updateProductStock);

module.exports = router;
