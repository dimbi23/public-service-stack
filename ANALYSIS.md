# Deep Analysis: public-service-stack

_Analysis Date: 2026-03-31_
_Repository: https://github.com/dimbi23/public-service-stack_
_Purpose: Digital Public Infrastructure for Malagasy Administrative Procedures_

---

## 1. Executive Summary

This is a **production-grade digital public infrastructure platform** implementing GovStack-compliant administrative procedures management for Madagascar. The system follows clean architecture principles with clear service boundaries, event-driven communication, and strong separation between citizen-facing and internal APIs.

**Overall Grade: B+** — Solid architecture with some areas requiring attention before production scale.

---

## 2. Architecture Overview

### 2.1 Service Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CITIZEN LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  Portal (Next.js + Payload CMS) ──┐                                     │
│  ├── Public service catalog        │                                   │
│  ├── Form submissions             │                                   │
│  └── Application tracking         │                                   │
└──────────────────┬────────────────┘                                    │
                   │ REST / Internal Auth                               │
┌──────────────────┴────────────────┐                                    │
│          API GATEWAY LAYER         │                                   │
├────────────────────────────────────┼────────────────────────────────────┤
│  procedures-api (NestJS)           │  case-api (NestJS)                │
│  ├── Public: Service catalog        │  ├── Case lifecycle CRUD          │
│  └── Internal: +ExecutionMapping    │  ├── Document upload (MinIO)        │
│                                     │  ├── Email notifications          │
│                                     │  └── Event emission (Redis)       │
└──────────────────┬─────────────────┴──────────┬────────────────────────┘
                   │                               │
┌──────────────────┴──────────────┐  ┌────────────┴──────────────────────┐
│      WORKFLOW ENGINE            │  │      EVENT BUS (Redis)              │
│  wbb-service (NestJS)           │  │  channels:                          │
│  ├── Workflow registry (Redis)    │  │  - events:case.submitted            │
│  ├── n8n integration              │  │  - events:case.status_changed       │
│  └── Redis event subscriber       │  │  - events:case.step_completed       │
└─────────────────────────────────┘  │  - events:case.document_uploaded      │
                                     │  - events:case.closed                 │
┌────────────────────────────────────┴─────────────────────────────────────┐
│                         INFRASTRUCTURE                                 │
│  PostgreSQL (portal, case_api, n8n) │ Redis │ MinIO │ Mailhog │ n8n   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Communication Patterns

| Pattern | Usage | Implementation |
|---------|-------|----------------|
| **Synchronous REST** | Service-to-service calls | NestJS HTTPModule with Axios |
| **Async Events** | Case lifecycle notifications | Redis pub/sub with typed envelopes |
| **Webhook callbacks** | Workflow engine → Case API | POST to wbb-service callback endpoint |
| **Job queue** | CSV import processing | In-memory (single-process) |

---

## 3. Component Deep Dive

### 3.1 Portal (Payload CMS + Next.js)

**Strengths:**
- Multi-tenant architecture with `fresh()` HMR workaround for Payload plugin
- Comprehensive service schema with 200+ lines of field definitions
- Custom endpoints for service import, tracking, and agency routing
- Integration with external REST APIs via strategy pattern

**Concerns:**
- **Turbopack HMR debt**: The `fresh()` function in `payload.config.ts` patches a DuplicateFieldName error. This is technical debt that should be tracked and resolved upstream.
- **Access control complexity**: Mix of RBAC (admin roles), tenant isolation, and custom hooks creates overlapping concerns that could lead to privilege escalation bugs.
- **No rate limiting**: The CSV upload endpoint and custom endpoints lack rate limiting.

**Security Review:**
```typescript
// GOOD: Service-level tenant validation
if (serviceTenantId !== departmentTenantId && !req.user?.roles?.includes('admin')) {
  throw new Error("Department must belong to the same tenant");
}

// CONCERN: `overrideAccess: true` used extensively in import jobs
// This bypasses all access control — ensure it's only used in trusted contexts
```

### 3.2 case-api (NestJS + Prisma)

**Strengths:**
- Clean domain modeling with repository pattern
- Explicit state machine with `TRANSITIONS` validation
- Event emission on all significant state changes
- Graceful document upload (direct file or storageRef)
- Email notifications for status changes (non-blocking)

