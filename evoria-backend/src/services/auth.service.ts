import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { config } from '../config/env';

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'ATTENDEE' | 'ORGANIZER';
}) {
  const hashed = await bcrypt.hash(data.password, 10);

  // Prisma throws P2002 on duplicate email → errorHandler returns 409 automatically
  const user = await prisma.user.create({
    data: { ...data, password: hashed },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      createdAt: true,
      // password intentionally excluded
    },
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Same error message for 'not found' and 'wrong password' — prevents user enumeration
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid credentials', 401);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  };
}