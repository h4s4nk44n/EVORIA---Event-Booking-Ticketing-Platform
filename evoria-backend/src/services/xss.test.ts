import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

function makeToken(role: 'ATTENDEE' | 'ORGANIZER' | 'ADMIN', userId: string) {
  return jwt.sign(
    { userId, email: `${role.toLowerCase()}@test-xss.com`, role },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

let organizerId: string;
let organizerToken: string;

beforeAll(async () => {
  const orgRes = await request(app).post('/auth/register').send({
    name: 'XSS Test Organizer',
    email: 'organizer@test-xss.com',
    password: '12345678',
    role: 'ORGANIZER',
  });
  organizerId = orgRes.body.user.id;
  organizerToken = makeToken('ORGANIZER', organizerId);
});

afterAll(async () => {
  await prisma.booking.deleteMany({
    where: { event: { organizerId } },
  });
  await prisma.event.deleteMany({
    where: { organizerId },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: '@test-xss.com' } },
  });
  await prisma.$disconnect();
});

describe('XSS sanitization — event creation', () => {
  it('should strip <script> tags from event title', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: '<script>alert("xss")</script>My Event',
        description: 'A normal description here',
        dateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.event.title).not.toContain('<script>');
    expect(res.body.event.title).toContain('My Event');
  });

  it('should strip <script> tags from event description', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Safe Title',
        description: 'Hello <script>document.cookie</script>World',
        dateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.event.description).not.toContain('<script>');
    expect(res.body.event.description).toContain('Hello');
    expect(res.body.event.description).toContain('World');
  });

  it('should strip onerror attributes from img tags', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Event with img XSS',
        description: '<img src=x onerror=alert(1)>Description',
        dateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.event.description).not.toContain('onerror');
  });

  it('should pass through normal text unchanged', async () => {
    const title = 'Tech Conference 2026';
    const description = 'A great event about technology & innovation.';

    const res = await request(app)
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title,
        description,
        dateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        capacity: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.event.title).toBe(title);
    expect(res.body.event.description).toBe(description);
  });
});

describe('XSS sanitization — user registration', () => {
  it('should strip <script> tags from user name', async () => {
    const res = await request(app).post('/auth/register').send({
      name: '<script>alert("xss")</script>John',
      email: 'xss-name@test-xss.com',
      password: '12345678',
      role: 'ATTENDEE',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.name).not.toContain('<script>');
    expect(res.body.user.name).toContain('John');
  });

  it('should pass through normal name unchanged', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Jane Doe',
      email: 'normal-name@test-xss.com',
      password: '12345678',
      role: 'ATTENDEE',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.name).toBe('Jane Doe');
  });
});
