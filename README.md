# Violation Monitoring System

Проект по ТЗ: учет и мониторинг нарушений сотрудников на производственном объекте.

## Структура

- `backend/ViolationMonitoring.Api` - ASP.NET Core Web API + EF Core + SQL Server + JWT
- `frontend` - React + TypeScript + Vite

## Быстрый старт

### 1) Конфигурация

Для локальной разработки используются:

- `backend/ViolationMonitoring.Api/appsettings.Development.json`
- переменные окружения (приоритетнее appsettings)

Обязательные значения для Production:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key` (не менее 32 символов)
- `Cors__AllowedOrigins__0` (и последующие origin)

### 2) SQL Server

Убедитесь, что SQL Server доступен, и обновите строку подключения в `backend/ViolationMonitoring.Api/appsettings.json`:

`ConnectionStrings:DefaultConnection`

### 3) Backend

```bash
cd backend/ViolationMonitoring.Api
dotnet restore
dotnet run
```

API будет доступен на стандартных портах ASP.NET Core (Swagger в Development).

Health endpoint:

- `GET /health`

### 4) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend использует `VITE_API_BASE_URL` (по умолчанию `http://localhost:5000/api`).

## Запуск в Docker (production-like)

```bash
cp .env.example .env
# при необходимости измени SQL_SA_PASSWORD и JWT_KEY
docker compose up --build -d
```

Сервисы:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- SQL Server: `localhost:1433`

## Тестовые пользователи

- Администратор: `admin / Admin123!`
- Инспектор: `inspector / Inspector123!`

## Реализовано

- JWT авторизация и роли (Admin/Inspector)
- CRUD сотрудников (базовые операции)
- CRUD типов нарушений (базовые операции)
- Создание нарушений с автоначислением баллов
- Загрузка фото/видео доказательств (сохранение пути в БД)
- Аналитические endpoints (summary/by-departments/top-employees/by-violation-types)
- React UI: логин, сотрудники, нарушения, дашборд с графиками
- Health checks, CORS-конфигурация через окружение и production middleware
- Dockerfile для backend/frontend и `docker-compose.yml`
