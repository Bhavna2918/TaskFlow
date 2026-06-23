import jwt from 'jsonwebtoken';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mysecretkey', {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  });
};

export default generateToken;
