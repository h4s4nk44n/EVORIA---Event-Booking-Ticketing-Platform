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
  }
) {
  return prisma.event.create({
    data: {
      title:       xss(data.title),
      description: xss(data.description),
      dateTime:    new Date(data.dateTime),
      capacity:    data.capacity,
      organizerId,
    },
    include: {
      organizer: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function listEvents(query: {
  search?: string;
  from?:   string;
  to?:     string;
  page?:   number;
  limit?:  number;
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
 
  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateTime: 'asc' },
      include: {
        organizer: { select: { id: true, name: true } },
        _count:    { select: { bookings: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);
 
  const data = events.map(e => ({
    id:             e.id,
    title:          e.title,
    description:    e.description,
    dateTime:       e.dateTime,
    capacity:       e.capacity,
    organizer:      e.organizer,
    bookedCount:    e._count.bookings,
    availableSpots: e.capacity - e._count.bookings,
  }));
 
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      _count: { select: { bookings: true } },
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
    bookedCount: event._count.bookings,
    availableSpots: event.capacity - event._count.bookings,
  };
}