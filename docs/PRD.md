# Product Requirements Document – TeamFlow

## Product overview
TeamFlow is a web-based Project & Task Management System for organisations to manage projects, assign tasks, track progress and deadlines, and review project performance.

## Users
- Admin / Team Lead: create and manage projects, assign tasks, monitor progress/deadlines and view performance.
- Developer / Team Member: view assigned projects/tasks, update status/progress and add task updates.

## Functional scope
1. Authentication: secure login, JWT authentication and role-based authorisation.
2. Projects: create, edit and view projects; associate team members.
3. Tasks: create tasks under projects, assign developers, set High/Medium/Low priority, deadlines, descriptions and progress updates; statuses To Do, In Progress, Under Review and Completed.
4. Dashboard: active projects, assigned tasks, completed/pending/overdue tasks, project-wise completion and overall progress.
5. Backend: REST APIs, database relationships, validation, error handling and modular code.

## Business rules
- Each task belongs to one project and one assignee.
- Only Admins create projects and assign tasks.
- Developers update only their own assigned tasks.
- Completed tasks are not overdue.
- Project progress = completed tasks / total tasks × 100; projects without tasks show 0%.
- Store dates in UTC and display in the user's locale.

## Non-functional requirements
Security, server-side validation, maintainability, responsiveness, efficient queries, logging and reliable deployment.

## Technical decisions
Next.js App Router + React + Material UI; Express REST API; MongoDB Atlas + Mongoose; JWT in HttpOnly cookies; Vercel frontend; Render backend; GitHub Actions CI.

## Acceptance criteria
Both roles work; protected endpoints enforce permissions; projects and tasks persist; dashboard metrics reflect database state; application runs locally and in deployed environments; API, README, SRS and execution plan are provided.

## Assumptions
Project lifecycle statuses (Planning, Active, On Hold, Completed, Cancelled), team membership and detailed dashboard calculations are implementation assumptions because the assignment does not specify them.
