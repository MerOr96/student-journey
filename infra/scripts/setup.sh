#!/bin/bash
set -e

echo "🚀 Student Journey to Russia - Setup Script"
echo "============================================"

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate --schema=apps/backend/prisma/schema.prisma

# 3. Push schema to database
echo "🗄️  Pushing database schema..."
npx prisma db push --schema=apps/backend/prisma/schema.prisma

# 4. Seed database
echo "🌱 Seeding database..."
npx tsx apps/backend/src/seed.ts

echo ""
echo "✅ Setup complete!"
echo "   Run 'npm run dev' to start both frontend and backend"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo "   Admin:    admin@ulsu.ru / admin123"
