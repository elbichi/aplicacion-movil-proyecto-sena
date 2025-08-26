const { Subcategory, Category, Product } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');

//Obtener todas las subcategorías
const getSubcategories = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    //Filtros par la busquedad
    const filter = {};
    //Activo/inactivo
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    //Nombre 
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } }
        ];
    }
    //Consultar a ña base de datos 
    let query = Subcategory.find(filter)
        .populate('category', 'name slug isActive')
        .populate('createdBy', 'username firstName lastName')
        .populate('productCount')
        .sort({ sortOrder: 1, name: 1 });

    if (req.query.page) {
        query = query.skip(skip).limit(limit);
    }
    //Ejecutar las consultas
    const subcategories = await query;
    const total = await Subcategory.countDocuments(filter);
    res.status(200).json({
        success: true,
        data: subcategories,
        pagination: req.query.page ? {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        } : undefined
    });
});

//Obtener subcategorias por categoria
const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    //verificar si la categoria existe y es activa
    const category = await Category.findById(categoryId);
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Categoría no encontrada o inactiva'
        });
    }


    const subcategories = await Subcategory.findByIdCategory(categoryId)
    res.status(200).json({
        success: true,
        data: subcategories
    });

});

const getActiveSubcategories = asyncHandler(async (req, res) => {
    const subcategories = await Subcategory.findActive();
    res.status(200).json({
        success: true,
        data: subcategories
    });
});

//Obtener una subcategoria por ID
const getSubcategoryById = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id)
        .populate('category', 'name slug description')
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName');

    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
    }
    //obtener subcategorias de esta categoria
    const products = await Product.find({ subcategory: subcategory._id, isActive: true })
        .select('name  price stock.quantity isActive')
        .sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
        success: true,
        data: {
            ...subcategory.toObject(),
            products
        }
    });
});

//Crear una subcategoría
const createSubcategory = asyncHandler(async (req, res) => {
    const { name, description, category, categoryId, icon, color, sortOrder, isActive } = req.body;
    const targetCategoryId = categoryId || category;


    if (!name || !targetCategoryId) {
        return res.status(400).json({
            success: false,
            message: 'El nombre de la subcategoría es requerido'
        });
    }

    const parentCategory = await Category.findById(targetCategoryId);
    if (!parentCategory) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe una categoría con ese nombre'
        });
    }
    if (!parentCategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe una categoría con ese nombre'
        });
    }
    //Verificar si la subcategoria ya existe en esa categoria
    const existingSubCategory = await Subcategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        category: targetCategoryId
    });
    if (existingSubCategory) {
        return res.status(400).json({
            success: false,
            message: 'Ya existe una subcategoría con ese nombre en esta categoría'
        });
    }
    //Crear subcategoría
    const subcategory = await Subcategory.create({
        name,
        description,
        category: targetCategoryId,
        icon,
        color,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id
    });
    await subcategory.populate('category', 'name slug isActive');

    res.status(201).json({
        success: true,
        data: subcategory
    });
});

//Actualizar Subcategoria
const updateSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
    }

    const { name, description, category, categoryId, icon,color, sortOrder, isActive } = req.body;
    const targetCategoryId = categoryId || category;
    //si cambia la categoria vaalidar que exista y activa
    if (targetCategoryId && targetCategoryId !== subcategory.category.toString()) {
        const parentCategory = await Category.findById(targetCategoryId);
        if (!parentCategory) {
            return res.status(404).json({
                success: false,
                message: 'la categoria especificada no existe'
            });
        }
        if (!parentCategory.isActive) {
            return res.status(400).json({
                success: false,
                message: 'la categoria especificada no está activa'
            });
        }

    }

    //verifica duplicados
    if ((name && name !== subcategory.name) || (targetCategoryId && targetCategoryId !== subcategory.category.toString())) {
        const existingSubcategory = await Subcategory.findOne({
            name: { $regex: new RegExp(`^${name || subcategory.name}$`, 'i') },
        });
        if (existingSubcategory) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una Subcategoría con ese nombre en esta categoria'
            });
        }
    }
    //Actualizar la subcategoría
    if (name) subcategory.name = name;
    if (description !== undefined) subcategory.description = description;
    if (targetCategoryId) subcategory.category = targetCategoryId;
    if (icon !== undefined) subcategory.icon = icon;
    if (color !== undefined) subcategory.color = color;
    if (sortOrder !== undefined) subcategory.sortOrder = sortOrder;
    if (isActive !== undefined) subcategory.isActive = isActive;
    subcategory.updatedBy = req.user._id;
    await subcategory.save();
    await subcategory.populate('category', 'name slug')

    res.status(200).json({
        success: true,
        message: 'Subcategoría actualizada correctamente',
        data: subcategory
    });
});

//Eliminar Subcategoría
const deleteSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Categoría no encontrada'
        });
    }

    //Verificar si se puede eliminar
    const canDelete = await subcategory.canBeDeleted();
    if (!canDelete) {
        return res.status(400).json({
            success: false,
            message: 'No se puede eliminar la Subcategoría porque tiene productos asociados'
        });
    }

    await Subcategory.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Subcategoría eliminada correctamente'
    });
});

//Activar o desactivar Subcategoria
const toggleSubcategoryStatus = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoría no encontrada'
        });
    }

    subcategory.isActive = !subcategory.isActive;
    subcategory.updatedBy = req.user._id;
    await subcategory.save();

    //si la subcategoria se desactiva, desactivar productos asociados 
    if (!subcategory.isActive) {
        await Subcategory.updateMany(
            { subcategory: subcategory._id },
            { isActive: false, updatedBy: req.user._id }
        );
    }

    res.status(200).json({
        success: true,
        message: `Subcategoría ${subcategory.isActive ? 'activada' : 'desactivada'} correctamente`,
        data: subcategory
    });
});
//Ordenar subcategorias
const reorderSubcategories = asyncHandler(async (req, res) => {
    const { subcategoryIds } = req.body;
    if (!Array.isArray(subcategoryIds)) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere un array de IDs de subcategorías'
        });
    }

    //Actualizar el orden de las subcategorías
    const updatePromises = subcategoryIds.map((subcategoryId, index) =>
        Subcategory.findByIdAndUpdate(
            subcategoryId,
            {
                sortOrder: index + 1, updatedBy: req.user._id
            },
            { new: true }
        )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
        success: true,
        message: 'Orden de Subcategorías actualizado correctamente'
    });
});

//Obtener estadisiticas de Subcategorías
const getSubcategoryStats = asyncHandler(async (req, res) => {
    const stats = await Subcategory.aggregate([
        {
            $group: {
                _id: null,
                totalSubcategories: { $sum: 1 },
                activateSubcategories: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                }

            }
        }
    ]);
    const subcategoriesWithSubcounts = await Subcategory.aggregate([
        {
            $lookup: {
                from: '$subcategories',
                localField: '_id',
                foreignField: 'category',
                as: 'subcategories'
            }
        },
        {
            $lookup: {
                from: '$categories',
                localField: '_id',
                foreignField: 'category',
                as: 'categoryInfo'
            }
        },
        {
            $project: {
                name: 1,
                categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] },
                productsCount: { $size: '$products' }
            }
        },
        { $sort: { productsCount: -1 } },
        { $limit: 5 }
    ]);
    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalSubcategories: 0,
                activeSubcategories: 0
            },
            topSubcategories: subcategoriesWithSubcounts
        }
    });
});

module.exports = {
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
};