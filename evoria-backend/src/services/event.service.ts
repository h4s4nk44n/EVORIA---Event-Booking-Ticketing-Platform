import xss from 'xss';
import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

export async function createEvent(
  organizerId: string,
  data: {
    title:       string;
    description: string;
    dateTime:    string;
    capacity:    number;
    categoryId?: string;
    venueId?:    string;
  }
) {
  return prisma.event.create({
    data: {
      title:       xss(data.title),
      description: xss(data.description),
      dateTime:    new Date(data.dateTime),
      capacity:    data.capacity,
      organizerId,
      categoryId:  data.categoryId,
      venueId:     data.venueId,
    },
    include: {
      organizer: { select: { id: true, name: true } },
      category:  true,
      venue:     true,
    },
  });
}

export async function listEvents(query: {
  search?:     string;
  from?:       string;
  to?:         string;
  categoryId?: string;
  venueId?:    string;
  page?:       number;
  limit?:      number;
}) {
  const page  = Math.max(1, query.page  || 1);
  const limit = Math.min(50, query.limit || 10);
  const skip  = (page - 1) * limit;

  const where: Prisma.EventWhereInput = {};

  if (query.search) {
    where.title = { contains: query.search, mode: 'insensitive' };
  }

  if (query.from || query.to) {
    where.dateTime = {};
    if (query.from) where.dateTime.gte = new Date(query.from);
    if (query.to)   where.dateTime.lte = new Date(query.to);
  }

  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.venueId)    where.venueId = query.venueId;

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateTime: 'asc' },
      include: {
        organizer: { select: { id: true, name: true } },
        category:  true,
        venue:     true,
        _count:    { select: { bookings: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  const data = events.map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    dateTime: e.dateTime,
    capacity: e.capacity,
    organizer: e.organizer,
    category: e.category,
    venue: e.venue,
    bookedCount: e._count.bookings,
    availableSpots: e.capacity - e._count.bookings,
  }));

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      category:  true,
      venue:     true,
      tickets:   { include: { _count: { select: { bookings: true } } } },
      _count:    { select: { bookings: true } },
    },
  });

  if (!event) throw new AppError('Event not found', 404);

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    dateTime: event.dateTime,
    capacity: event.capacity,
    organizer: event.organizer,
    category: event.category,
    venue: event.venue,
    tickets: event.tickets,
    bookedCount: event._count.bookings,
    availableSpots: event.capacity - event._count.bookings,
  };
}

export async function updateEvent(
  organizerId: string,
  eventId: string,
  data: Partial<{
    title:       string;
    description: string;
    dateTime:    string;
    capacity:    number;
  }>
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizerId !== organizerId) throw new AppError('Forbidden', 403);
 
  // Kapasite düşürülüyorsa mevcut booking sayısının altına inemez
  if (data.capacity !== undefined) {
    const bookedCount = await prisma.booking.count({ where: { eventId } });
    if (data.capacity < bookedCount) {
      throw new AppError(
        `Cannot reduce capacity below current bookings (${bookedCount})`,
        422
      );
    }
  }
 
  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      ...(data.title       && { title:       xss(data.title) }),
      ...(data.description && { description: xss(data.description) }),
      ...(data.dateTime    && { dateTime:     new Date(data.dateTime) }),
    },
  });
}

export async function deleteEvent(organizerId: string, eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizerId !== organizerId) throw new AppError('Forbidden', 403);
  
  await prisma.event.delete({ where: { id: eventId } });
  
  // Not: Bookings cascade-delete özelliği Prisma şemasında (schema.prisma) 
  // 'onDelete: Cascade' ile ayarlandığı için burada manuel booking silmeye gerek yok.
}

export async function getEventStats(organizerId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { bookings: true } } }
  });

  if (!event) throw new AppError('Event not found', 404);
  if (event.organizerId !== organizerId) throw new AppError('Forbidden', 403);

  return {
    eventId: event.id,
    title: event.title,
    capacity: event.capacity,
    ticketsSold: event._count.bookings,
    ticketsRemaining: event.capacity - event._count.bookings,
  };
}

export async function getEventAttendees(
  organizerId: string,
  eventId: string,
  page: number,
  limit: number
) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError('Event not found', 404);
  if (event.organizerId !== organizerId) throw new AppError('Forbidden', 403);
 
  const skip = (page - 1) * limit;
 
  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where:   { eventId },
      skip,
      take:    limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.booking.count({ where: { eventId } }),
  ]);
 
  return {
    data: bookings.map(b => ({
      bookingId: b.id,
      bookedAt:  b.createdAt,
      user:      b.user,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}