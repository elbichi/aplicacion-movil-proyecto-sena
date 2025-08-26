const express =require('express')
const router = express.Router();


//importar controladores de autenticacion 
const{
    login,
    getMe,
    changePassword,
    logout,
    verifyToken

} = require('../controller/AuthController');


//importar middlewares
const{verifyToken:authMiddleware}=require('../middlewares/auth');

//Rutas logi
router.post('/login',login);

//Ruta obtener datos de usuarios 
router.get('/me', authMiddleware, getMe);

//Ruta de cambiar contraseña
router.put('/change-password', authMiddleware, changePassword);

//Ruta logout
router.post('/logout', authMiddleware, logout);

//Ruta para verificar token privado
router.get('/verify', authMiddleware, verifyToken);


module.exports = router;