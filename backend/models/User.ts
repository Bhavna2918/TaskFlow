import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'employee';
  team: string;
  avatar?: string;
  productivity: number;
  completionRate: number;
  performanceScore: number;
  employeeId?: string;
  twoFactorEnabled?: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
  getResetPasswordToken: () => string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'employee'],
      default: 'employee'
    },
    team: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: '' // Optional, empty when not uploaded
    },
    productivity: {
      type: Number,
      default: 80
    },
    completionRate: {
      type: Number,
      default: 0
    },
    performanceScore: {
      type: Number,
      default: 7.0
    },
    employeeId: {
      type: String,
      unique: true
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Auto-generate sequential Employee ID
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeId) {
    try {
      const User = mongoose.model('User');
      const count = await User.countDocuments();
      this.employeeId = `EMP-${1000 + count + 1}`;
      next();
    } catch (error: any) {
      next(error);
    }
  } else {
    next();
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password || '');
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (10 mins)
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Transform output JSON representation
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    const anyRet = ret as any;
    anyRet.id = anyRet._id.toString();
    delete anyRet._id;
    delete anyRet.password;
    return anyRet;
  }
});

export default mongoose.model<IUser>('User', userSchema);
