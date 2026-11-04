# Technical Design Document (TDD)

## 1. Introduction

### 1.1 Purpose

This document describes the technical architecture, software components, database design, REST API structure, security design, and implementation strategy for UniEnroll, a Course Registration System.

### 1.2 Technology Stack

- Frontend: React and TypeScript
- Backend: FastAPI and Python
- Database: SQLite for local development
- Data Communication: REST APIs and JSON
- Authentication: Token-based authentication (JWT)
- Password Security: Secure password hashing
- Version Control: Git and GitHub
- API Testing: FastAPI Swagger UI and Postman
- Beta Database: PostgreSQL may be used for deployment.

## 2. System Architecture

The system follows a three-layer architecture.

### 2.1 Presentation Layer

The React frontend provides the user interface for browsing courses, viewing course details, managing registrations, and accessing role-specific dashboards.

The frontend includes:
- Common Login Page
- Student Signup Page
- Student Dashboard
- Faculty Dashboard
- Administrative Admin Dashboard
- Course and Registration Management interfaces

TypeScript provides static type checking.

### 2.2 Application Layer

FastAPI handles HTTP requests, validates incoming data, authenticates users, enforces role-based permissions, applies business rules, communicates with the database, and returns JSON responses.

### 2.3 Data Layer

The relational database stores user accounts, student records, faculty records, course information, and registration records.

### 2.4 Data Flow

1. A user interacts with the React interface.
2. The frontend sends an HTTP request to the FastAPI backend.
3. FastAPI validates the request and authenticates the user when required.
4. The backend checks the user's role and permissions.
5. The backend executes the required business logic.
6. The database is accessed or updated.
7. FastAPI returns a JSON response.
8. The frontend displays the result.

## 3. Proposed Project Structure

The existing project structure will be maintained during the initial implementation.

```text
unienroll/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   └── unienroll.db
├── Docs/
│   ├── PRD.md
│   ├── SRS.md
│   └── TDD.md
├── .gitignore
└── README.md
```

As the application grows, authentication and business logic may be separated into additional modules.

## 4. Database Design

### 4.1 User

| Field | Description |
|---|---|
| id | Primary key |
| name | User name |
| email | Unique email address |
| password_hash | Hashed password |
| role | Student, Faculty, or Admin |
| status | Pending, Active, or Rejected |
| created_at | Account creation timestamp |

The User entity will store authentication information and the assigned role.

### 4.2 Student

| Field | Description |
|---|---|
| id | Primary key |
| user_id | Foreign key referencing User |
| student_id | Unique student identifier |
| name | Student name |
| email | Student email |

### 4.3 Faculty

| Field | Description |
|---|---|
| id | Primary key |
| user_id | Foreign key referencing User |
| faculty_id | Unique faculty identifier |
| name | Faculty name |
| email | Faculty email |

### 4.4 Course

| Field | Description |
|---|---|
| id | Primary key |
| code | Unique course code |
| title | Course title |
| description | Course description |
| credits | Course credit value |
| prerequisites | Prerequisite information |
| capacity | Maximum enrollment |
| faculty_id | Assigned faculty reference, when applicable |

### 4.5 Registration

| Field | Description |
|---|---|
| id | Primary key |
| student_id | Foreign key referencing Student |
| course_id | Foreign key referencing Course |
| status | Registration status |
| created_at | Registration timestamp |

A unique constraint on the combination of student and course identifiers shall prevent duplicate registrations.

### 4.6 Relationships

- One User account belongs to one role.
- A Student profile is linked to a User account.
- A Faculty profile is linked to a User account.
- One Faculty member may be assigned multiple courses.
- One Student may register for multiple courses.
- One Course may have multiple student registrations.

## 5. REST API Design

Base URL for local development:

`http://localhost:8000/api`

### 5.1 Course APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/courses` | List courses |
| GET | `/courses/{course_id}` | Retrieve course details |
| POST | `/courses` | Create a course |
| PUT | `/courses/{course_id}` | Update a course |
| DELETE | `/courses/{course_id}` | Delete a course |

Course creation, update, and deletion shall require Administrative Admin permission in Beta.

### 5.2 Student APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/students` | Create a student record |
| GET | `/students` | List students |
| GET | `/students/me` | Retrieve own student profile |
| GET | `/students/me/registrations` | View own registrations |

Administrative Admins shall manage student records. Students shall only access their own profile and registrations.

### 5.3 Registration APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/registrations` | Create a registration |
| GET | `/registrations` | List registration records |
| GET | `/registrations/{registration_id}` | Retrieve a registration |
| DELETE | `/registrations/{registration_id}` | Drop or remove an authorized registration |

Students shall only register for or drop their own courses. Administrative Admins may manage all registration records. Faculty members may view registrations for their assigned courses.

