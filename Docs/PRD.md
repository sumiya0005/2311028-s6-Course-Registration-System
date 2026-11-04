# Product Requirements Document (PRD)

## 1. Project Overview

**Project Name:** UniEnroll — Course Registration System

**Project Type:** Web Application

**Course:** CSE309

UniEnroll is a university course registration web application designed to help students browse available courses, register for courses, and manage their registrations. The system provides separate dashboards and permissions for Students, Faculty, and Administrative Admins. Administrative Admins can manage courses, students, faculty members, and registration records.

## 2. Problem Statement

Managing course information and student registrations manually can be time-consuming and may lead to duplicate entries, inaccurate records, and difficulty tracking available courses. UniEnroll aims to organize these activities through a centralized web application with secure authentication and role-based access.

## 3. Project Objectives

- Provide an organized course catalog.
- Allow students to register for available courses.
- Prevent duplicate course registrations.
- Enable administrative admins to manage courses, students, and faculty.
- Provide separate dashboards for Students, Faculty, and Administrative Admins.
- Implement secure user authentication and role-based access control.
- Maintain accurate student, faculty, course, and registration records.

## 4. Target Users

**Students:**
- Sign up and log in.
- Browse available courses.
- View course details, credits, and prerequisites.
- Register for and drop courses.
- View their registered courses and profile.

**Faculty:**
- Log in using an admin-created account.
- View assigned courses.
- View students registered in their assigned courses.
- View relevant course registration information.

**Administrative Admins:**
- Log in to the administrative dashboard.
- Create, view, update, and delete course records.
- Manage student and faculty accounts.
- Approve or reject student signup requests.
- Manage and monitor course registrations.

## 5. Functional Scope

### Release 1: MVP (Midterm Demo)

- View the course catalog.
- View course details, credits, and prerequisites.
- Create, view, update, and delete course records.
- Create and view course registrations.
- Prevent duplicate registrations.
- Store and retrieve data from a database.
- Provide REST APIs that can be tested locally.

### Release 2: Beta (Final Demo)

**Authentication and User Management**
- Provide a common login system.
- Allow students to sign up.
- Require administrative approval for new student accounts.
- Allow administrative admins to create faculty accounts.
- Provide secure password hashing.
- Implement login and logout functionality.

**Role-Based Access Control**
- Implement three user roles: Student, Faculty, and Administrative Admin.
- Provide separate dashboards based on user roles.
- Restrict frontend routes and backend APIs according to user permissions.

**Student Features**
- View the student dashboard.
- Browse available courses.
- Register for and drop courses.
- View personal registration records.
- View and manage profile information.

**Faculty Features**
- View the faculty dashboard.
- View assigned courses.
- View students registered in assigned courses.
- Access relevant registration information.

**Administrative Admin Features**
- View the administrative dashboard.
- Manage student accounts.
- Approve or reject student signup requests.
- Create and manage faculty accounts.
- Manage course information.
- View and manage course registrations.

**Course Registration Rules**
- Validate seat availability.
- Validate course prerequisites.
- Enforce credit limits and registration rules.
- Prevent duplicate registrations.

**Deployment**
- Deploy the application for demonstration.

## 6. Non-Functional Goals

- Usable and responsive interface.
- Maintainable and modular code.
- Reliable data storage and validation.
- Secure password hashing and credential handling.
- Role-based API protection.
- Proper authentication and authorization.
- Clear API documentation.

## 7. Technology Stack

- Frontend: React with TypeScript
- Backend: FastAPI with Python
- Database: SQLite for initial local development
- API Style: REST
- Authentication: Secure password hashing and token-based authentication
- Version Control: Git and GitHub
- API Testing: Postman
- Deployment: Vercel for frontend demonstration

## 8. Success Criteria

- Users can browse available courses.
- Students can create accounts and log in after approval.
- Faculty can log in using admin-created accounts.
- Administrative Admins can manage students, faculty, courses, and registrations.
- Each user role can access its respective dashboard.
- Unauthorized users cannot access restricted features.
- Valid registrations are saved successfully.
- Duplicate registrations are rejected.
- Authentication and role-based permissions work correctly.
- Application APIs can be tested using Postman.
- The application is deployed and can be demonstrated.

## 9. Out of Scope

The project does not include payment processing, university ERP integration, automatic timetable optimization, or native mobile applications.

## 10. Risks and Limitations

Limited development time may affect the number of completed features. Therefore, core authentication, role-based access, and dashboard functionality will be prioritized during Beta. Advanced features may be implemented depending on the available development time.

## 11. User Stories

### Student
- As a student, I want to sign up so that I can create an account.
- As a student, I want my account to be approved by an admin so that only authorized students can access the system.
- As a student, I want to log in so that I can access my dashboard.
- As a student, I want to browse available courses so that I can find suitable courses.
- As a student, I want to view course details, credits, and prerequisites so that I can make informed registration decisions.
- As a student, I want to register for courses so that I can enroll in my desired courses.
- As a student, I want to view and manage my registrations so that I can track my enrolled courses.

### Faculty
- As a faculty member, I want to log in so that I can access my faculty dashboard.
- As a faculty member, I want to view my assigned courses so that I can monitor my teaching responsibilities.
- As a faculty member, I want to view students registered in my courses so that I can monitor enrollment.

### Administrative Admin
- As an administrative admin, I want to log in so that I can access the administrative dashboard.
- As an administrative admin, I want to approve or reject student signup requests so that I can control student access.
- As an administrative admin, I want to create and manage faculty accounts so that faculty members can access the system.
- As an administrative admin, I want to create new courses so that students can see available courses.
- As an administrative admin, I want to view all course records so that I can monitor course information.
- As an administrative admin, I want to update course information so that the catalog remains accurate.
- As an administrative admin, I want to delete course records so that outdated courses can be removed.
- As an administrative admin, I want to manage student and faculty records so that user information remains accurate.
- As an administrative admin, I want to monitor registrations so that I can manage enrollment records.

## 12. Project Milestones

### Milestone 1: Project Planning and Documentation
- Finalize the project idea and requirements.
- Prepare the Product Requirements Document (PRD).
- Prepare the Software Requirements Specification (SRS).
- Prepare the Technical Design Document (TDD).

### Milestone 2: MVP Development (Midterm)
- Develop the frontend using React and TypeScript.
- Develop REST APIs using FastAPI.
- Implement CRUD operations for courses.
- Implement course registration functionality.
- Integrate the database with the application.
- Test and demonstrate the MVP locally.

### Milestone 3: Beta Development (Final)
- Implement user authentication and logout.
- Implement secure password hashing.
- Add Student, Faculty, and Administrative Admin roles.
- Implement role-based access control.
- Implement student signup and admin approval.
- Implement admin-created faculty accounts.
- Develop separate dashboards for all three user roles.
- Implement student, faculty, and course management.
- Implement course registration and drop functionality.
- Add prerequisite, seat availability, and credit limit validation.
- Protect APIs and frontend routes according to user roles.

### Milestone 4: Testing and Final Demonstration
- Test authentication and authorization.
- Test APIs using Postman.
- Test frontend and backend functionality.
- Verify role-based dashboard access.
- Fix identified bugs and errors.
- Complete application integration.
- Deploy the application for demonstration.
- Prepare the final project demonstration.