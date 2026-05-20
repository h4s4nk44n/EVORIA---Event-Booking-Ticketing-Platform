import xss from 'xss';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export async function createSection(
  venueId: string,
  data: { name: string; tier: string; price: number; capacity: number; sortOrder?: number }
) {
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) throw new AppError('Venue not found', 404);

  return prisma.section.create({
    data: {
      name: xss(data.name),
      tier: data.tier,
      price: data.price,
      capacity: data.capacity,
      sortOrder: data.sortOrder ?? 0,
      venueId,
    },
  });
}

export async function listSections(venueId: string) {
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) throw new AppError('Venue not found', 404);

  return prisma.section.findMany({
    where: { venueId },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getSection(id: string) {
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) throw new AppError('Section not found', 404);
  return section;
}

export async function updateSection(
  id: string,
  data: Partial<{ name: string; tier: string; price: number; capacity: number; sortOrder: number }>
) {
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) throw new AppError('Section not found', 404);

  if (data.capacity !== undefined) {
    const booked = await prisma.booking.aggregate({
      where: { sectionId: id },
      _sum: { quantity: true },
    });
    const totalBooked = booked._sum.quantity ?? 0;
    if (data.capacity < totalBooked) {
      throw new AppError(`Cannot reduce capacity below current bookings (${totalBooked})`, 422);
    }
  }

  return prisma.section.update({
    where: { id },
    data: {
      ...(data.name && { name: xss(data.name) }),
      ...(data.tier && { tier: data.tier }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
}

export async function deleteSection(id: string) {
  const section = await prisma.section.findUnique({ where: { id } });
  if (!section) throw new AppError('Section not found', 404);
  await prisma.section.delete({ where: { id } });
}

/**
 * Seatmap availability for a specific event.
 * Returns each section of the event's venue with live booking counts.
 */
export async function getSeatmapAvailability(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { venue: true },
  });
  if (!event) throw new AppError('Event not found', 404);
  if (!event.venue) throw new AppError('Event has no venue assigned', 422);

  const sections = await prisma.section.findMany({
    where: { venueId: event.venue.id },
    orderBy: { sortOrder: 'asc' },
  });

  // Aggregate booked quantity per section for this event
  const bookingAgg = await prisma.booking.groupBy({
    by: ['sectionId'],
    where: { eventId },
    _sum: { quantity: true },
  });

  const bookedMap = new Map(
    bookingAgg.map((b) => [b.sectionId, b._sum.quantity ?? 0])
  );

  return {
    eventId: event.id,
    venueId: event.venue.id,
    layout: event.venue.layout,
    sections: sections.map((s) => {
      const booked = bookedMap.get(s.id) ?? 0;
      return {
        id: s.id,
        name: s.name,
        tier: s.tier,
        price: s.price,
        capacity: s.capacity,
        booked,
        available: s.capacity - booked,
        soldOut: booked >= s.capacity,
      };
    }),
  };
}
