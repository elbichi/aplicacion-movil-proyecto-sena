const { Product, Category, Subcategory } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');

//Obtener todos los productos
const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    //Filtros para la busqueda
    const filter = {};

    //Filtros por categoria y subcategoria
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;

    //Filtros booleanos (estado destacado digital)
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.isFeatured !== undefined) filter.isFeatured = req.query.isFeatured === 'true';
    if (req.query.isDigital !== undefined) filter.isDigital = req.query.isDigital === 'true';

    //Filtro por rangos de precios
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseInt(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = parseInt(req.query.maxPrice);
    }

    //Filtro de stock bajo
    if (req.query.lowStock === 'true') {
        filter.$expr = {
            $and: [
                { $eq: ['stock.trackStock', true] },
                { $lte: ['stock.quantity', '$stock.minStock'] }
            ]
        };
    }

    //Nombre o descripción
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { sku: { $regex: req.query.search, $options: 'i' } },
            { tags: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    //Consultar a la base de datos 
    let query = Product.find(filter)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('createdBy', 'username firstName lastName')
        .sort({ sortOrder: 1, name: 1 });

    if (req.query.page) {
        query = query.skip(skip).limit(limit);
    }

    //Ejecutar las consultas
    const products = await query;
    const total = await Product.countDocuments(filter);
    res.status(200).json({
        success: true,
        data: products,
        pagination: req.query.page ? {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        } : undefined
    });
});

//Obtener subcategorias por categoria

const getActiveProducts = asyncHandler(async (req, res) => {
    const products = await Product.findActive();
    res.status(200).json({
        success: true,
        data: products
    });
});

const getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    //verificar si la categoria existe y esta activa
    const products = await Product.findByCategory(categoryId);

    return res.status(200).json({
        success: true,
        data: products
    });

});

const getProductsBySubcategory = asyncHandler(async (req, res) => {
    const { subcategoryId } = req.params;
    //verificar si la subcategoria existe y esta activa
    const products = await Product.findBySubcategory(subcategoryId);

    if (!products) {
        return res.status(200).json({
            success: true,
            data: products
        });
    }
    const subcategories = await Subcategory.findByIdCategory(categoryId)
    res.status(200).json({
        success: true,
        data: subcategories
    });

});

const getFeaturedProducts = asyncHandler(async (req, res) => {
    const products = await Product.findFeatured();
    res.status(200).json({
        success: true,
        data: products
    });
});

//Obtener un producto por ID
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug description')
        .populate('subcategory', 'name slug description')
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName');

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    res.status(200).json({
        success: true,
        data: product
    });
});

const getProductBySku = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() })
        .populate('category', 'name slug description')
        .populate('subcategory', 'name slug description');
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    res.status(200).json({
        success: true,
        data: product
    });
});

//Crear una categoría
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        shortDescription,
        sku,
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock,
        dimensions,
        images,
        tags,
        isActive,
        isFeatured,
        isDigital,
        sortOrder,
        seoTitle,
        seoDescription,
    } = req.body;

    const parentCategory = await Category.findById(category);
    if (!parentCategory) {
        return res.status(400).json({
            success: false,
            message: 'La categoría especifica no existe o no esta activa'
        });
    }
    const parentSubcategory = await Subcategory.findById(subcategory);
    if (!parentSubcategory || !parentSubcategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoría especifica no existe o no esta activa'

        });
    }

    if (parentSubcategory.category.toString() !== category) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoría no pertenece a la categoría especifica'
        });
    }


    //Crear el producto
    const product = await Product.create({
        name,
        description,
        shortDescription,
        sku: sku.toUpperCase(),
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock: stock || { quantity: 0, minStock: 0, trackStock: true },
        dimensions,
        images,
        tags: tags || [],
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        isDigital: isDigital || false,
        sortOrder: sortOrder || 0,
        seoTitle,
        seoDescription,
        createdBy: req.user._id
    });
    await product.populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
    ]);

    res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
    });
});

