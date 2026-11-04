
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
