const jwt = require('jsonwebtoken')
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó un token de autorización'
            });
        }
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Error al verificar el token:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token no válido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });

    }
};

const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'no tienes permisos para acceder a este recurso'
                });
            }

            next();
        } catch (error) {
            console.error('Error al verificar el rol:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    };
};
const verifyAdmin = verifyRole('admin');
const verifyAdminOrCoordinador = verifyRole('admin', 'coordinador');

const verifyAdminOrOwner = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'usuario no encontrado'
            });
        }
        if (req.user.role === 'admin') {
            return next();
        }
        const targeUserId = req.params.id || req.body.userId;

        if (req.user._id.toString() !== targeUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'solo puedes modificar tu propio perfil'
            });
        }

        next();
    } catch (error) {
        console.error('Error al verifyAdmininOrOwner:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    verifyToken,
    verifyRole,
    verifyAdminOrOwner,
    verifyAdminOrCoordinador,
    verifyAdmin
}