//Actualizar un producto
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }
    const {
        name,
        description,
        shortDescription,
        sku,
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock,
        dimensions,
        images,
        tags,
        isActive,
        isFeatured,
        isDigital,
        sortOrder,
        seoTitle,
        seoDescription,
    } = req.body;

    if (sku && sku.toUpperCase() !== product.sku) {
        const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
        if (existingSku) {
            return res.status(400).json({
                success: false,
                message: 'El sku ya existe'
            });
        }
    }

    if (category || subcategory) {
        const targetCategory = category || product.category;
        const targetSubcategory = subcategory || product.subcategory;
        //si cambia la categoria vaalidar que exista y activa
        const parentCategory = await Category.findById(targetCategory);
        if (!parentCategory || !parentCategory.isActive) {
            return res.status(404).json({
                success: false,
                message: 'la categoria especificada no existe o no está activa'
            });
        }
        const parentSubcategory = await Subcategory.findById(targetSubcategory);
        if (!parentSubcategory || !parentSubcategory.isActive) {
            return res.status(404).json({
                success: false,
                message: 'la subcategoría especificada no existe o no está activa'
            });
        }
        //Verificar duplicados
        if (parentSubcategory.category.toString() !== targetCategory.toString()) {
            return res.status(404).json({
                success: false,
                message: 'la subcategoría no pertenece a la categoria especifica'
            });
        }
    }

    //Actualizar productos
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (sku) product.sku = sku.toUpperCase();
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (price !== undefined) product.price = price;
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (cost !== undefined) product.cost = cost;
    if (stock !== undefined) product.stock = stock;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (images !== undefined) product.images = images;
    if (tags !== undefined) product.tags = tags;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (isDigital !== undefined) product.isDigital = isDigital;
    if (sortOrder !== undefined) product.sortOrder = sortOrder;
    if (seoDescription !== undefined) product.seoDescription = seoDescription;

    product.updatedBy = req.user._id;
    await product.save();
    await product.populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' }
    ]);

    res.status(200).json({
        success: true,
        message: 'productos actualizados correctamente',
        data: product
    });
});

//Eliminar Producto
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'producto no encontrado'
        });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'producto eliminado correctamente'
    });
});

//Activar o desactivar Producto
const toggleProductStatus = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'producto no encontrado'
        });
    }

    product.isActive = !product.isActive;
    product.updatedBy = req.user._id;
    await product.save();


    res.status(200).json({
        success: true,
        message: `P ${product.isActive ? 'activado' : 'desactivado'} correctamente`,
        data: product
    });
});
//Actualizar stock del producto
const updateProductStock = asyncHandler(async (req, res) => {
    const { quantity, operation = 'set' } = req.body;
    if (quantity === undefined) {
        return res.status(400).json({
            success: false,
            message: 'la cantidad es requerida'
        });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(400).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }

    if (!product.stock.trackStock) {
        return res.status(400).json({
            success: false,
            message: 'Este producto no maneja un control de stock'
        });
    }

    //Operaciones set add subtract
    switch (operation) {
        case 'set':
            product.stock.quantity = quantity;
            break;
        case 'add':
            product.stock.quantity = quantity;
            break;
        case 'subtract':
            product.stock.quantity = Math.max(0, product.stock.quantity - quantity);
            break;
        default:
            return res.status(400).json({
                success: false,
                message: 'operacion invalidad Use: set, add, subtract'
            });
    }


    product.updatedBy = req.user._id;
    await product.save();
    return res.status(200).json({
        success: true,
        message: 'stock actualizado exitosamente',
        data: {
            sku: product.sku,
            name: product.name,
            previousStock: product.stock.quantity,
            newStock: product.stock.quantity,
            isLowStock: product.isLowStock,
            isOutOfStock: product.isOutOfStock,

        }
    });


});

//Obtener estadisiticas de Productos
const getProductStats = asyncHandler(async (req, res) => {
    const stats = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                activeProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                featuredProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                digiralProductigitalProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalValue: { $sum: '$price' },
                averagePrice: { $avg: '$price' }

            }
        }
    ]);
    //Productos con stock bajo
    const lowStockProducts = await Product.find({
        'stock.trackStock': true,
        $expr: { $lt: ['stock.quantity', 'stock.minStock'] }
    })
        .select('name sku stock.quantity stock.minStock')
        .limit(10);

    const expensiveProducts = await Product.find({ isActive: true })
        .sort({ price: -1 })
        .limit(5)
        .select('name sku price');

    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalProducts: 0,
                activeProducts: 0,
                featuredProducts: 0,
                digitalProducts: 0,
                totalValue: 0,
                averagePrice: 0
            },
            lowStockProducts,
            expensiveProducts
        }
    });
});

module.exports = {
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
};