import { Request, Response, NextFunction } from 'express';
import * as sectionService from '../services/section.service';

export const createSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await sectionService.createSection(req.params.venueId as string, req.body);
    res.status(201).json({ section });
  } catch (e) {
    next(e);
  }
};

export const listSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = await sectionService.listSections(req.params.venueId as string);
    res.json({ sections });
  } catch (e) {
    next(e);
  }
};

export const getSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await sectionService.getSection(req.params.id as string);
    res.json({ section });
  } catch (e) {
    next(e);
  }
};

export const updateSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await sectionService.updateSection(req.params.id as string, req.body);
    res.json({ section });
  } catch (e) {
    next(e);
  }
};

export const deleteSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await sectionService.deleteSection(req.params.id as string);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const getSeatmapAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sectionService.getSeatmapAvailability(req.params.id as string);
    res.json(result);
  } catch (e) {
    next(e);
  }
};
