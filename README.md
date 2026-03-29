# 🚀 Evoria Backend

Backend scaffold for **Evoria**, built with **Express**, **TypeScript**, and **Prisma**, following **MVC + Service Layer architecture**.

---

## 📦 Tech Stack

- Node.js + npm
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod (validation)
- JWT (auth)
- Winston (logging)

---

## 📁 Project Structure

```
evoria-backend/
├── src/
│   ├── app.ts            # Express app config
│   ├── server.ts         # Server entry point
│   │
│   ├── routes/           # Route definitions
│   ├── controllers/      # HTTP layer
│   ├── services/         # Business logic
│   ├── middlewares/      # Auth, validation, errors
│   ├── utils/            # Helpers (logger, errors, responses)
│   └── config/           # Env config
│
├── prisma/
│   └── schema.prisma     # DB schema
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## ⚙️ Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd evoria-backend
npm install
```

---

### 2. Environment variables

Create `.env`:

```bash
cp .env.example .env
```

Edit:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/evoria_db
JWT_SECRET=your_secret
PORT=3000
```

---

## 🗄️ Database Setup

Make sure **PostgreSQL is running**.

### Option A — Local PostgreSQL

```bash
sudo systemctl start postgresql
```

Create DB:

```bash
sudo -iu postgres psql
```

```sql
CREATE DATABASE evoria_db;
CREATE USER evoria_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE evoria_db TO evoria_user;
\q
```

Update `.env` accordingly.

---

### Option B — Docker (recommended)

```bash
docker run --name evoria-postgres \
  -e POSTGRES_USER=evoria_user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=evoria_db \
  -p 5432:5432 \
  -d postgres:16
```

---

## 🔧 Prisma

Generate client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate -- --name init
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

---

## ▶️ Running the App

### Development

```bash
npm run dev
```

Server will run at:

```
http://localhost:3000
```

---

### Production

```bash
npm run build
npm start
```

---

## 🧪 Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 📜 Scripts

```bash
npm run dev            # Start dev server (nodemon + ts-node)
npm run build          # Compile TypeScript
npm start              # Run compiled app
npm run typecheck      # TypeScript check only

npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

---

## ⚠️ Common Issues

### ❌ Prisma P1001 (DB not reachable)
- PostgreSQL not running
- Wrong `DATABASE_URL`

Check:

```bash
ss -ltnp | grep 5432
```

---

### ❌ Type errors (Express / Zod)
- Ensure:
```json
"@types/express": "^4.x"
```

---

### ❌ PrismaClient not found
Run:

```bash
npm run prisma:generate
```

---

## 🧠 Architecture

This project follows:

### MVC + Service Layer

- **Routes** → define endpoints
- **Controllers** → handle HTTP logic
- **Services** → business logic + DB
- **Prisma** → database access

Flow:

```
Request → Route → Controller → Service → Prisma → DB
```

---

## 🔐 Next Steps

- [ ] User registration & login (JWT)
- [ ] Role-based access control (RBAC)
- [ ] Input validation with Zod
- [ ] Centralized error handling
- [ ] Logging system

---

## 📄 License

MIT
