import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service';

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ category });
  } catch (e) {
    next(e);
  }
};

export const listCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.listCategories();
    res.json({ categories });
  } catch (e) {
    next(e);
  }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id as string);
    res.json({ category });
  } catch (e) {
    next(e);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.updateCategory(req.params.id as string, req.body);
    res.json({ category });
  } catch (e) {
    next(e);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoryService.deleteCategory(req.params.id as string);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