**Code Quality:**
```typescript
// GOOD: Repository pattern with Prisma mapper
toCase(row: PrismaCase & { steps: PrismaCaseStep[], documents: PrismaCaseDocument[] }): Case

// GOOD: Status transition validation
const allowed = TRANSITIONS[found.status];
if (!allowed.includes(dto.status)) {
  throw new BadRequestException(`Transition ${found.status} → ${dto.status} is not allowed`);
}

// GOOD: Non-blocking email (void promise)
if (found.applicantId.includes('@')) {
  void this.mail.sendStatusChanged({...});
}
```

**Database Schema (Prisma):**
- Proper indexes on `serviceId`, `applicantId`, `status`
- Cascade deletes for steps and documents
- JSON storage for `formData` flexibility

**Concerns:**
- **No database-level constraints** on status transitions (application-level only)
- **Email as identifier**: `applicantId.includes('@')` is a heuristic that could fail
- **Missing pagination**: `findAll` could return large result sets

### 3.3 wbb-service (Workflow Engine)

**Architecture:**
This is a GovStack Workflow Building Block implementation. It bridges the case lifecycle events with n8n workflow orchestration.

**Key Components:**
- `WorkflowRegistry`: Redis-backed service-to-workflow mapping
- `RedisSubscriberService`: Event bus consumer
- `N8nClient`: Thin wrapper over n8n REST API

**Event Flow:**
```
case-api emits `case.submitted` → Redis channel `case_events`
                                    ↓
                              RedisSubscriberService receives
                                    ↓
                              WorkflowService.trigger()
                                    ↓
                              N8nClient.triggerWebhook()
                                    ↓
                              n8n workflow executes
                                    ↓
                              POST /v1/workflow/callback
                                    ↓
                              CasesClient.completeStep()
                                    ↓
                              CasesClient.updateStatus()
```

**Strengths:**
- Async event processing decouples case-api from workflow engine
- Redis-backed registry survives service restarts
- Pattern matching for workflow registration (`MAM-*` wildcards)

**Critical Concerns:**
- **Race condition risk**: If multiple subscribers process same event, duplicate workflows may trigger. No deduplication on `eventId`.
- **Callback security**: The callback endpoint at `/v1/workflow/callback` lacks explicit authentication (relies on network isolation).
- **No retry logic**: Failed n8n triggers or callbacks are logged but not retried.

### 3.4 procedures-api

**Purpose:** Bridge between Portal (Payload CMS) and external consumers.

**Key Feature:** Profile-based responses
```typescript
// Public profile: strips executionMapping, metrics
async findAll(profile: ApiProfile = 'public')

// Internal profile: enriches with ExecutionMapping from Payload
async enrichWithExecutionMapping(doc)
```

**Concerns:**
- **Error handling**: `enrichWithExecutionMapping` silently swallows errors
- **No caching**: Repeated calls to Payload CMS for same serviceId

### 3.5 libs/normalizer

**Purpose:** Transform raw CSV/Excel catalogs into normalized service definitions.

**Intelligence:**
- Heuristic-based document type inference (`inferDocumentTypeCode`)
- Step type classification from French keywords
- Fee model inference from cost ranges

**Quality Concerns:**
- Heuristic classification is "best effort" — confidence levels are tracked
- All steps default to `manual_required` confidence if keyword matching fails
- No feedback loop for improving classifiers

---

## 4. Security Analysis

### 4.1 Authentication & Authorization

| Layer | Mechanism | Assessment |
|-------|-----------|------------|
| Portal | Payload auth + RBAC | ✅ Good separation |
| Internal APIs | `SecretGuard` with `X-Service-Key` | ⚠️ Header-based, ensure TLS |
| Public APIs | None (read-only catalog) | ✅ Appropriate |
| n8n callbacks | Network isolation only | ⚠️ Needs auth review |

### 4.2 Data Protection

| Data Type | Protection | Status |
|-----------|------------|--------|
| PII (applicant emails) | Stored in case-api | ✅ Encrypted at rest (Postgres) |
| Documents | MinIO with presigned URLs | ⚠️ URL expiration not configured |
| Service keys | Env vars | ⚠️ No secrets manager integration |
| Database | Postgres with basic auth | ⚠️ No TLS enforcement visible |

### 4.3 Injection Risks

```typescript
// REVIEWED: Prisma parameterized queries prevent SQL injection
// REVIEWED: No eval() or dynamic code execution
// REVIEWED: File upload validation (mimetype check in storage.service)

// CONCERN: CSV/Excel parsing uses PapaParse and XLSX
// These libraries have had XSS vulnerabilities in cell content
```

