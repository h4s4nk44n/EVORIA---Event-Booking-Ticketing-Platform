import { z } from 'zod';

// Şemayı "body" objesi içine alıyoruz
export const createEventSchema = z.object({
  body: z.object({
    title:       z.string().min(3).max(120),
    description: z.string().min(10).max(2000),
    dateTime:    z.string().datetime({ message: 'Must be ISO 8601 format' })
                  .refine(d => new Date(d) > new Date(), { message: 'Must be a future date' }),
    capacity:    z.number({ message: 'Capacity must be a number' })
                  .int().min(1).max(100000),
  })
});

// Update için body içindeki alanları optional yapıyoruz
export const updateEventSchema = z.object({
  body: createEventSchema.shape.body.partial()
});