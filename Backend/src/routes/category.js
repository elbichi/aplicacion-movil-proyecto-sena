const express = require('express');
const router = express.Router();

const {
   getCategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory, 
    deleteCategory,
    toggleCategoryStatus,
    reorderCategories,
    getCategoryStats
} = require('../controller/CategoryController');

//Midllewares de autenticacion y autorizacion
const{
    verifyToken,
    verifyAdminOrCoordinador,
    verifyAdmin
} = require('../middlewares/auth');

//Middleware de validacion 
const {validateObjectId,} = require('../middlewares/errorHandler');


//Categorias activas para fronted publicio
router.get('/active', getActiveCategories);

//aplicar verificacion de token a todos las rutas
router.use(verifyToken);

//estadisticas de  las categorias
router.get('/stats', verifyAdmin, getCategoryStats);

//reordenar categorias
router.post('/reorder', verifyAdminOrCoordinador, reorderCategories);

//lista de todos los categorias
router.get('/',  getCategories);

//categoria por id
router.get('/:id', validateObjectId('id'),  getCategoryById);

//crear un nuevo categoria
router.post('/', verifyAdminOrCoordinador, createCategory);

//actualizar un categoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateCategory);

//eliminar un categoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteCategory);

//activar o desactivar un categoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleCategoryStatus);


module.exports = router;
