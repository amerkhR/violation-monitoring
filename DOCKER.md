# Развертывание в Docker

Инструкция для запуска проекта на другом компьютере **без установки** .NET, Node.js и SQL Server — достаточно Docker.

## Требования

- [Docker Engine](https://docs.docker.com/engine/install/) 24+
- [Docker Compose](https://docs.docker.com/compose/install/) v2 (часто идёт вместе с Docker Desktop)

Проверка:

```bash
docker --version
docker compose version
```

## Быстрый старт

1. Скопируйте проект на целевой ПК (git clone, архив, флешка и т.д.).

2. Перейдите в корень репозитория:

```bash
cd violation-monitoring
```

3. Создайте файл окружения из примера и при необходимости измените JWT-ключ:

```bash
cp .env.example .env
```

В `.env` ключ `JWT_KEY` должен быть **не короче 32 символов**.

4. Соберите образы и запустите контейнеры:

```bash
docker compose up --build -d
```

5. Откройте в браузере на **этом же компьютере**:

| Сервис   | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health   | http://localhost:5000/health |

### Тестовые пользователи

- Администратор: `admin` / `Admin123!`
- Инспектор: `inspector` / `Inspector123!`

## Управление

Остановить:

```bash
docker compose down
```

Остановить и удалить данные (БД и загруженные файлы):

```bash
docker compose down -v
```

Просмотр логов:

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

Пересборка после обновления кода:

```bash
docker compose up --build -d
```

## Что сохраняется между перезапусками

Docker-тома:

- `backend-data` — база SQLite (`ViolationMonitoring.db`)
- `backend-uploads` — фото и видео в `wwwroot/uploads`

При `docker compose down` без `-v` данные сохраняются.

## Перенос данных с другого ПК

Если на старой машине уже есть БД и файлы:

1. Скопируйте `backend/ViolationMonitoring.Api/ViolationMonitoring.db` (если есть).
2. Скопируйте каталог `backend/ViolationMonitoring.Api/wwwroot/uploads/`.
3. После первого `docker compose up -d` выполните:

```bash
docker cp ViolationMonitoring.db violation-backend:/app/data/ViolationMonitoring.db
docker cp ./uploads/. violation-backend:/app/wwwroot/uploads/
docker compose restart backend
```

(путь к локальному `uploads` укажите свой)

## Устранение неполадок

### Предупреждения `SQL_SA_PASSWORD` и пустой `JWT_KEY`

Если при `docker compose up` видите:

```text
WARN The "SQL_SA_PASSWORD" variable is not set...
WARN The "JWT_KEY" variable is not set. Defaulting to a blank string.
```

на сервере лежит **старая** версия `docker-compose.yml` (с SQL Server). Обновите проект:

```bash
git pull
# или заново скопируйте репозиторий с актуальными файлами
```

В актуальной версии **нет** `SQL_SA_PASSWORD`, только SQLite. Проверка:

```bash
grep -E 'SQL_SA|sqlserver' docker-compose.yml
# вывод должен быть пустым
```

Создайте `.env` в корне проекта:

```bash
cp .env.example .env
nano .env
```

Строка должна быть **непустой** (≥ 32 символов), например:

```env
JWT_KEY=change_me_to_a_secret_key_at_least_32_chars_long
```

Не оставляйте `JWT_KEY=` без значения — иначе backend может не стартовать.

### Ошибка NU1301 (nuget.org недоступен)

```text
error NU1301: Unable to load the service index for source https://api.nuget.org/v3/index.json
```

Контейнер при сборке **не может достучаться до NuGet** (файрвол, DNS, блокировка, нет исходящего HTTPS). Образ `mssql` при этом может скачаться — это другой CDN.

**1. Убедитесь, что код актуален** (без SQL Server):

```bash
grep -E 'SQL_SA|sqlserver|COPY \. \.' docker-compose.yml backend/ViolationMonitoring.Api/Dockerfile
```

В новом `Dockerfile` сначала копируется только `.csproj`, а не `COPY . .` перед restore.

**2. Проверьте доступ из Docker:**

```bash
docker run --rm --network host mcr.microsoft.com/dotnet/sdk:8.0 \
  curl -fsS -o /dev/null -w "%{http_code}\n" https://api.nuget.org/v3/index.json
```

Должно быть `200`. Если таймаут или ошибка — чините сеть/DNS на сервере или задайте прокси в `.env`:

```env
HTTP_PROXY=http://user:pass@proxy.example:8080
HTTPS_PROXY=http://user:pass@proxy.example:8080
NO_PROXY=localhost,127.0.0.1
```

**3. Сборка с `network: host`** (уже в актуальном `docker-compose.yml`, Linux):

```bash
export DOCKER_BUILDKIT=1
docker compose build --no-cache backend
```

**4. Обход: собрать backend без NuGet в Docker**

На **вашем ПК** (где nuget.org открывается):

```bash
cd backend/ViolationMonitoring.Api
dotnet publish -c Release -o publish /p:UseAppHost=false
```

Скопируйте каталог `publish/` на сервер в тот же путь в проекте, затем на сервере:

```bash
docker compose -f docker-compose.yml -f docker-compose.offline.yml up --build -d
```

Скачивается только маленький runtime-образ `aspnet`, без `dotnet restore`.

### Долго идёт `dotnet restore` при сборке

Это нормально при **первой** сборке: скачиваются образы SDK (~700 MB) и пакеты NuGet. На слабом канале 10–20 минут — обычное дело.

Ускорение:

1. Включите BuildKit (обычно уже включён):

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

2. Повторная сборка после правок кода будет быстрее (кэш слоёв и NuGet).

3. Дождитесь завершения — прерывать не стоит, иначе кэш не сохранится.

**Контейнер backend падает с ошибкой JWT**

Проверьте `.env`: `JWT_KEY` должен быть ≥ 32 символов.

**Порт занят**

Измените проброс в `docker-compose.yml`, например `"5001:5000"` для backend и пересоберите frontend с новым `VITE_API_BASE_URL`, если меняли порт API.

**Frontend не открывает страницы по прямой ссылке**

В образе настроен nginx с `try_files` для SPA — пересоберите frontend: `docker compose up --build -d frontend`.

## Ограничения текущей конфигурации

- Frontend обращается к API по адресу `http://localhost:5000/api` (зашито при сборке образа). Это рассчитано на работу **на том же ПК**, где запущен Docker.
- CORS в приложении разрешён для `http://localhost:5173` — доступ с других хостов в сети потребует изменений в коде backend.

## Структура контейнеризации

```
violation-monitoring/
├── docker-compose.yml          # оркестрация backend + frontend
├── .env.example                # шаблон переменных окружения
├── backend/.../Dockerfile      # ASP.NET Core 8 + SQLite
└── frontend/
    ├── Dockerfile              # Vite build + nginx
    └── nginx.conf              # маршрутизация SPA
```
