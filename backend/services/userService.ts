import User, { IUser } from '../models/User';

export class UserService {
  static async getAllUsers(query: any = {}): Promise<IUser[]> {
    return await User.find(query);
  }

  static async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  static async updateUser(id: string, updateData: Partial<IUser>, updaterRole: string): Promise<IUser | null> {
    const user = await User.findById(id);
    if (!user) {
      return null;
    }

    const fieldsToUpdate: (keyof IUser)[] = [
      'name',
      'email',
      'avatar',
      'productivity',
      'completionRate',
      'performanceScore',
      'twoFactorEnabled'
    ];

    if (updaterRole === 'admin') {
      fieldsToUpdate.push('role', 'team');
    }

    fieldsToUpdate.forEach(field => {
      if (updateData[field] !== undefined) {
        (user as any)[field] = updateData[field];
      }
    });

    if (updateData.password) {
      user.password = updateData.password;
    }

    return await user.save();
  }

  static async deleteUser(id: string): Promise<boolean> {
    const user = await User.findById(id);
    if (!user) {
      return false;
    }
    await user.deleteOne();
    return true;
  }
}
