import { Request, Response, NextFunction } from 'express';
import * as venueService from '../services/venue.service';

export const createVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await venueService.createVenue(req.body);
    res.status(201).json({ venue });
  } catch (e) {
    next(e);
  }
};

export const listVenues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venues = await venueService.listVenues({
      city: req.query.city as string | undefined,
    });
    res.json({ venues });
  } catch (e) {
    next(e);
  }
};

export const getVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await venueService.getVenueById(req.params.id as string);
    res.json({ venue });
  } catch (e) {
    next(e);
  }
};

export const updateVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await venueService.updateVenue(req.params.id as string, req.body);
    res.json({ venue });
  } catch (e) {
    next(e);
  }
};

export const deleteVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await venueService.deleteVenue(req.params.id as string);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
