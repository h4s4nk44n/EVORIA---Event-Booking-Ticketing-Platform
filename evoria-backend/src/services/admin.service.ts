import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

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

export async function getAllEvents(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [events, total] = await prisma.$transaction([
        prisma.event.findMany({
            skip,
            take: limit,
            orderBy: { dateTime: 'asc' },
            include: {
                organizer: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { bookings: true },
                },
            },
        }),
        prisma.event.count(),
    ]);

    const data = events.map(({ _count, ...e }) => ({
        ...e,
        bookedCount: _count.bookings,
        availableSpots: e.capacity - _count.bookings,
    }));

    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
export async function deleteUser(adminId: string, targetId: string) {
    if (adminId === targetId) {
        throw new AppError('Cannot delete your own admin account', 403);
    }

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
        throw new AppError('User not found', 404);
    }

    await prisma.$transaction([
        prisma.event.deleteMany({ where: { organizerId: targetId } }),
        prisma.user.delete({ where: { id: targetId } }),
    ]);
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