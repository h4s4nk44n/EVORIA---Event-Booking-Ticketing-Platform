import xss from 'xss';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export async function createVenue(data: {
  name: string;
  address: string;
  city: string;
  capacity: number;
}) {
  return prisma.venue.create({
    data: {
      name: xss(data.name),
      address: xss(data.address),
      city: xss(data.city),
      capacity: data.capacity,
    },
  });
}

export async function listVenues(query?: { city?: string }) {
  const where = query?.city ? { city: { contains: query.city, mode: 'insensitive' as const } } : {};

  return prisma.venue.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { events: true } } },
  });
}

export async function getVenueById(id: string) {
  const venue = await prisma.venue.findUnique({
    where: { id },
    include: { _count: { select: { events: true } } },
  });
  if (!venue) throw new AppError('Venue not found', 404);
  return venue;
}

export async function updateVenue(
  id: string,
  data: Partial<{ name: string; address: string; city: string; capacity: number }>
) {
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) throw new AppError('Venue not found', 404);

  return prisma.venue.update({
    where: { id },
    data: {
      ...(data.name && { name: xss(data.name) }),
      ...(data.address && { address: xss(data.address) }),
      ...(data.city && { city: xss(data.city) }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
    },
  });
}

export async function deleteVenue(id: string) {
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) throw new AppError('Venue not found', 404);
  await prisma.venue.delete({ where: { id } });
}
