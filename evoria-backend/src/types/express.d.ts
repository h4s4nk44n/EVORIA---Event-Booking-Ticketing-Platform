declare namespace Express {
  interface Request {
    user: {
      userId: string;
      email:  string;
      role:   'ATTENDEE' | 'ORGANIZER' | 'ADMIN';
    };
  }
}