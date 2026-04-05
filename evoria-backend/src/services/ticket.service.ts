import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { TicketType } from '@prisma/client';

export async function createTicket(
  organizerId: string,
  data: { type: TicketType; price: number; quantity: number; eventId: string }
) {
  const event = await prisma.event.findUnique({ where: { id: data.eventId } });
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizerId !== organizerId) throw new AppError('Forbidden', 403);

  return prisma.ticket.create({
    data: {
      type: data.type,
      price: data.price,
      quantity: data.quantity,
      eventId: data.eventId,
    },
    include: {
      event: { select: { id: true, title: true } },
    },
  });
}

export async function getTicketsByEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);

  return prisma.ticket.findMany({
    where: { eventId },
    include: { _count: { select: { bookings: true } } },
  });
}

export async function updateTicket(
  organizerId: string,
  ticketId: string,
  data: Partial<{ type: TicketType; price: number; quantity: number }>
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { event: true },
  });
  if (!ticket) throw new AppError('Ticket not found', 404);
  if (ticket.event.organizerId !== organizerId) throw new AppError('Forbidden', 403);

  if (data.quantity !== undefined) {
    const bookedCount = await prisma.booking.count({ where: { ticketId } });
    if (data.quantity < bookedCount) {
      throw new AppError(
        `Cannot reduce quantity below current bookings (${bookedCount})`,
        422
      );
    }
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data,
  });
}

export async function deleteTicket(organizerId: string, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { event: true },
  });
  if (!ticket) throw new AppError('Ticket not found', 404);
  if (ticket.event.organizerId !== organizerId) throw new AppError('Forbidden', 403);

  await prisma.ticket.delete({ where: { id: ticketId } });
}
