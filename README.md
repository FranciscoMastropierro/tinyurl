# TinyURL — Backend Challenge

Sistema de acortamiento de URLs con Fastify, MongoDB, Redis y procesamiento asincrónico de clicks via BullMQ.

## Requisitos

- Node.js 20+
- Docker y Docker Compose (recomendado)

## Stack

| Componente | Tecnología |
|------------|------------|
| API | Fastify + TypeScript |
| Persistencia | MongoDB + Mongoose |
| Caché | Redis |
| Cola | BullMQ (sobre Redis) |

## Inicio rápido con Docker

```bash
docker compose up --build
```

Servicios:

- **API:** http://localhost:3000
- **Frontend de prueba:** http://localhost:3000/
- **Worker:** proceso separado que consume clicks

## Desarrollo local

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Levantar Mongo y Redis:

```bash
docker compose up -d mongo redis
```

3. Instalar dependencias:

```bash
npm install
```

4. Iniciar API y worker (terminales separadas):

```bash
npm run dev
npm run dev:worker
```

## Endpoints

### Crear TinyURL

```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.google.com/search?q=nodejs","alias":"test-node"}'
```

Respuesta:

```json
{
  "code": "test-node",
  "shortUrl": "http://localhost:3000/test-node"
}
```

### Resolver (redirect)

```bash
curl -I http://localhost:3000/test-node
```

### Estadísticas

```bash
curl http://localhost:3000/api/stats/test-node
```

Respuesta:

```json
{
  "code": "test-node",
  "totalClicks": 1,
  "lastClick": "2026-06-12T12:00:00.000Z"
}
```

### Health check

```bash
curl http://localhost:3000/health
```

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `BASE_URL` | URL base para short links | `http://localhost:3000` |
| `MONGO_URI` | Connection string MongoDB | `mongodb://localhost:27017/tinyurl` |
| `REDIS_URL` | Connection string Redis | `redis://localhost:6379` |
| `REDIS_TTL_SECONDS` | TTL de caché en Redis | `3600` |

## Decisiones técnicas

1. **Fastify** — Validación con JSON Schema, buen soporte TypeScript y bajo overhead.
2. **BullMQ + Redis** — Reutiliza Redis ya requerido para caché; evita agregar RabbitMQ/Kafka para este scope.
3. **Capas separadas** — Controllers → Services → Repositories; facilita mantenimiento y explicación en entrevista.
4. **Flujo de resolución** — Redis → MongoDB (miss) → repoblar Redis con TTL configurable.
5. **Clicks async** — El redirect responde 302 de inmediato; el evento se encola y un worker lo persiste en MongoDB.
6. **nanoid** — Códigos cortos URL-safe con baja probabilidad de colisión.

## Estructura del proyecto

```
src/
├── config/         # Variables de entorno
├── controllers/    # Handlers HTTP
├── services/       # Lógica de negocio
├── repositories/   # Acceso a Mongo y Redis
├── models/         # Schemas Mongoose
├── queues/         # Cola BullMQ
├── workers/        # Consumidor de clicks
├── routes/         # Registro de rutas
└── schemas/        # Validación Fastify
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | API en modo desarrollo |
| `npm run dev:worker` | Worker en modo desarrollo |
| `npm run build` | Compilar TypeScript |
| `npm start` | Ejecutar API compilada |
| `npm run worker` | Ejecutar worker compilado |
