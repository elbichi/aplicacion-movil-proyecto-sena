const { User } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler')

//obtener los usuarios
const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    //Filtros dinamicos 
    const filter = {};
    //ROL
    if (req.query.role) filter.role = req.query.role;
    //Activo/inactivo
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === true;
    //Multiples filtros
    if (req.query.filter) {
        filter.$or = [
            { username: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
            { firstName: { $regex: req.query.search, $options: 'i' } },
            { lastname: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    //consulta de pagina 
    const users = await User.find(filter)
        .populate('createdBy', 'username firstName lastname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    //contar total de usuarios
    const total = await User.countDocuments(filter);

    res.status(200).json({
        success: true,
        data: users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });


});


//Obtener un usuario por ID
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id)
        .populate('createdBy', 'username firstName lastname');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

//crear un nuevo usuario
const createUser = asyncHandler(async (req, res) => {
    const { username, email, password, firstName, lastName,phone, role,isActive } = req.body;


    //validaciones
    if (!username || !email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({
            success: false,
            message: 'Por favor, complete todos los campos requeridos'
        });
    }
    //Verificar si el usuario ya existe
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Usuario o correo electrónico ya existe'
        });
    }

    //Crear el usuario 
    const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id
    });
    res.status(201).json({
        success: true,
        data: user
    });
});


//actualizar un usuario
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    //
    const {
        username,
        email,
        firstName,
        lastName,
        role,
        phone,
        isActive,
    } = req.body;

    //si no es admin solo puede actualizar ciertos campos y solo su perfil 
    if (req.user.role !== 'admin') {
        if (req.user._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para actualizar este usuario'
            });
        }

        //solo los admin pueden cambiar todo o isactive
        if (role == !undefined || isActive !== undefined) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cambiar el rol o el estado de este usuario'
            });

        }
    }

    //verificar duplicados si se cambia username o email 
    if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está en uso'
            });
        }
    }
    if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está en uso'
            });
        }
    }
    //Actualizar campos 
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;


    //solo admin puede cambiar estos campos 
    if (req.user.role === 'admin') {
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;

    }
    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});

//Eliminar Usuario
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    // no permite que el admin se elimine a si mismo
    if (user._id.toString() === req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'No puedes eliminar tu propio usuario'
        });
    }
    await User.findOneAndDelete({ _id: req.params.id });

    res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente'
    });
});

//activar o desactivar usuario 
const toggleUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    //No ppermitir que el admin se desactive a si mismo 
    if (user._id.toString() === req.user._id.toString() && !user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'No puedes desactivar tu propio usuario'
        });
    }

    user.isActive = !user.isActive;
    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
        success: true,
        data: user,
        message: `usuario ${user.isActive ? 'activado' : 'desactivado'} correctamente`
    });

});

//optener las estadisticas del usuario
const getUserStats = asyncHandler(async (req, res) => {
    const stats = await User.aggregate([
        {
            $match: {
                _id: null,
                totalUsers:
                    { $sum: 1 },
                activeUsers: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                adminUser: {
                    $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
                },
                CoordinadorUsers: {
                    $sum: { $cond: [{ $eq: ['$role', 'coordinador'] }, 1, 0] }
                }
            }
        }
    ]);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username firstName lastName email role createdAt');
    
    res.status(200).json({
        success: true,
        data: {
            status: stats[0]||{
                totalUsers: 0,
                activeUsers: 0,
                adminUsers: 0,
                coordinadorUsers: 0
            },
            recentUsers
        }
    });
});

module.exports={
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserStats,
    
};
