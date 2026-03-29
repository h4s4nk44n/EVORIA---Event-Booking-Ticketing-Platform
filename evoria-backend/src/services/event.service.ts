import { prisma } from '../config/prisma';

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
      ...data,
      dateTime: new Date(data.dateTime),
      organizerId,
    },
    include: {
      organizer: {
        select: { id: true, name: true },
      },
    },
  });
}