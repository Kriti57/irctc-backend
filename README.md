# IRCTC Backend

An event-driven microservices backend for an IRCTC-style train booking system. It is **work in progress**: the user, catalog (trains, routes, schedules), search, and notification pieces are working. Booking, inventory, and payments are planned (see [Roadmap](#roadmap)).

## Architecture

```mermaid
flowchart LR
    Client --> GW[API Gateway :4000]
    GW --> US[User Service :4001]
    GW --> SS[Search Service :4002]
    GW --> AS[Admin Service :4003]

    US -- notification.* --> K[(Kafka)]
    AS -- admin.* --> K
    K --> NS[Notification Service :4004]
    K --> SS

    US --> PG1[(PostgreSQL)]
    AS --> PG2[(PostgreSQL)]
    US --> R[(Redis)]
    GW --> R
    SS --> ES[(Elasticsearch)]
    NS --> SG[SendGrid]
```

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 4000 | Single entry point: JWT verification, Redis-backed rate limiting, circuit breaker, request proxying |
| `user-service` | 4001 | Signup with email OTP, login, refresh-token rotation, profile management |
| `search-service` | 4002 | Train search and station autocomplete over Elasticsearch, fed by Kafka events |
| `admin-service` | 4003 | Stations, trains, routes, and schedules (PostgreSQL via Prisma); publishes events to Kafka |
| `notification-service` | 4004 | Consumes Kafka events and sends emails through SendGrid |
| `shared` | n/a | Kafka topic constants and the dead-letter-queue (DLQ) handler used by all consumers |

## Tech Stack

Node.js (ES modules), Express, PostgreSQL, Prisma, Redis, Apache Kafka, Elasticsearch, SendGrid, Docker Compose, JWT, bcrypt, Winston.

## Key Features

- **Auth:** email OTP signup (HMAC-hashed OTPs, TTL, resend and verify-attempt limits), bcrypt password hashing, short-lived access tokens, and per-device refresh tokens with rotation and reuse detection stored in Redis.
- **Gateway:** per-endpoint and per-user rate limiting in Redis, a circuit breaker per downstream service, and cookie or Bearer token support. The gateway adds the verified `x-user-id` header for downstream services.
- **Event-driven design:** admin changes (station, route, schedule created or cancelled) are published to Kafka and indexed by the search service. Emails are sent asynchronously by the notification service.
- **Reliability:** a shared dead-letter-queue handler retries failed messages up to 3 times, then moves them to a per-service DLQ topic.
- **Data modeling:** stations, trains, seats, routes (ordered stops with arrival and departure times and distances), and date-based schedules, with Prisma migrations.

## Getting Started

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- A SendGrid API key (for OTP and welcome emails)

### 1. Start the infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (5432), pgAdmin (8081), Redis (6379), Zookeeper, Kafka (9092 inside Docker, 9093 from your machine), and Kafka UI (8080).

The search service also needs Elasticsearch. Add this under `services:` in `docker-compose.yml`, then run `docker compose up -d` again:

```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.4
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    networks:
      - irctc-network
```

### 2. Create the databases

Create one database per service (for example in pgAdmin at http://localhost:8081, or with `psql`):

```sql
CREATE DATABASE irctc_users;
CREATE DATABASE irctc_admin;
```

### 3. Configure each service

Create a `.env` file inside each service folder. **Never commit `.env` files.**

**`api-gateway/.env`**
```env
PORT=4000
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
REDIS_URL=redis://:irctcpass@localhost:6379
ALLOWED_ORIGINS=http://localhost:3000
USER_SERVICE_URL=http://localhost:4001
SEARCH_SERVICE_URL=http://localhost:4002
ADMIN_SERVICE_URL=http://localhost:4003
```

**`user-service/.env`**
```env
PORT=4001
DATABASE_URL=postgresql://admin:irctcpass@localhost:5432/irctc_users
REDIS_URL=redis://:irctcpass@localhost:6379
KAFKA_BROKER=localhost:9093
KAFKA_CLIENT_ID=user-service
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
ACCESS_TOKEN_EXP=15m
REFRESH_TOKEN_EXP=7d
ACCESS_TOKEN_EXP_SEC=900
REFRESH_TOKEN_EXP_SEC=604800
REDIS_USER_TTL=3600
OTP_HMAC_SECRET=change-me-three
OTP_TTL=300
OTP_RATE_MAX_PER_HOUR=5
OTP_MAX_VERIFY_ATTEMPTS=5
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ALLOWED_ORIGINS=http://localhost:3000
```

**`admin-service/.env`**
```env
PORT=4003
DATABASE_URL=postgresql://admin:irctcpass@localhost:5432/irctc_admin
KAFKA_BROKER=localhost:9093
KAFKA_CLIENT_ID=admin-service
INTERNAL_SERVICE_KEY=change-me-internal
ALLOWED_ORIGINS=http://localhost:3000
```

**`search-service/.env`**
```env
PORT=4002
ELASTICSEARCH_URL=http://localhost:9200
KAFKA_BROKER=localhost:9093
KAFKA_CLIENT_ID=search-service
KAFKA_GROUP_ID=search-service-group
ES_RECREATE_INDICES=false
ALLOWED_ORIGINS=http://localhost:3000
```

**`notification-service/.env`**
```env
PORT=4004
KAFKA_BROKER=localhost:9093
KAFKA_CLIENT_ID=notification-service
SENDGRID_API_KEY=your-sendgrid-key
MAIL_SEND=verified-sender@example.com
FRONTEND_URL=http://localhost:3000
```

### 4. Install, migrate, and run

Run these in each service folder (`user-service`, `admin-service`, `search-service`, `notification-service`, `api-gateway`):

```bash
npm install
```

For `user-service` and `admin-service`, also run:

```bash
npx prisma migrate deploy
npx prisma generate
```

Then start each service in its own terminal:

```bash
npm run dev
```

Check the gateway: http://localhost:4000/api/gateway/health

## API Overview

All requests go through the gateway at `http://localhost:4000/api`.

### Auth and users
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users/auth/send-otp` | No | Start signup, email an OTP |
| POST | `/users/auth/verify-otp` | No | Verify OTP and create the account |
| POST | `/users/auth/login` | No | Login, returns access and refresh tokens |
| POST | `/users/auth/refresh` | No | Rotate the refresh token |
| GET / PUT / DELETE | `/users/user/profile` | Yes | Manage your profile |

### Admin (catalog)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST / GET | `/admins/stations/station` | Yes | Create or list stations |
| POST | `/admins/trains/train` | Yes | Create a train and its seats |
| GET | `/admins/trains/train/:trainId` | Yes | Get a train |
| POST | `/admins/trains/route` | Yes | Define a train's route |
| POST | `/admins/schedules/schedule` | Yes | Schedule a train on a date (publishes a Kafka event) |
| PUT | `/admins/schedules/schedule/:scheduleId` | Yes | Cancel a schedule |

### Search (public)
| Method | Path | Description |
|---|---|---|
| GET | `/search/trains?from=Delhi&to=Mumbai&date=2026-12-01` | Search trains between stations |
| GET | `/search/autocomplete` | Station autocomplete |

### Operations
| Method | Path | Description |
|---|---|---|
| GET | `/gateway/health` | Gateway health |
| GET | `/gateway/circuit-breakers` | Circuit breaker state for each service |

## Kafka Topics

Defined in `shared/constants/kafka-topics.js`.

| Area | Topics |
|---|---|
| Notifications | `notification.otp-email`, `notification.welcome-email` |
| Admin events | `admin.station-created`, `admin.route-created`, `admin.schedule-created`, `admin.schedule-cancelled` |
| Dead-letter queues | `dlq.search-service`, `dlq.notification-service` |

Topics for inventory, booking, and payment are defined for the planned services.

## Project Structure

```
irctc-backend/
├── api-gateway/            # entry point: auth, rate limiting, circuit breaker
├── user-service/           # auth + profiles (Prisma, Redis)
├── admin-service/          # trains, stations, routes, schedules (Prisma)
├── search-service/         # Elasticsearch indexing + search
├── notification-service/   # email consumers (SendGrid)
├── shared/                 # Kafka topics, DLQ handler
└── docker-compose.yml      # Postgres, Redis, Kafka, Zookeeper, UIs
```

## Roadmap

- [ ] Role-based access control (admin vs. user) for catalog endpoints
- [ ] Google sign-in endpoint wired into the user service
- [ ] Inventory service: per-schedule seat availability
- [ ] Booking service: Redis seat holds with database-level uniqueness to prevent double booking
- [ ] Payment service and booking confirmation emails
- [ ] Dockerfiles for every service so one `docker compose up` runs everything
- [ ] Outbox pattern for reliable DB-write plus Kafka-publish
- [ ] Automated tests and GitHub Actions CI
