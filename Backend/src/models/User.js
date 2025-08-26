const mongose = require('mongoose');
const bcriypt = require('bcryptjs');
const { default: mongoose } = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: [true, 'el nombre del usuarios es requerido'],
        unique: true,
        trim:true,
        minlength: [3, 'el nombre de usuario debe tener al menos 3 caracteres'],
        maxlength: [50, 'el nombre de usuario no puede tener mas de 20 caracteres']

    },
    email:{
        type: String,
        required: [true, 'el email es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'el email no es valido']
    },
    password:{
        type: String,
        required: [true, 'la contraseña es requerida'],
        minlength: [6, 'la contraseña debe tener al menos 6 caracteres'],
       
    },
    firstName: {
        type: String,
        required: [false, 'el nombre es requerido'],
        trim: true,
        maxlength: [50, 'el nombre no puede tener mas de 50 caracteres']
    },
    lastName: {
        type: String,
        required: [true, 'el apellido es requerido'],
        trim: true,
        maxlength: [50, 'el apellido no puede tener mas de 50 caracteres']
    },
    role:{
        type: String,
        enum:{
            values: ['admin', 'coordinador'],
            message: 'el rol debe ser admin o coordinador',
        },
        required: [true, 'el rol es requerido'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    phone:{
        type: String,
        trim: true,
        match: [/^\d{10}$/, 'el telefono debe tener 10 digitos']
    },
    lastlogin:{
        type: Date,
    },

     createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',

    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
},
{
    timestamps: true
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    try{
    const salt = await bcriypt.genSalt(12);
    this.password = await bcriypt.hash(this.password, salt);
    next();
    } catch (error) {
        next(error);
    }
 
});

userSchema.pre('findOneAndUpdate', async function(next){
    const update =this.getUpdate();
    if(update.password){
        try{
            const salt = await bcriypt.genSalt(12);
            update.password = await bcriypt.hash(update.password, salt);
        } catch (error) {
            return next(error);
        }
    }

    next();

});

 //metodo para compara contraseñas
 userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        return await bcriypt.compare(candidatePassword, this.password);

    }catch (error){
        throw error;
    }
 };

//sobre escriben el metodo toJSON para que nunca envie la constraseña ´por frontend
userSchema.methods.toJson = function(){
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

userSchema.virtual('fullName').get(function(){
    return `${this.firstName} ${this.lastName}`;
})
// Campo virtual para nombre no se guardan en la base de datos
userSchema.index({role: 1});
userSchema.index({isActive: 1});

module.exports = mongoose.model('User', userSchema);

