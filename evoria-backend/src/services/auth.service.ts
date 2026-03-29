import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

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