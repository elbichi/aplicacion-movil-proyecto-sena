const express=require('express');
const router =express.Router();

const{
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserStats,
} = require('../controller/UserController');

//Midllewares de autenticacion y autorizacion
const{
    verifyToken,
    verifyAdminOrOwner,
    verifyAdmin
} = require('../middlewares/auth');

//Middleware de validacion 
const {validateObjectId,} = require('../middlewares/errorHandler');

//aplicar verificacion de token a todos las rutas
router.use(verifyToken);

//estadistas de  los usuarios 
router.get('/stats', verifyAdmin, getUserStats);

//lista de todos los usarios 
router.get('/', verifyAdmin, getUsers);

//usuario por id
router.get('/:id', validateObjectId('id'), verifyAdminOrOwner, getUserById);

//crear un nuevo usuario
router.post('/', verifyAdmin, createUser);

//actualizar un usuario
router.put('/:id', validateObjectId('id'), verifyAdminOrOwner, updateUser);

//eliminar un usuario
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteUser);

//activar o desactivar un usuario
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdmin, toggleUserStatus);

module.exports = router;
