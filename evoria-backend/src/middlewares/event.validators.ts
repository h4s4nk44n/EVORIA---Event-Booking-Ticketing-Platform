import { z } from 'zod';

// We wrap the schema inside a "body" object to match the structure of the request object in our validation middleware
export const createEventSchema = z.object({
  body: z.object({
    title:       z.string().min(3).max(120),
    description: z.string().min(10).max(2000),
    dateTime:    z.string().datetime({ message: 'Must be ISO 8601 format' })
                  .refine(d => new Date(d) > new Date(), { message: 'Must be a future date' }),
    capacity:    z.number({ message: 'Capacity must be a number' })
                  .int().min(1).max(100000),
    categoryId:  z.string().optional(),
    venueId:     z.string().optional(),
  })
});

// For update, we make the fields inside body optional
export const updateEventSchema = z.object({
  body: createEventSchema.shape.body.partial()
});