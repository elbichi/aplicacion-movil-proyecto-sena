const mongoose = require('mongoose');

const categoryShema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'el nombre de la categoria es requerido'],
        trim: true,
        unique: true,
        minlength: [2, 'el nombre de la categoria debe tener al menos 2 caracteres'],
        maxlength: [100, 'el nombre de la categoria no puede tener mas de 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'la descripcion no puede tener mas de 500 caracteres']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true

    },
    isActive: {
        type: Boolean,
        default: true,
    },
    icon: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true,
        match: [/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'el color debe ser un codigo hexadecimal valido']
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

categoryShema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

categoryShema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.name) {
        update.slug = update.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

categoryShema.virtual('productCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

categoryShema.static.foreignField = function () {
    return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

categoryShema.static.findActive = function () {
      return this.find({ isActive: true })
    .populate('category', 'name slug')
    .sort({sortOrder: 1, name: 1});

}


categoryShema.methods.canBeDeleted = async function () {
    const Subcategory = mongoose.model('Subcategory');
    const Product = mongoose.model('Product');;

    const SubcaregoriesCount = await Subcategory.countDocuments({ category: this._id });
    const productsCount = await Product.countDocuments({ category: this._id });

    return SubcaregoriesCount === 0 && productsCount === 0;
};

categoryShema.index({ isActive: 1 });
categoryShema.index({ sortOrder: 1 });
categoryShema.index({ createdBy: 1 });


module.exports = mongoose.model('Category', categoryShema);
