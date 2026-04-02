import * as fs from 'fs';
import * as path from 'path';

const README_PATH = path.resolve(__dirname, '..', 'README.md');

let content: string;

beforeAll(() => {
  content = fs.readFileSync(README_PATH, 'utf-8');
});

describe('README.md', () => {
  it('should exist at the project root', () => {
    expect(fs.existsSync(README_PATH)).toBe(true);
  });

  it('should have the project title', () => {
    expect(content).toContain('# Evoria — Event Booking & Ticketing Platform');
  });

  describe('Team section', () => {
    it('should contain a Team heading', () => {
      expect(content).toMatch(/## Team/);
    });

    it.each([
      ['Hasan Kaan Doygun', '2640464'],
      ['Taha Turkay Aktaş', '2640274'],
      ['Burak Sağbaş', '2690824'],
    ])('should list team member %s with ID %s', (name, id) => {
      expect(content).toContain(name);
      expect(content).toContain(id);
    });
  });

  describe('Prerequisites section', () => {
    it('should contain a Prerequisites heading', () => {
      expect(content).toMatch(/## Prerequisites/);
    });

    it.each(['Node.js', 'PostgreSQL', 'npm'])(
      'should list %s as a prerequisite',
      (tool) => {
        expect(content).toContain(tool);
      },
    );
  });

  describe('Setup section', () => {
    it('should contain a Setup heading', () => {
      expect(content).toMatch(/## Setup/);
    });

    it.each([
      'npm install',
      'cp .env.example .env',
      'npx prisma migrate dev',
      'npx prisma db seed',
      'npm run dev',
    ])('should include the command: %s', (cmd) => {
      expect(content).toContain(cmd);
    });
  });

  describe('Environment Variables section', () => {
    it('should contain an Environment Variables heading', () => {
      expect(content).toMatch(/## Environment Variables/);
    });

    it.each(['DATABASE_URL', 'JWT_SECRET', 'PORT', 'ALLOWED_ORIGIN'])(
      'should document the %s variable',
      (varName) => {
        expect(content).toContain(varName);
      },
    );
  });

  describe('Architecture section', () => {
    it('should contain an Architecture heading', () => {
      expect(content).toMatch(/## Architecture/);
    });

    it('should describe the request flow', () => {
      expect(content).toMatch(/Route.*Middleware.*Controller.*Service.*Prisma/);
    });
  });

  describe('Project Structure section', () => {
    it('should contain a Project Structure heading', () => {
      expect(content).toMatch(/## Project Structure/);
    });

    it.each(['routes/', 'controllers/', 'services/', 'middlewares/', 'utils/', 'config/'])(
      'should list the %s directory',
      (dir) => {
        expect(content).toContain(dir);
      },
    );
  });

  describe('Tech Stack section', () => {
    it('should contain a Tech Stack heading', () => {
      expect(content).toMatch(/## Tech Stack/);
    });

    it.each(['Express', 'TypeScript', 'PostgreSQL', 'Prisma', 'Zod', 'JWT', 'Winston'])(
      'should mention %s',
      (tech) => {
        expect(content).toContain(tech);
      },
    );
  });
});
