const bcrypt = require ('bcryptjs');
const User = require ('../models/User');
const {generateToken}= require ('../utils/jwt');
const {asyncHandler}= require ('../middlewares/errorHandler');


//login de usuario 
const login = asyncHandler(async (req, res) => {
    console.log('DEBUG: Datos recibidos en el login', req.body);
    const { email, username, password } = req.body;
    const loginFields = email || username;
    console.log('DEBUG: Campo de login ', loginFields);
    console.log('DEBUG: password ', password ? 'PROVIDED' : 'NOT PROVIDED');

    //VALIDACION DE CAMPOS REQUERIDOS
    if (!loginFields || !password) {
        console.log('Error -Falta credenciales');
        return res.status(400).json({
            success: false,
            message: 'Username y contraseña son requeridos'
        });
    }

    //Busqueda de usuarios en la base de datos
try {
console.log('DEBUG: Buscando usuario con:',loginFields.toLowerCase());
    const user = await User.findOne({
       $or:[
           { username: loginFields.toLowerCase() },
           { email: loginFields.toLowerCase() }
       ]
    }).select('+password'); //incluye el campo de password oculto
    console.log('DEBUG: Usuario encontrado:', user ? user.username : 'NINGUNO');
    if(!user){
        console.log('Error - Usuario no encontrado');
        return res.status(404).json({
            success: false,
            message: 'Credenciales invalidades'
        });
    }
    //Validacion de usuario inactivo
    if(!user.isActive){
        console.log('Error - Usuario inactivo');
        return res.status(403).json({
            success: false,
            message: 'Usuario inactivo contactar al administrador'
        });
    }
    //VERIFICACION DE CONTRASEÑAS
    console.log('DEBUG: Verificando constraseña');
    const isPasswordValid = await user.comparePassword(password);
    console.log('DEBUG: Contraseña válida:', isPasswordValid);
    if(!isPasswordValid){
        console.log('Error - Contraseña inválida');
        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }
    user.lastlogin = new Date();
    await user.save();

    //Crear respuesta del usuario sin contraseña
   const userResponse = {
       _id: user._id,
       username: user.username,
       email: user.email,
       firstName: user.firstName,
       lastName: user.lastName,
       role: user.role,
       isActive: user.isActive,
       lastlogin: user.lastlogin
   };

    //generar token JWT
    const token = generateToken(user._id);
    res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
            user: userResponse,
            token,
            expiresIn: process.env.JWT_EXPIRES || '1h'
        }
    });
    
}catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
}
});

//obtener informacion del usuario autenicado
const getMe =asyncHandler(async (req,res)=>{
    const user=await User.findById(req.user._id);
    res.status(200).json({
        success:true,
        data:user
    });
});

//cambio de contraseña
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Validar campos requeridos
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Contraseña actual y nueva son requeridas'
        });
    }
    if(newPassword.length < 6){
        return res.status(400).json({
            success: false,
            message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
    }
    // Obtener usuario con contraseña actual
    const user = await User.findById(req.user._id).select('+password');
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        return res.status(401).json({
            success: false,
            message: 'La contraseña actual es incorrecta'
        });
    }

    // Cambiar contraseña
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
    });
});

//incalidar token usuario extraño
const logout= asyncHandler(async(req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logut exitoso invalida el token en el cliente'
    });

   
});

 //verifica token
    const verifyToken =asyncHandler(async (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Token verificado exitosamente',
            data: req.user
        });
    });

module.exports ={
    login,
    getMe,
    changePassword,
    logout,
    verifyToken
};

