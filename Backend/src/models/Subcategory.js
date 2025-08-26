const mongoose =require('mongoose');

const subcategoryShema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'El nombre de la subcategoria es requeridio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede ezxceder 100 caracateres ']
    },
    description:{
        type: String,
        required: [true, 'La descripcion de la subcategoria es requerida'],
        trim: true,
        maxlength: [500, 'La descripcion no puede exceder 500 caracteres']
    },
    slug:{
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'La categoria es requerida'],
        validate: {
            validator: async function(CategoryId) {
                const Category=mongoose.model('Category');
                const category = await Category.findById(CategoryId);
                return category && category.isActive;
            },
            message: 'La categoria debe exisitir y estar activa'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    icon:{
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
        default: 0
    },
    createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
            
    },
    updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
           
    }
},{
    timestamps: true
});

subcategoryShema.pre('save', function(next){
    if(this.isModified('name')){
        this.slug = this.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

subcategoryShema.pre('findOneAndUpdate', function(next){
    const update = this.getUpdate();
    if(update.name){
        update.slug = update.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

subcategoryShema.pre('save', async function(next){
    if(this.isModified('category')){
        const Category = mongoose.model('Category');
        const category = await Category.findById(this.category);
        if(!category){
            return next(new Error('La categoria especificada no existe o no esta activa'));
        }
        if(!category.isActive){
            return next(new Error('La categoria especificada no esta activa'));
        }
    }
    next();
});

subcategoryShema.virtual('productCount',{
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true 
});

subcategoryShema.static.findByCategory = function(categoryId) {
    return this.find({
        category: categoryId,
        isActive: true,
    })
    .populate('category', 'name slug')
    .sort({ sortOrder: 1, name: 1 });
}


subcategoryShema.statics.findActive = function(){
    return this.find({ isActive: true })
    .populate('category', 'name slug')
    .sort({sortOrder: 1, name: 1});
};

subcategoryShema.methods.canBeDeleted = async function () {
    const Product = mongoose.model('Product');
    const productsCount = await Product.countDocuments({ subcategory: this._id });
    return productsCount === 0;
};

subcategoryShema.methods.getFullPath = async function () {
    await this.populate('category', 'name');
    return `${this.category.name} > ${this.name}`;
};

subcategoryShema.index({ category: 1 });
subcategoryShema.index({ isActive: 1 });
subcategoryShema.index({ sortOrder: 1 });
subcategoryShema.index({ slug: 1 });
subcategoryShema.index({ createdBy: 1 });

module.exports = mongoose.model('Subcategory', subcategoryShema);
