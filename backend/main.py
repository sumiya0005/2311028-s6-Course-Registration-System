
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import sqlite3

from database import create_tables, get_connection

app = FastAPI(title="UniEnroll Course Registration System")

# Create database tables
create_tables()


# Course input model
class CourseCreate(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    credits: float = Field(gt=0)
    prerequisites: Optional[str] = None
    capacity: int = Field(ge=1)


# Course update model
class CourseUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[float] = Field(default=None, gt=0)
    prerequisites: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/hello")
def hello(name: str = "World"):
    return {"message": f"Hello, {name}!"}


# CREATE: Add a new course
@app.post("/api/courses", status_code=201)
def create_course(course: CourseCreate):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO courses
            (code, title, description, credits, prerequisites, capacity)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                course.code,
                course.title,
                course.description,
                course.credits,
                course.prerequisites,
                course.capacity
            )
        )

        connection.commit()
        course_id = cursor.lastrowid

        return {
            "message": "Course created successfully",
            "id": course_id
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Course code already exists"
        )

    finally:
        connection.close()


# READ: Get all courses
@app.get("/api/courses")
def get_courses():
    connection = get_connection()

    try:
        courses = connection.execute(
            "SELECT * FROM courses ORDER BY id"
        ).fetchall()

        return [dict(course) for course in courses]

    finally:
        connection.close()


# READ: Get one course by ID
@app.get("/api/courses/{course_id}")
def get_course(course_id: int):
    connection = get_connection()

    try:
        course = connection.execute(
            "SELECT * FROM courses WHERE id = ?",
            (course_id,)
        ).fetchone()

        if course is None:
            raise HTTPException(
                status_code=404,
                detail="Course not found"
            )

        return dict(course)

    finally:
        connection.close()


# UPDATE: Update an existing course
@app.put("/api/courses/{course_id}")
def update_course(course_id: int, course: CourseUpdate):
    connection = get_connection()

    try:
        existing = connection.execute(
            "SELECT * FROM courses WHERE id = ?",
            (course_id,)
        ).fetchone()

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="Course not found"
            )

        updates = course.model_dump(exclude_unset=True)

        if not updates:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update"
            )

        fields = ", ".join(
            f"{field} = ?" for field in updates
        )

        values = list(updates.values())
        values.append(course_id)

        connection.execute(
            f"UPDATE courses SET {fields} WHERE id = ?",
            values
        )

        connection.commit()

        return {"message": "Course updated successfully"}

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Course code already exists"
        )

    finally:
        connection.close()


# DELETE: Delete a course
@app.delete("/api/courses/{course_id}")
def delete_course(course_id: int):
    connection = get_connection()

    try:
        existing = connection.execute(
            "SELECT * FROM courses WHERE id = ?",
            (course_id,)
        ).fetchone()

        if existing is None:
            raise HTTPException(
                status_code=404,
                detail="Course not found"
            )

        connection.execute(
            "DELETE FROM courses WHERE id = ?",
            (course_id,)
        )

        connection.commit()

        return {"message": "Course deleted successfully"}

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a course with existing registrations"
        )

    finally:
        connection.close()

        
# ==========================================
# STUDENT AND COURSE REGISTRATION APIs
# ==========================================

# Student input model
class StudentCreate(BaseModel):
    student_id: str
    name: str
    email: str


# Registration input model
class RegistrationCreate(BaseModel):
    student_id: int
    course_id: int


# CREATE: Add a new student
@app.post("/api/students", status_code=201)
def create_student(student: StudentCreate):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO students (student_id, name, email)
            VALUES (?, ?, ?)
            """,
            (student.student_id, student.name, student.email)
        )

        connection.commit()

        return {
            "message": "Student created successfully",
            "id": cursor.lastrowid
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Student ID or email already exists"
        )

    finally:
        connection.close()


# READ: Get all students
@app.get("/api/students")
def get_students():
    connection = get_connection()

    try:
        students = connection.execute(
            "SELECT * FROM students ORDER BY id"
        ).fetchall()

        return [dict(student) for student in students]

    finally:
        connection.close()


# CREATE: Register a student in a course
@app.post("/api/registrations", status_code=201)
def create_registration(registration: RegistrationCreate):
    connection = get_connection()

    try:
        # Check whether student exists
        student = connection.execute(
            "SELECT * FROM students WHERE id = ?",
            (registration.student_id,)
        ).fetchone()

        if student is None:
            raise HTTPException(
                status_code=404,
                detail="Student not found"
            )

        # Check whether course exists
        course = connection.execute(
            "SELECT * FROM courses WHERE id = ?",
            (registration.course_id,)
        ).fetchone()

        if course is None:
            raise HTTPException(
                status_code=404,
                detail="Course not found"
            )

        # Prevent duplicate registration
        existing = connection.execute(
            """
            SELECT id FROM registrations
            WHERE student_id = ? AND course_id = ?
            """,
            (registration.student_id, registration.course_id)
        ).fetchone()

        if existing is not None:
            raise HTTPException(
                status_code=409,
                detail="Student is already registered in this course"
            )

        # Check course capacity
        registered_count = connection.execute(
            """
            SELECT COUNT(*) AS total
            FROM registrations
            WHERE course_id = ?
            """,
            (registration.course_id,)
        ).fetchone()["total"]

        if registered_count >= course["capacity"]:
            raise HTTPException(
                status_code=409,
                detail="Course capacity is full"
            )

        # Save registration
        cursor = connection.execute(
            """
            INSERT INTO registrations (student_id, course_id)
            VALUES (?, ?)
            """,
            (registration.student_id, registration.course_id)
        )

        connection.commit()

        return {
            "message": "Course registration successful",
            "registration_id": cursor.lastrowid
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Registration could not be completed"
        )

    finally:
        connection.close()


# READ: Get all course registrations
@app.get("/api/registrations")
def get_registrations():
    connection = get_connection()

    try:
        registrations = connection.execute(
            """
            SELECT
                registrations.id,
                students.id AS student_id,
                students.student_id AS student_number,
                students.name AS student_name,
                courses.id AS course_id,
                courses.code AS course_code,
                courses.title AS course_title,
                registrations.status,
                registrations.created_at
            FROM registrations
            JOIN students
                ON registrations.student_id = students.id
            JOIN courses
                ON registrations.course_id = courses.id
            ORDER BY registrations.id
            """
        ).fetchall()

        return [dict(registration) for registration in registrations]

    finally:
        connection.close()

