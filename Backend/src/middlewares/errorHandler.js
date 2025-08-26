const errorHandler = (err, req, res, next) => {
    console.error('Error Stack:', err.stack);

    if(err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors
        });
    }

    // Error de duplicacion
    if(err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} Error de duplicación`,
        });
    }

    //Error de cast objectId
    if(err.name === 'castError'){
        return res.status(400).json({
            success: false,
            message: 'ID de objeto no válido',
        });
    }

    //Error JWT
    if(err.name === 'JsonWebTokenError'){
        return res.status(401).json({
            success: false,
            message: 'Token inválido',
        });
    }

    if(err.name === 'TokenExpiredError'){
        return res.status(401).json({
            success: false,
            message: 'Token expirado',
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
    });

};

//middleware para rutas no encontradas 
const notFound = (req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

//Middleware para validar ObjectId
const validateObjectId =(paramName='id')=>{
    return (req, res, next)=>{
        const mongoose = require('mongoose');
        const id = req.params[paramName];

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({
                success:false,
                message:'ID invalido'
            })
        }
        next();
    };
};

//Middleware para capturar errores asincronicos
const asyncHandler =(fn)=>(req, res, next)=>{
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFound,
    validateObjectId,
    asyncHandler
};