### 5.4 Authentication APIs (Beta)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/signup` | Student signup |
| POST | `/auth/login` | Authenticate a user |
| POST | `/auth/logout` | Log out |
| GET | `/auth/me` | Retrieve current user information |

New student accounts shall receive Pending status after signup.

### 5.5 Administrative Admin APIs (Beta)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/students/pending` | View pending student accounts |
| PATCH | `/admin/students/{user_id}/approve` | Approve student account |
| PATCH | `/admin/students/{user_id}/reject` | Reject student account |
| GET | `/admin/students` | Manage student records |
| POST | `/admin/faculty` | Create faculty account |
| GET | `/admin/faculty` | List faculty members |
| PUT | `/admin/faculty/{faculty_id}` | Update faculty information |
| DELETE | `/admin/faculty/{faculty_id}` | Delete faculty account |

All administrative endpoints shall require Administrative Admin permissions.

### 5.6 Faculty APIs (Beta)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/faculty/me/courses` | View assigned courses |
| GET | `/faculty/me/students` | View students in assigned courses |

Faculty members shall only access information related to their assigned courses.

## 6. Request and Response Handling

The backend shall use Pydantic schemas to validate incoming request data and structure API responses.

Common HTTP status codes:

- `200 OK`: Successful retrieval or update.
- `201 Created`: Resource created successfully.
- `204 No Content`: Resource deleted successfully.
- `400 Bad Request`: Invalid operation or business rule violation.
- `401 Unauthorized`: Authentication required or invalid credentials.
- `403 Forbidden`: Insufficient permissions or account not approved.
- `404 Not Found`: Requested resource does not exist.
- `409 Conflict`: Duplicate registration or conflicting data.
- `422 Unprocessable Entity`: Request validation failed.

## 7. Security Design

### 7.1 Password Security

- Passwords shall never be stored as plain text.
- A secure password-hashing algorithm shall be used.
- Password verification shall be performed by the backend.

### 7.2 Authentication

- JWT-based token authentication shall be used.
- Protected API requests shall include a valid authentication token.
- Tokens shall be validated by the backend before granting access.

### 7.3 Role-Based Access Control

The system shall support three roles:

**Student**
- Access student dashboard.
- Browse available courses.
- Manage own registrations.
- View own profile.

**Faculty**
- Access faculty dashboard.
- View assigned courses.
- View students registered in assigned courses.

**Administrative Admin**
- Access administrative dashboard.
- Manage students and faculty.
- Approve or reject student signup requests.
- Manage courses and registrations.

### 7.4 Account Management

- Student signup shall create an account with Pending status.
- Only an Administrative Admin can approve or reject a pending student account.
- Faculty accounts shall be created by an Administrative Admin.
- Administrative Admin accounts shall be initialized through a secure setup process, not public signup.

### 7.5 Additional Security

- Enforce permissions on the backend rather than relying on frontend visibility.
- Restrict students to their own profile and registration records.
- Configure CORS for approved frontend origins.
- Use HTTPS and secure secret management in deployment.
- Keep passwords, tokens, and secrets out of version control.

## 8. Error Handling

The backend shall return consistent error responses for invalid input, missing resources, authentication failures, authorization failures, and registration conflicts.

The frontend shall display understandable error messages instead of failing silently.

## 9. Testing Strategy

### MVP Testing

- Test course CRUD endpoints.
- Test valid and invalid registration requests.
- Test duplicate registration prevention.
- Test database relationships and constraints.
- Verify frontend-to-backend communication.

### Beta Testing

- Test student signup.
- Test login and logout.
- Test password hashing and verification.
- Test student account approval and rejection.
- Test faculty account creation.
- Verify Student, Faculty, and Administrative Admin permissions.
- Test unauthorized API access.
- Verify each role-specific dashboard.
- Test course capacity, prerequisites, and credit limits.
- Test APIs using Postman.
- Test deployment configuration and production API connectivity.

## 10. Implementation Plan

### MVP Phase

1. Set up the React and TypeScript frontend.
2. Set up FastAPI and the database.
3. Implement course management APIs.
4. Implement registration APIs and validation.
5. Connect the frontend to the backend.
6. Test and demonstrate the application locally.

### Beta Phase

1. Design the User, Student, and Faculty database entities.
2. Implement password hashing and authentication.
3. Implement student signup and account approval.
4. Implement faculty account management.
5. Add role-based access control.
6. Build Student, Faculty, and Administrative Admin dashboards.
7. Implement course add/drop and advanced validation.
8. Strengthen security and automated testing.
9. Deploy and test the application.

## 11. Design Limitations

The initial architecture is intended for an academic demonstration. Features such as real-time seat locking, university ERP integration, large-scale concurrency handling, and timetable optimization are outside the initial scope.