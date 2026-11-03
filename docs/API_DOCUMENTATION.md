# API Documentation

Base URL: `/api/v1`. All successful responses use `{ success: true, data: ... }`. Errors use `{ success: false, message: ... }`.

Authentication uses an HttpOnly `accessToken` cookie set by `POST /auth/login`. Browser requests must send credentials.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate with email/password |
| POST | `/auth/logout` | Authenticated | Clear session cookie |
| GET | `/auth/me` | Authenticated | Current user |
| POST | `/users` | Admin | Create user |
| GET | `/users` | Admin | List active users |
| GET | `/projects` | Authenticated | List projects visible to caller |
| POST | `/projects` | Admin | Create project |
| GET | `/projects/:id` | Authorised member/Admin | Project details |
| PATCH | `/projects/:id` | Admin | Update project |
| DELETE | `/projects/:id` | Admin | Delete project if it has no tasks |
| GET | `/tasks` | Authenticated | List tasks; developers see assigned tasks |
| POST | `/tasks` | Admin | Create task |
| GET | `/tasks/:id` | Authorised assignee/Admin | Task details |
| PATCH | `/tasks/:id` | Admin or assignee | Update allowed task fields |
| POST | `/tasks/:id/updates` | Admin or assignee | Add task update |
| GET | `/dashboard/summary` | Authenticated | Role-scoped dashboard metrics |

## Example login request
```json
{ "email": "lead@example.com", "password": "your-password" }
```

## Example task creation request
```json
{
  "title": "Build project dashboard",
  "description": "Create dashboard cards and progress summary",
  "project": "PROJECT_OBJECT_ID",
  "assignedTo": "USER_OBJECT_ID",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2026-11-20T17:00:00.000Z"
}
```

## Example developer update
```json
{ "status": "IN_PROGRESS", "progress": 35, "message": "Initial implementation completed" }
```

Use Postman with cookie persistence enabled. Replace IDs with actual MongoDB ObjectIds.
