# Harness Templates by Service Archetype

Different service types need different controls. During the **Plan** and **Inception** phases, classify the service archetype and load the appropriate template.

## How to Use

1. During **Plan phase**: Identify the service archetype from the target app/module
2. During **Inception**: Include archetype-specific NFRs and guides
3. During **Construct**: Apply archetype-specific sensors (e.g., run different checks for API vs consumer)

---

## Archetypes

### HTTP API Service

**Examples**: REST APIs, backend-for-frontend services, public APIs

| Type | Control |
|---|---|
| **Guide** | API design patterns (REST, request/response DTOs, Swagger annotations) |
| **Guide** | Auth guard patterns (JWT, API key, composed auth) |
| **Guide** | Error response format (standard error DTO with status, message, error code) |
| **Sensor** | HTTP status code SLO (99.9% non-5xx) |
| **Sensor** | Latency SLO (P95 < target) |
| **Sensor** | E2e tests hitting actual HTTP endpoints (supertest) |
| **NFR** | Response time target (e.g., P95 < 500ms) |
| **NFR** | Uptime target (e.g., 99.9%) |

### Event Consumer

**Examples**: Kafka consumers, RabbitMQ consumers, SQS/SNS consumers

| Type | Control |
|---|---|
| **Guide** | Kafka retry patterns (exponential backoff, DLQ) |
| **Guide** | Idempotency patterns (dedup by event ID) |
| **Guide** | Event schema validation (Avro/JSON schema) |
| **Sensor** | Event processing latency SLO |
| **Sensor** | Dead letter queue monitoring |
| **Sensor** | Consumer lag monitoring |
| **NFR** | Processing latency target (e.g., P95 < 5s) |
| **NFR** | At-least-once delivery guarantee |

### Worker / Cron Job

**Examples**: Background workers, cron jobs, batch processors

| Type | Control |
|---|---|
| **Guide** | Job timeout handling (graceful shutdown) |
| **Guide** | Batch processing patterns (chunking, cursor pagination) |
| **Guide** | Concurrency control (distributed locks if needed) |
| **Sensor** | Job completion rate SLO |
| **Sensor** | Job duration monitoring |
| **Sensor** | Failed job alerting |
| **NFR** | Completion rate target (e.g., 99.9%) |
| **NFR** | Maximum duration target |

### Frontend (React / React Native / Remix)

**Examples**: Mobile apps, web SPAs, admin dashboards

| Type | Control |
|---|---|
| **Guide** | Component patterns (atomic design, composition) |
| **Guide** | State management patterns (Jotai, Redux, context) |
| **Guide** | Accessibility standards (WCAG 2.1 AA) |
| **Sensor** | Bundle size monitoring |
| **Sensor** | Core Web Vitals (LCP, FID, CLS) |
| **Sensor** | Visual regression testing |
| **NFR** | Startup time target (e.g., P99 < 10s) |
| **NFR** | Crash-free sessions target (e.g., 99%) |

---

## Combining Archetypes

A single repo may contain multiple archetypes (e.g., a monorepo with an HTTP API, event consumer, and workers). When this happens:

- Apply each archetype's controls to the relevant `apps/` directory
- Shared controls (maintainability rules) apply globally
- NFRs may differ per archetype within the same repo

## Adding a New Archetype

When a new service type appears:
1. Identify its unique guide/sensor needs
2. Add an entry to this file
3. Create archetype-specific rules if needed (scoped to the relevant file paths)
