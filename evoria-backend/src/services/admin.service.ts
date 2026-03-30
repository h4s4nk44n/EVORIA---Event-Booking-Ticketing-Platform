import { prisma } from '../config/prisma';

export async function getAllUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// placeholders so imports compile
export async function getAllEvents() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      organizer: {
        select: { id: true, name: true, email: true, role: true },
      },
      _count: {
        select: { bookings: true },
      },
    },
  });

  return { data: events };
}

export async function deleteUserById(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

export async function deleteEventById(id: string) {
  return prisma.event.delete({
    where: { id },
  });
}