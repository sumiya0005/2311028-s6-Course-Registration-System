Software Requirements Specification (SRS)

1. Introduction

1.1 Purpose

This document specifies the functional and non-functional requirements of UniEnroll, a Course Registration System developed for the CSE309 project.

1.2 Scope

The system provides course management and student course registration through a web interface and REST APIs. The project will be developed in two releases: MVP and Beta.

1.3 Intended Users

- Students
- Administrators
- Developers and project evaluators

2. Overall Description

2.1 Product Perspective

UniEnroll consists of a React frontend, a FastAPI backend, and a relational database. The frontend communicates with the backend through REST APIs.

2.2 User Classes

Student: Browses courses, registers for courses, views registrations, and manages their own course selections.

Administrator: Manages course records and accesses registration information according to assigned permissions.

2.3 Assumptions and Constraints

- The application will initially run locally.
- The frontend must use React and TypeScript.
- The backend must use FastAPI and Python.
- A relational database will store courses and registrations.
- Authentication and role-based authorization will be introduced in Beta.

3. Functional Requirements

MVP Requirements

FR-01: View Courses
The system shall allow users to retrieve and view the available course catalog.

FR-02: View Course Details
The system shall display course code, title, credits, description, and prerequisites where available.

FR-03: Manage Courses
The system shall provide APIs to create, retrieve, update, and delete course records.

FR-04: Register for a Course
The system shall allow a student registration record to be created for a selected course.

FR-05: Prevent Duplicate Registration
The system shall reject a registration when the same student is already registered for the same course.

FR-06: View Registrations
The system shall allow registration records to be retrieved and displayed.

FR-07: Validate Input
The system shall validate required fields and return appropriate error responses for invalid requests.

Beta Requirements

FR-08: Authentication
The system shall allow users to log in and log out securely.

FR-09: Role-Based Access Control
The system shall distinguish student and administrator permissions.

FR-10: Student Dashboard
The system shall display the authenticated student's profile and registered courses.

FR-11: Course Add/Drop
The system shall allow students to register for or drop courses according to registration rules.

FR-12: Registration Validation
The system shall validate seat availability, prerequisites, and applicable credit limits.

FR-13: API Authorization
The system shall restrict protected operations to authorized users.

4. Non-Functional Requirements

NFR-01: Usability
The interface shall provide clear navigation and understandable feedback.

NFR-02: Maintainability
The source code shall be organized into separate frontend, backend, and documentation directories.

NFR-03: Reliability
The system shall handle invalid input and common API errors without crashing.

NFR-04: Data Integrity
The database shall enforce appropriate primary keys, foreign keys, and uniqueness constraints.

NFR-05: Security
Beta shall use secure password hashing, protected endpoints, input validation, and server-side authorization.

NFR-06: Compatibility
The web application shall support modern browsers.

NFR-07: Documentation
FastAPI endpoints shall have accessible API documentation during development.

5. External Interface Requirements

5.1 User Interface

The frontend shall include a course listing page, course details view, registration interface, and registration list. The Beta release shall add login and student dashboard interfaces.

5.2 Software Interface

- Frontend to backend: HTTP REST APIs using JSON.
- Backend to database: Database driver or ORM.
- API testing: FastAPI Swagger UI.

6. Data Requirements

The system shall maintain the following core entities:

- Student: Student identifier and profile information.
- Course: Course identifier, code, title, credits, prerequisites, and capacity where applicable.
- Registration: Registration identifier, student reference, course reference, and registration status.

Beta shall additionally maintain user credentials and role information.

7. Acceptance Criteria

- The course catalog can be retrieved successfully.
- Course CRUD operations work through the backend APIs.
- A valid registration is stored in the database.
- Duplicate registration attempts are rejected.
- Invalid requests return appropriate error responses.
- Beta authentication and authorization are tested before the final demo.

8. Release Plan

MVP: Course catalog, course CRUD, registration APIs, database integration, and local execution.

Beta: Authentication, RBAC, dashboard, add/drop, advanced registration validation, API permissions, and deployment.


9. Use Cases

UC-01: View Course Catalog
- Actor: Student
- Description: The student views the list of available courses.
- Main Flow:
  1. The student opens the course catalog.
  2. The system retrieves available courses.
  3. The system displays the course list.

UC-02: Manage Courses
- Actor: Administrator
- Description: The administrator manages course information.
- Main Flow:
  1. The administrator selects a course management operation.
  2. The administrator creates, views, updates, or deletes a course.
  3. The system validates the information.
  4. The system saves the changes and returns a response.

UC-03: Register for a Course
- Actor: Student
- Description: The student registers for a selected course.
- Main Flow:
  1. The student selects a course.
  2. The system checks for duplicate registration.
  3. The system creates the registration record.
  4. The system confirms successful registration.
- Alternative Flow:
  - If the student is already registered for the course, the system rejects the request.

UC-04: View Registrations
- Actor: Student / Administrator
- Description: Users view course registration records.
- Main Flow:
  1. The user opens the registration list.
  2. The system retrieves the registration records.
  3. The system displays the available records.

UC-05: User Login (Beta)
- Actor: Student / Administrator
- Description: Users securely log in to the system.
- Main Flow:
  1. The user enters login credentials.
  2. The system verifies the credentials.
  3. The system grants access according to the user's role.

UC-06: Drop a Course (Beta)
- Actor: Student
- Description: The student drops a previously registered course.
- Main Flow:
  1. The student selects a registered course.
  2. The student requests to drop the course.
  3. The system processes the request according to registration rules.
  4. The system updates the registration status.

