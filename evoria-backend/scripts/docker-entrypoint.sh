#!/bin/sh
set -e

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

# Seed only when the database has no users yet, so re-running `up` or
# restarting the container never wipes data you created.
USERS=$(node -e 'const {PrismaClient}=require("@prisma/client"); const p=new PrismaClient(); p.user.count().then(c=>process.stdout.write(String(c))).catch(()=>process.stdout.write("0")).finally(()=>p.$disconnect());')

if [ "$USERS" = "0" ]; then
  echo "[entrypoint] Empty database detected - seeding demo data..."
  npx prisma db seed
else
  echo "[entrypoint] Database already has $USERS user(s) - skipping seed."
fi

echo "[entrypoint] Starting backend..."
exec npm run dev
