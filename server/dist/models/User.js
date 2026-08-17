import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        minlength: 6,
        select: false,
    },
    avatar: {
        type: String,
        default: '',
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    refreshToken: {
        type: String,
        select: false,
    },
}, {
    timestamps: true,
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password)
        return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.refreshToken;
    delete obj.__v;
    return obj;
};
export const User = mongoose.model('User', userSchema);
//# sourceMappingURL=User.js.map