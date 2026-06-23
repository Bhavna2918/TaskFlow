import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import generateToken from '../utils/generateToken';

const setTokenCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Use 'lax' for easy cross-origin development or build testing
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.register(req.body);
    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      avatar: user.avatar,
      productivity: user.productivity,
      completionRate: user.completionRate,
      performanceScore: user.performanceScore,
      employeeId: user.employeeId,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await AuthService.login(email, password);
    const token = generateToken(user.id);
    setTokenCookie(res, token);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team,
      avatar: user.avatar,
      productivity: user.productivity,
      completionRate: user.completionRate,
      performanceScore: user.performanceScore,
      employeeId: user.employeeId,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      sameSite: 'lax'
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.user is loaded in protect middleware
    res.json((req as any).user);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const { resetToken, user } = await AuthService.forgotPassword(email);

    // Create reset URL
    const clientPort = process.env.CLIENT_PORT || '5173';
    const resetUrl = `${req.protocol}://${req.hostname}:${clientPort}/reset-password/${resetToken}`;

    console.log(`\n=== PASSWORD RESET REQUEST ===`);
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`==============================\n`);

    res.status(200).json({
      success: true,
      message: 'Token generated successfully. Check backend console logs for the reset link.',
      resetUrl,
      token: resetToken
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await AuthService.resetPassword(token as string, password);
    const jwtToken = generateToken(user.id);
    setTokenCookie(res, jwtToken);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        avatar: user.avatar,
        productivity: user.productivity,
        completionRate: user.completionRate,
        performanceScore: user.performanceScore,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    next(error);
  }
};
