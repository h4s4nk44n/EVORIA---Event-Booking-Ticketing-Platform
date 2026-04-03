import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export async function createBooking(userId: string, eventId: string, ticketId?: string) {
  return await prisma.$transaction(async (tx) => {
    // Lock the event row (SELECT ... FOR UPDATE) to serialise concurrent bookings
    const rows = await tx.$queryRaw<
      { id: string; capacity: number; dateTime: Date }[]
    >`SELECT id, capacity, "dateTime" FROM events WHERE id = ${eventId} FOR UPDATE`;

    const event = rows[0];
    if (!event) throw new AppError('Event not found', 404);

    if (new Date(event.dateTime) <= new Date()) {
      throw new AppError('Cannot book a past event', 422);
    }

    const existingBooking = await tx.booking.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existingBooking)
      throw new AppError('You already have a booking for this event', 409);

    const bookedCount = await tx.booking.count({ where: { eventId } });

    if (bookedCount >= event.capacity) {
      throw new AppError('This event is fully booked', 422);
    }

    // If a ticket type is specified, verify availability
    if (ticketId) {
      const ticketRows = await tx.$queryRaw<
        { id: string; quantity: number; eventId: string }[]
      >`SELECT id, quantity, "eventId" FROM tickets WHERE id = ${ticketId} FOR UPDATE`;

      const ticket = ticketRows[0];
      if (!ticket || ticket.eventId !== eventId) {
        throw new AppError('Ticket type not found for this event', 404);
      }

      const ticketBookedCount = await tx.booking.count({ where: { ticketId } });
      if (ticketBookedCount >= ticket.quantity) {
        throw new AppError('This ticket type is sold out', 422);
      }
    }

    return tx.booking.create({
      data: { userId, eventId, ticketId },
      include: {
        event:  { select: { id: true, title: true, dateTime: true } },
        user:   { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, type: true, price: true } },
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

export async function getMyBookings(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            dateTime: true,
            capacity: true,
            organizer: { select: { name: true } },
            _count: { select: { bookings: true } },
          },
        },
      },
    }),
    prisma.booking.count({ where: { userId } }),
  ]);

  return { data: bookings, total, page, limit };
}
