# FilmForge

FilmForge is a closed internal production-management system for one fictional
mid-sized film company with approximately 200–250 employees.

## Source of Truth

The approved FilmForge documentation is stored in Notion.

Before implementing or modifying a domain, use the Notion MCP connection and
read the relevant FilmForge documentation.

Main documentation pages:

1. 01 Product Specification
2. 02 User Flows & Pages
3. 03 Design System
4. 04 Frontend Architecture
5. 05 Backend Architecture
6. 06 Database & Prisma
7. 07 REST API Specification
8. 08 Validation, Permissions & Business Rules
9. 09 Development Roadmap & Definition of Done
10. 10 Backlog & Decision Log

The Decision Log is authoritative for approved business decisions.

Approved decisions currently extend through D-041.

The MVP business/documentation scope is FROZEN.

Do not silently change approved:
- business rules;
- permissions;
- enums;
- entity relationships;
- authentication behavior;
- lifecycle rules;
- API behavior;
- validation rules.

If code and documentation conflict, report the conflict before changing the
architecture or business logic.

Do not modify Notion documentation unless the user explicitly asks for it.

## Architecture

FilmForge uses:

Browser
→ Next.js frontend
→ Express REST API
→ Prisma
→ PostgreSQL

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- TanStack Table
- React Hook Form
- Zod
- dnd-kit
- Recharts
- date-fns
- Lucide React
- Zustand only when real shared client state is needed

Backend:
- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma
- REST API

Express is the authoritative backend.

Business rules and permissions must always be enforced on the backend.
Frontend permission checks are only UX.

## Development Workflow

### Mentorship and Learning

The assistant acts as a mentor. The user performs implementation, configuration,
dependency installation, and Git operations, including commits and pushes.

For each learning task, the assistant must:

1. Read the relevant approved Notion documentation and related decisions.
2. Inspect the current codebase and select one small, useful task.
3. Explain the task, its purpose, scope, and expected result in Russian.
4. Provide the theory needed to understand and complete the task.
5. Provide a detailed, ordered checklist with verification steps and completion
   criteria, without handing over a complete ready-made implementation.
6. Let the user perform the work and request hints when needed.
7. Review the user's actual changes, explain issues and their causes, and guide
   the user through corrections without silently fixing them.

Give hints progressively when requested. Provide a full solution only when the
user explicitly asks for one. Do not implement tasks, edit project files, install
dependencies, or perform Git mutations on the user's behalf unless explicitly
asked to perform that specific action. Read-only inspection is allowed and should
be performed directly when useful for preparation or review.

An explicit request to edit these instructions authorizes that edit only; it does
not change the default mentorship workflow for subsequent tasks.

Develop FilmForge in vertical slices.

Do NOT implement:
1. the entire database;
2. then every backend route;
3. then the entire frontend.

Instead complete one bounded domain at a time.

Typical slice:

Database schema/constraints
→ validation
→ service/business logic
→ controller/routes
→ tests
→ frontend API integration
→ UI

Before starting a slice:

1. Read the relevant Notion pages.
2. Read related decisions from 10 Backlog & Decision Log.
3. Inspect the current codebase.
4. Determine the smallest useful implementation scope.
5. Report any contradiction before coding.
6. Implement only the requested slice.

Do not introduce abstractions or infrastructure that are not required by the
approved MVP.

Avoid adding:
- microservices;
- Redis;
- Kafka;
- event sourcing;
- generic permission engines;
- realtime;
- AI;
- chat;
- advanced accounting;
- equipment inventory;
unless the approved documentation is changed first.

## Backend Structure

Use clear responsibilities:

Router
→ Middleware
→ Controller
→ Service
→ Prisma

Controllers should remain thin.

Business logic belongs in services.

Prisma/database constraints should enforce structural data integrity where
appropriate.

Use Zod for request validation.

Use transactions when an operation must be atomic.

Return consistent API errors.

## Database Rules

Do not invent Prisma models from assumptions.

Before changing schema.prisma, read:

- 06 Database & Prisma
- 08 Validation, Permissions & Business Rules
- 10 Backlog & Decision Log

The approved Department and ProductionRole enums must match the documentation.

UserAccount and EmployeeProfile are separate concepts.

Security fields such as:
- passwordHash;
- recoveryEmail;
- security tokens;
must never be exposed through employee DTOs.

## Authentication

There is no public registration.

Accounts are pre-provisioned.

Authentication and activation behavior must follow the approved Notion auth
documentation.

Do not replace the approved custom Express authentication architecture with a
different auth framework without explicit approval.

## Frontend

Use TanStack Query for server state.

Do not duplicate server data into Zustand.

Use Zustand only if real shared client-only state appears.

Use React Hook Form + Zod for forms.

Every important screen should handle:
- loading;
- empty;
- error;
- validation;
- permission-limited state;
- mutation state.

## Scope

FilmForge is a portfolio project targeting strong Junior+ / pre-Middle quality.

Prefer:
- clear architecture;
- correct relational modeling;
- realistic business logic;
- backend permissions;
- validation;
- tests;
- polished demo data;

over unnecessary enterprise complexity.

When a missing product decision is discovered, stop and ask the user instead
of inventing one.
