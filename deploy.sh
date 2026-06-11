#!/bin/bash

echo "🚀 Начинаем развертывание Student Journey и Django CRM..."

# Установка Docker и Git
sudo apt update && sudo apt install -y docker.io docker-compose git

# Создаем папку проекта
mkdir -p ~/ulsu_project && cd ~/ulsu_project

# Клонируем репозитории
echo "📥 Скачиваем код с GitHub..."
if [ ! -d "student-journey" ]; then
    git clone https://github.com/MerOr96/student-journey.git
else
    cd student-journey && git pull && cd ..
fi

if [ ! -d "crm_students" ]; then
    git clone https://github.com/MerOr96/crm_students.git
else
    cd crm_students && git pull && cd ..
fi

# Создаем docker-compose.yml
echo "⚙️ Создаем docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: student_journey
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  django:
    build:
      context: ./crm_students
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/student_journey
      - DEBUG=True
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - django_media:/app/media
      - django_static:/app/staticfiles

  backend:
    build:
      context: ./student-journey
      dockerfile: infra/docker/backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/student_journey?schema=public
      JWT_SECRET: super-secret-change-me-in-production
      JWT_REFRESH_SECRET: refresh-secret-change-me
      PORT: '4000'
      DJANGO_CRM_URL: 'http://django:8000'
      UPLOAD_DIR: ./uploads
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - node_uploads:/app/uploads

  frontend:
    build:
      context: ./student-journey
      dockerfile: infra/docker/frontend/Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://31.177.83.7/api
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - django_media:/var/www/django/media:ro
      - django_static:/var/www/django/static:ro
      - node_uploads:/var/www/node/uploads:ro
    depends_on:
      - frontend
      - backend
      - django

volumes:
  pgdata:
  node_uploads:
  django_media:
  django_static:
EOF

# Создаем nginx.conf
echo "⚙️ Создаем nginx.conf..."
cat << 'EOF' > nginx.conf
upstream frontend {
    server frontend:3000;
}
upstream backend {
    server backend:4000;
}
upstream django {
    server django:8000;
}

server {
    listen 80;
    server_name 31.177.83.7;

    # Node.js API
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # Node.js Uploads
    location /uploads/ {
        alias /var/www/node/uploads/;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Static
    location /static/ {
        alias /var/www/django/static/;
    }

    # Django Media
    location /media/ {
        alias /var/www/django/media/;
    }

    # Next.js Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

echo "🐳 Собираем и запускаем Docker контейнеры..."
sudo docker-compose up -d --build

echo "📦 Применяем миграции баз данных..."
echo "Ждем 5 секунд чтобы база запустилась..."
sleep 5
sudo docker-compose exec -T django python manage.py migrate
sudo docker-compose exec -T backend npx prisma db push

echo "✅ ГОТОВО! Ваш проект доступен по адресу http://31.177.83.7"