---

## 5. Scalability & Performance

### 5.1 Current Limits

| Resource | Current | Bottleneck |
|----------|---------|------------|
| Job queue | In-memory Map | Single process only |
| Event bus | Redis pub/sub | No persistence, at-most-once delivery |
| File uploads | Direct to MinIO | Streaming not implemented (buffers in memory) |
| Database | Single Postgres | No read replicas configured |

### 5.2 Scaling Recommendations

1. **Replace in-memory job queue** with BullMQ or Payload's official queue plugin
2. **Add Redis Streams** or Kafka for event persistence and replay
3. **Implement streaming uploads** for large documents
4. **Add database connection pooling** configuration in Prisma
5. **Enable response caching** for public catalog endpoints

---

## 6. Testing Coverage

| Test Type | Files | Coverage |
|-----------|-------|----------|
| Unit tests | 1 file (`libs/common/src/lib/common.spec.ts`) | ❌ Minimal placeholder |
| E2E tests | 3 files (case-api, wbb-service, procedures-api) | ❌ Boilerplate only |
| Integration | 2 files (portal) | ⚠️ Basic API tests |

**Critical Gap:** No unit tests for:
- State machine transitions
- Repository layer
- Normalizer heuristics
- Event emission/reception

---

## 7. Deployment & Operations

### 7.1 Docker Configuration

| Service | Dockerfile | Status |
|---------|------------|--------|
| portal | Multi-stage | ✅ Production-ready |
| case-api | Multi-stage | ✅ Production-ready |
| procedures-api | Multi-stage | ✅ Production-ready |
| wbb-service | Multi-stage | ✅ Production-ready |

**Observations:**
- All use `node:22.12.0-alpine` (current LTS)
- Multi-stage builds reduce image size
- Prisma migrations included in case-api

### 7.2 Environment Configuration

```bash
# All services have .env.example files
# Missing: docker-compose.prod.yml with:
# - TLS termination
# - Log aggregation
# - Health check endpoints
# - Resource limits
```

---

## 8. Technical Debt Register

| Item | Location | Priority | Effort |
|------|----------|----------|--------|
| Turbopack HMR workaround | `payload.config.ts:22-32` | Low | Track upstream |
| In-memory job queue | `jobs/job-queue.ts` | High | Medium |
| No event deduplication | `wbb-service/redis-subscriber.service.ts` | Medium | Low |
| Missing rate limiting | All custom endpoints | High | Low |
| No callback auth | `wbb-service/workflow.controller.ts` | Medium | Low |
| Placeholder tests | All `*.spec.ts` files | High | High |
| No retry logic | `N8nClient`, `EventsService` | Medium | Medium |

---

## 9. Recommendations

### Immediate (Before Production)

1. **Add rate limiting** to CSV upload and public endpoints
2. **Implement callback authentication** (HMAC signature or API key)
3. **Add database constraints** for status transitions
4. **Enable TLS** for all inter-service communication
5. **Add health check endpoints** to all services

### Short-term (Next Quarter)

1. **Replace job queue** with BullMQ for horizontal scaling
2. **Add comprehensive unit tests** for business logic
3. **Implement event replay** capability for disaster recovery
4. **Add metrics collection** (Prometheus/OpenTelemetry)
5. **Create production docker-compose** with proper security

### Long-term (Next Year)

1. **Migrate to Kubernetes** with Helm charts
2. **Add distributed tracing** across services
3. **Implement ML feedback loop** for normalizer heuristics
4. **Add service mesh** (Istio/Linkerd) for mTLS and observability
5. **Create chaos engineering** tests for resilience validation

---

## 10. Conclusion

The **public-service-stack** is a well-architected platform that successfully implements GovStack principles for digital public infrastructure. The codebase demonstrates:

- ✅ Clean separation of concerns
- ✅ Event-driven architecture
- ✅ Standards-compliant schema design
- ✅ Production-ready containerization

The main risks before production deployment are:
- ⚠️ Limited test coverage
- ⚠️ In-memory job queue (not horizontally scalable)
- ⚠️ Missing rate limiting and retry logic

With the recommended improvements, this platform can reliably serve citizens at scale.

---

*Analysis by: Honua 🌍*
*For: Dimbinirina, Lead Engineer — Digital Public Infrastructure*
