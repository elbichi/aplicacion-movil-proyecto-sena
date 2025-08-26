const mongoose = require('mongoose');
const { validate } = require('./Category');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre de la subcategoria es requeridio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede ezxceder 100 caracateres ']
    },
    description: {
        type: String,
        required: [true, 'La descripcion de la subcategoria es requerida'],
        trim: true,
        maxlength: [500, 'La descripcion no puede exceder 500 caracteres']
    },
    shortDescription: {
        type: String,
        required: [true, 'La descripcion corta de la subcategoria es requerida'],
        trim: true,
        maxlength: [250, 'La descripcion corta no puede exceder 250 caracteres']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    sku: {
        type: String,
        required: [true, 'El SKU del producto es requerido'],
        unique: true,
        uppercase: true,
        minlength: [3, 'El SKU debe tener al menos 3 caracteres'],
        maxlength: [20, 'El SKU no puede exceder 20 caracteres']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'La categoria es requerida'],
        validate: {
            validator: async function (CategoryId) {
                const Category = mongoose.model('Category');
                const category = await Category.findById(CategoryId);
                return category && category.isActive;
            },
            message: 'La categoria debe exisitir y estar activa'
        }
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: [true, 'La subcategoría del producto es requerida'],
        validate: {
            validator: async function (subcategoryId) {
                const Subcategory = mongoose.model('Subcategory');
                const subcategory = await Subcategory.findById(subcategoryId);
                return subcategory && subcategory.isActive;
            },
            message: 'La subcategoría debe existir y estar activa'
        }
    },
    price: {
        type: Number,
        required: [true, 'El precio del producto es requerido'],
        min: [0, 'El precio no puede ser negativo'],
        validate: {
            validator: async function (price) {
                return Number.isFinite(price) && price >= 0;
            },
            message: 'El precio debe ser un numero valido mayor o igual a 0'
        }
    },
    comparePrice: {
        type: Number,
        min: [0, 'El precio de comparación no puede ser negativo'],
        validate: {
            validator: function (value) {
                if (value == null || value === undefined)
                    return true; // Allow null or undefined
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El precio de comparación debe ser un número válido mayor o igual a 0'
        }
    },
    cost: {
        type: Number,
        min: [0, 'El costo no puede ser negativo'],
        validate: {
            validator: function (value) {
                if (value == null || value === undefined)
                    return true; // Allow null or undefined
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El costo debe ser un número válido mayor o igual a 0'
        }
    },
    stock: {
        quantity: {
            type: Number,
            default: 0,
            min: [0, 'La cantidad en stock no puede ser negativa'],
        },
        minStock: {
            type: Number,
            default: 0,
            min: [0, 'El stock mínimo no puede ser negativo'],
        },
        trackStock: {
            type: Boolean,
            default: true
        }
    },
    dimensions: {
        weight: {
            type: Number,
            min: [0, 'El peso no puede ser negativo']
        },
        length: {
            type: Number,
            min: [0, 'La longitud no puede ser negativa']
        },
        width: {
            type: Number,
            min: [0, 'El ancho no puede ser negativo']
        },
        height: {
            type: Number,
            min: [0, 'La altura no puede ser negativa']
        },
    },
    images: [{
        url: {
            type: String,
            required: true,
            trim: true
        },
        alt: {
            type: String,
            trim: true,
            maxlength: [200, 'El texto alternativo no puede exceder 200 caracteres']
        },
        isPrimary: {
            type: Boolean,
            default: false
        }

    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Cada tag no puede exceder  50 caracteres']
    }],

    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isDigital: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        default: 0,
        maxlength: [70, 'El titulo no puede exceder lo  70 caracteres']
    },
    seoDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'La descripción SEO no puede exceder 160 caracteres']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});

productSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

productSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = update.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

productSchema.pre('save',async function (next) {
    if (this.isModified('category') || this.isModified('subcategory')) {
        const Subcategory = mongoose.model('Subcategory');
        const subcategory = await Subcategory.findById(this.subcategory);
        if(!subcategory ) {
            return next(new Error('La subcategoría debe existir y estar activa'));
        }
        if(subcategory.category.toString() !== this.category.toString()) {
            return next(new Error('La subcategoría debe pertenecer a la categoría especificada'));
        }
    }
    next();
});

productSchema.virtual('profitMargin').get(function(){
    if (this.price && this.cost){
        return ((this.price - this.cost) / this.price) * 100;
    }
    return 0;
});

productSchema.virtual('isOutOfStock').get(function(){
    if(!this.stock.trackStock) return false; 
    return this.stock.quantity <= 0;
});

productSchema.virtual('primaryImage').get(function(){
    return this.images.find(img => img.isPrimary) || this.images[0];
});

productSchema.static.findActive=function(){
    return this.find({isActive:true})
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort({sortOrder: 1, name: -1});
};
productSchema.statics.findByCategory = function(categoryId){
    return this.find({category:categoryId,
        isActive:true
    })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort({sortOrder: 1, name: -1});
};
productSchema.statics.findBySubcategory = function(subcategoryId){
    return this.find({subcategory:subcategoryId,
        isActive:true
    })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort({sortOrder: 1, name: -1});
};
productSchema.statics.findFeatured = function(){
    return this.find({isFeatured:true,
        isActive:true
    })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort({sortOrder: 1, name: -1});
};

productSchema.methods.getFullPath =  async function(){
   await this.populate([{
       path: 'category',
       select: 'name '
   },{
       path: 'subcategory',
       select: 'name '
   }]);
   return `${this.category.name}>${this.subcategory.name}>${this.name}`;
};

productSchema.methods.updateStock =  function(quantity) {
  if(this.stock.trackStock) {
      this.stock.quantity += quantity;
      if(this.stock.quantity < 0) {
          this.stock.quantity = 0;
      }
  }
  return this.save();
};


productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'stock.quantity': 1 });
productSchema.index({ sortOrder: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ tags: 1 });


productSchema.index({
    name: 'text',
    description: 'text',
    shortDescription: 'text',
    tags: 'text',
})
module.exports = mongoose.model('Product', productSchema);
