# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements of UniEnroll, a Course Registration System developed for the CSE309 project.

### 1.2 Scope

The system provides course management and student course registration through a web interface and REST APIs. It supports three user roles: Student, Faculty, and Administrative Admin. The project will be developed in two releases: MVP and Beta.

### 1.3 Intended Users

- Students
- Faculty Members
- Administrative Admins
- Developers and project evaluators

## 2. Overall Description

### 2.1 Product Perspective

UniEnroll consists of a React frontend, a FastAPI backend, and a relational database. The frontend communicates with the backend through REST APIs.

### 2.2 User Classes

**Student:**
- Signs up and logs in.
- Browses available courses.
- Registers for and drops courses.
- Views personal registrations and profile information.

**Faculty:**
- Logs in using an account created by an Administrative Admin.
- Views assigned courses.
- Views students registered in assigned courses.

**Administrative Admin:**
- Logs in to the administrative dashboard.
- Manages student and faculty accounts.
- Approves or rejects student signup requests.
- Creates, views, updates, and deletes course records.
- Monitors and manages course registrations.

### 2.3 Assumptions and Constraints

- The application will initially run locally.
- The frontend must use React and TypeScript.
- The backend must use FastAPI and Python.
- A relational database will store users, courses, and registrations.
- Authentication and role-based authorization will be implemented in Beta.
- Each user will have one assigned role.
- Faculty accounts will be created by an Administrative Admin.
- New student accounts must be approved by an Administrative Admin before accessing protected features.

## 3. Functional Requirements

### MVP Requirements

**FR-01: View Courses**

The system shall allow users to retrieve and view the available course catalog.

**FR-02: View Course Details**

The system shall display course code, title, credits, description, and prerequisites where available.

**FR-03: Manage Courses**

The system shall provide APIs to create, retrieve, update, and delete course records.

**FR-04: Register for a Course**

The system shall allow a student registration record to be created for a selected course.

**FR-05: Prevent Duplicate Registration**

The system shall reject a registration when the same student is already registered for the same course.

**FR-06: View Registrations**

The system shall allow registration records to be retrieved and displayed.

**FR-07: Validate Input**

The system shall validate required fields and return appropriate error responses for invalid requests.

### Beta Requirements

**FR-08: User Authentication**

The system shall allow users to log in and log out securely.

**FR-09: Student Signup**

The system shall allow students to create new accounts.

**FR-10: Student Account Approval**

The system shall require Administrative Admin approval before newly registered students can access protected system features.

**FR-11: Faculty Account Management**

The system shall allow Administrative Admins to create and manage faculty accounts.

**FR-12: Role-Based Access Control**

The system shall distinguish Student, Faculty, and Administrative Admin permissions.

**FR-13: Student Dashboard**

The system shall display the authenticated student's profile, available courses, and registered courses.

**FR-14: Faculty Dashboard**

The system shall display assigned courses and relevant student registration information to authenticated faculty members.

**FR-15: Administrative Admin Dashboard**

The system shall allow Administrative Admins to manage students, faculty members, courses, and registrations.

**FR-16: Course Add/Drop**

The system shall allow students to register for or drop courses according to registration rules.

**FR-17: Registration Validation**

The system shall validate seat availability, prerequisites, and applicable credit limits.

**FR-18: API Authorization**

The system shall restrict protected operations to authorized users according to their roles.

**FR-19: Password Security**

The system shall store passwords using secure password hashing rather than storing plain-text passwords.

**FR-20: Profile Management**

The system shall allow authenticated users to view their profile information.

## 4. Non-Functional Requirements

**NFR-01: Usability**

The interface shall provide clear navigation and understandable feedback.

**NFR-02: Maintainability**

The source code shall be organized into separate frontend, backend, and documentation directories.

**NFR-03: Reliability**

The system shall handle invalid input and common API errors without crashing.

**NFR-04: Data Integrity**

The database shall enforce appropriate primary keys, foreign keys, and uniqueness constraints.

**NFR-05: Security**

Beta shall use secure password hashing, protected endpoints, input validation, authentication, and server-side authorization.

**NFR-06: Compatibility**

The web application shall support modern browsers.

**NFR-07: Documentation**

FastAPI endpoints shall have accessible API documentation during development.

**NFR-08: Access Control**

Users shall only access features and data permitted by their assigned roles.

## 5. External Interface Requirements

### 5.1 User Interface

The frontend shall include:

- Course listing page.
- Course details view.
- Registration