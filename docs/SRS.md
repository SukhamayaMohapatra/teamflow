# Software Requirements Specification – TeamFlow

## 1. Scope
A web application for project and task management with Admin/Team Lead and Developer/Team Member roles.

## 2. Functional requirements
Authentication and RBAC; project creation/editing/viewing and membership; task creation/assignment/priority/deadline/status/progress; role-scoped access; dashboard metrics and project progress.

## 3. Business rules
Priorities: HIGH, MEDIUM, LOW. Task statuses: TODO, IN_PROGRESS, UNDER_REVIEW, COMPLETED. A completed task has 100% progress. Developers can update only their assigned task status/progress. Admin-only project/task creation and assignment.

## 4. Data requirements
Users: name, unique email, password hash, role, active flag. Projects: name, description, status, owner, members, dates. Tasks: title, description, project, assignee, creator, priority, status, progress, due date. TaskUpdates: task, author, message, previous/new status, progress and timestamps.

## 5. Non-functional requirements
HTTPS, HttpOnly cookies, password hashing, JWT validation, server-side role checks, schema validation, database indexes, structured logging, responsive layouts and centralised error handling.

## 6. Assumptions and acceptance
MongoDB Atlas is the database; Next.js replaces the Vite frontend specified in the assignment at the candidate's request. Project statuses are proposed. Acceptance requires both roles to work, CRUD and updates to persist, dashboard figures to reflect database state, and deployment/local setup documentation.
