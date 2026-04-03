import { PrismaClient, Role, TicketType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Wipe in FK-safe order
  await prisma.booking.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@evoria.com',
      password: await hash('Admin1234!'),
      role: Role.ADMIN,
    },
  });

  // 2 Organizers
  const org1 = await prisma.user.create({
    data: {
      name: 'Alice Organizer',
      email: 'alice@evoria.com',
      password: await hash('Alice1234!'),
      role: Role.ORGANIZER,
    },
  });

  const org2 = await prisma.user.create({
    data: {
      name: 'Bob Organizer',
      email: 'bob@evoria.com',
      password: await hash('Bob1234!'),
      role: Role.ORGANIZER,
    },
  });

  // 5 Attendees
  const attendees = await Promise.all(
    ['carol', 'dave', 'eve', 'frank', 'grace'].map((n) =>
      prisma.user.create({
        data: {
          name: `${n.charAt(0).toUpperCase() + n.slice(1)} Attendee`,
          email: `${n}@evoria.com`,
          password: bcrypt.hashSync(
            `${n.charAt(0).toUpperCase() + n.slice(1)}1234!`,
            10
          ),
          role: Role.ATTENDEE,
        },
      })
    )
  );

  // Categories
  const [catTech, catMusic, catArt, catSports, catFood] = await Promise.all([
    prisma.category.create({ data: { name: 'Technology', description: 'Tech events and conferences' } }),
    prisma.category.create({ data: { name: 'Music', description: 'Music events and concerts' } }),
    prisma.category.create({ data: { name: 'Art', description: 'Art exhibitions and workshops' } }),
    prisma.category.create({ data: { name: 'Sports', description: 'Sports events and competitions' } }),
    prisma.category.create({ data: { name: 'Food & Drink', description: 'Food festivals and tastings' } }),
  ]);

  // Venues
  const [venueHall, venueHub, venuePark] = await Promise.all([
    prisma.venue.create({ data: { name: 'Grand Hall', address: '123 Main St', city: 'Istanbul', capacity: 500 } }),
    prisma.venue.create({ data: { name: 'Tech Hub', address: '456 Innovation Blvd', city: 'Ankara', capacity: 200 } }),
    prisma.venue.create({ data: { name: 'City Park', address: '789 Park Ave', city: 'Istanbul', capacity: 1000 } }),
  ]);

  const now = new Date();
  const future = (days: number) => new Date(now.getTime() + days * 86400000);

  // Create events with categories and venues
  const eventList = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Tech Conference 2025',
        description: 'Annual tech summit',
        dateTime: future(30),
        capacity: 3,
        organizerId: org1.id,
        categoryId: catTech.id,
        venueId: venueHub.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Jazz Night',
        description: 'Live jazz evening',
        dateTime: future(7),
        capacity: 50,
        organizerId: org1.id,
        categoryId: catMusic.id,
        venueId: venueHall.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'React Workshop',
        description: 'Hands-on React',
        dateTime: future(14),
        capacity: 2,
        organizerId: org1.id,
        categoryId: catTech.id,
        venueId: venueHub.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Art Exhibition',
        description: 'Modern art show',
        dateTime: future(21),
        capacity: 100,
        organizerId: org1.id,
        categoryId: catArt.id,
        venueId: venueHall.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Marathon 2025',
        description: 'City marathon',
        dateTime: future(60),
        capacity: 5,
        organizerId: org1.id,
        categoryId: catSports.id,
        venueId: venuePark.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Startup Pitch Night',
        description: 'Pitch your idea',
        dateTime: future(10),
        capacity: 20,
        organizerId: org2.id,
        categoryId: catTech.id,
        venueId: venueHub.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Food Festival',
        description: 'International food',
        dateTime: future(45),
        capacity: 200,
        organizerId: org2.id,
        categoryId: catFood.id,
        venueId: venuePark.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Photography Walk',
        description: 'Urban photo tour',
        dateTime: future(5),
        capacity: 3,
        organizerId: org2.id,
        categoryId: catArt.id,
        venueId: venuePark.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Book Club Meetup',
        description: 'Monthly book club',
        dateTime: future(3),
        capacity: 10,
        organizerId: org2.id,
        categoryId: catArt.id,
        venueId: venueHall.id,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Yoga Retreat',
        description: 'Weekend retreat',
        dateTime: future(90),
        capacity: 4,
        organizerId: org2.id,
        categoryId: catSports.id,
        venueId: venuePark.id,
      },
    }),
  ]);

  // Tickets for events
  await Promise.all([
    // Tech Conference
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 50, quantity: 2, eventId: eventList[0].id } }),
    prisma.ticket.create({ data: { type: TicketType.VIP, price: 150, quantity: 1, eventId: eventList[0].id } }),
    // Jazz Night
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 30, quantity: 40, eventId: eventList[1].id } }),
    prisma.ticket.create({ data: { type: TicketType.VIP, price: 80, quantity: 10, eventId: eventList[1].id } }),
    // React Workshop
    prisma.ticket.create({ data: { type: TicketType.EARLY_BIRD, price: 20, quantity: 2, eventId: eventList[2].id } }),
    // Art Exhibition
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 15, quantity: 80, eventId: eventList[3].id } }),
    prisma.ticket.create({ data: { type: TicketType.VIP, price: 40, quantity: 20, eventId: eventList[3].id } }),
    // Marathon
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 25, quantity: 5, eventId: eventList[4].id } }),
    // Startup Pitch Night
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 10, quantity: 15, eventId: eventList[5].id } }),
    prisma.ticket.create({ data: { type: TicketType.VIP, price: 35, quantity: 5, eventId: eventList[5].id } }),
    // Food Festival
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 20, quantity: 150, eventId: eventList[6].id } }),
    prisma.ticket.create({ data: { type: TicketType.VIP, price: 60, quantity: 50, eventId: eventList[6].id } }),
    // Photography Walk
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 10, quantity: 3, eventId: eventList[7].id } }),
    // Book Club
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 0, quantity: 10, eventId: eventList[8].id } }),
    // Yoga Retreat
    prisma.ticket.create({ data: { type: TicketType.GENERAL, price: 100, quantity: 3, eventId: eventList[9].id } }),
    prisma.ticket.create({ data: { type: TicketType.EARLY_BIRD, price: 75, quantity: 1, eventId: eventList[9].id } }),
  ]);

  // [eventIndex, attendeeIndex]
  const bookingPairs: Array<[number, number]> = [
    [0, 0],
    [0, 1],
    [0, 2], // Tech Conference full: 3/3

    [1, 0],
    [1, 1], // Jazz Night: 2/50

    [2, 0],
    [2, 1], // React Workshop full: 2/2

    [3, 0],
    [3, 1],
    [3, 2], // Art Exhibition: 3/100

    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3],
    [4, 4], // Marathon full: 5/5

    [5, 0],
    [5, 1], // Startup Pitch: 2/20

    [7, 0],
    [7, 1],
    [7, 2], // Photography Walk full: 3/3
  ];

  for (const [eventIndex, attendeeIndex] of bookingPairs) {
    await prisma.booking.create({
      data: {
        userId: attendees[attendeeIndex].id,
        eventId: eventList[eventIndex].id,
      },
    });
  }

  console.log('Seed complete. Credentials:');
  console.log('  admin@evoria.com  / Admin1234!');
  console.log('  alice@evoria.com  / Alice1234!  (organizer)');
  console.log('  bob@evoria.com    / Bob1234!    (organizer)');
  console.log('  carol@evoria.com  / Carol1234!  (attendee)');
  console.log('  dave@evoria.com   / Dave1234!   (attendee)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
