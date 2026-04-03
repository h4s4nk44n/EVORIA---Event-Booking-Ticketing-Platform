import xss from 'xss';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export async function createCategory(data: { name: string; description?: string }) {
  return prisma.category.create({
    data: {
      name: xss(data.name),
      description: data.description ? xss(data.description) : undefined,
    },
  });
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { events: true } } },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { events: true } } },
  });
  if (!category) throw new AppError('Category not found', 404);
  return category;
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string }>
) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);

  return prisma.category.update({
    where: { id },
    data: {
      ...(data.name && { name: xss(data.name) }),
      ...(data.description !== undefined && { description: xss(data.description) }),
    },
  });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError('Category not found', 404);
  await prisma.category.delete({ where: { id } });
}
