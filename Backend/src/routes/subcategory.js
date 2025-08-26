const express=require('express');
const router =express.Router();

const{
    getSubcategories,
    getSubcategoriesByCategory,
    getActiveSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    reorderSubcategories,
    getSubcategoryStats
} = require('../controller/subcategoryController');

//Midllewares de autenticacion y autorizacion
const{
    verifyToken,
    verifyAdminOrCoordinador,
    verifyAdmin
} = require('../middlewares/auth');

//Middleware de validacion 
const {validateObjectId,} = require('../middlewares/errorHandler');


//Subcategorias activas para frontend publico
router.get('/active', getActiveSubcategories);

//subcategorias activadas para el frontend publico
router.get('/category/:categoryId', validateObjectId('categoryId'), getSubcategoriesByCategory);

//aplicar verificacion de token a todos las rutas
router.use(verifyToken);

//estadistas de  los subcategorias
router.get('/stats', verifyAdmin, getSubcategoryStats);

//reordenar subcategorias
router.post('/reorder', verifyAdminOrCoordinador, reorderSubcategories);

//lista de todos los subcategorias
router.get('/',  getSubcategories);

//subcategoria por id
router.get('/:id', validateObjectId('id'),  getSubcategoryById);

//crear un nuevo subcategoria
router.post('/', verifyAdminOrCoordinador, createSubcategory);

//actualizar un subcategoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateSubcategory);

//eliminar un subcategoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteSubcategory);

//activar o desactivar un subcategoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleSubcategoryStatus);


module.exports = router;
