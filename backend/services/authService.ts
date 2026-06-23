import User, { IUser } from '../models/User';
import crypto from 'crypto';

export class AuthService {
  static async register(userData: Partial<IUser>): Promise<IUser> {
    const { name, email, password, role, team, avatar } = userData;

    // Double check email existence
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error('User already exists with this email');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      team: team || '',
      avatar: avatar || '',
      productivity: 80,
      completionRate: 0,
      performanceScore: 7.0
    });

    return user;
  }

  static async login(email: string, password: string): Promise<IUser> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  static async forgotPassword(email: string): Promise<{ resetToken: string; user: IUser }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('There is no user with that email');
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    return { resetToken, user };
  }

  static async resetPassword(token: string, password: string): Promise<IUser> {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired password reset token');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    return user;
  }
}
