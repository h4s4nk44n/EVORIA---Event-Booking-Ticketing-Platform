import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export async function createBooking(userId: string, eventId: string) {
  return await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError('Event not found', 404);

    const existingBooking = await tx.booking.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existingBooking)
      throw new AppError('You already have a booking for this event', 409);

    const bookedCount = await tx.booking.count({ where: { eventId } });

    if (bookedCount >= event.capacity) {
      throw new AppError('This event is fully booked', 422);
    }

    return tx.booking.create({
      data: { userId, eventId },
      include: {
        event: { select: { id: true, title: true, dateTime: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  });
}

export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.userId !== userId)
    throw new AppError('You can only cancel your own bookings', 403);

  await prisma.booking.delete({ where: { id: bookingId } });
  return { message: 'Booking cancelled successfully' };
}

export async function getMyBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          dateTime: true,
          capacity: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
