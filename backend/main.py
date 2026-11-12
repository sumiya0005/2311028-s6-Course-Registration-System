
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
import sqlite3

from database import create_tables, get_connection
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token
)

app = FastAPI(title="UniEnroll Course Registration System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://2311028-s6-e3fw6aiz2-hoquesumiya40-8832.vercel.app",
    "http://localhost:5173"
],
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
create_tables()
security = HTTPBearer()


# ==========================================
# MODELS
# ==========================================

class StudentSignup(BaseModel):
    student_id: str
    name: str
    email: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class FacultyCreate(BaseModel):
    faculty_code: str
    name: str
    email: str
    password: str = Field(min_length=8)
    department: Optional[str] = None


class CourseCreate(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    credits: float = Field(gt=0)
    prerequisites: Optional[str] = None
    capacity: int = Field(ge=1)
    faculty_id: Optional[int] = None


class CourseUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[float] = Field(default=None, gt=0)
    prerequisites: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    faculty_id: Optional[int] = None


class StudentCreate(BaseModel):
    student_id: str
    name: str
    email: str


class RegistrationCreate(BaseModel):
    student_id: int
    course_id: int


# ==========================================
# AUTHENTICATION
# ==========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    payload = decode_access_token(credentials.credentials)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    connection = get_connection()

    try:
        user = connection.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()

        if user is None or user["is_active"] != 1:
            raise HTTPException(
                status_code=401,
                detail="User account is inactive or not found"
            )

        return dict(user)

    finally:
        connection.close()


def require_role(*allowed_roles):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action"
            )
        return current_user

    return role_checker


# ==========================================
# SIGNUP
# ==========================================

@app.post("/auth/signup", status_code=201)
def student_signup(student: StudentSignup):
    connection = get_connection()

    try:
        existing = connection.execute(
            """
            SELECT id FROM users WHERE email = ?
            UNION
            SELECT id FROM students WHERE student_id = ? OR email = ?
            """,
            (student.email, student.student_id, student.email)
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Email or Student ID already exists"
            )

        cursor = connection.execute(
            """
            INSERT INTO users (email, password_hash, role, is_active)
            VALUES (?, ?, 'student', 1)
            """,
            (student.email, get_password_hash(student.password))
        )

        connection.execute(
            """
            INSERT INTO students (student_id, name, email, user_id)
            VALUES (?, ?, ?, ?)
            """,
            (student.student_id, student.name, student.email, cursor.lastrowid)
        )

        connection.commit()

        return {
            "message": "Signup successful. You can now log in."
        }

    except sqlite3.IntegrityError:
        connection.rollback()
        raise HTTPException(status_code=409, detail="Student already exists")

    finally:
        connection.close()


# ==========================================
# LOGIN
# ==========================================

@app.post("/auth/login")
def login(user: LoginRequest):
    connection = get_connection()

    try:
        account = connection.execute(
            "SELECT * FROM users WHERE email = ?", (user.email,)
        ).fetchone()

        if account is None or not verify_password(
            user.password, account["password_hash"]
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # Existing student accounts created before approval was removed may
        # still be pending (is_active=0). Activate them on their first login.
        # Rejected/disabled accounts (is_active=-1) remain blocked.
        if account["role"] == "student" and account["is_active"] == 0:
            connection.execute(
                "UPDATE users SET is_active = 1 WHERE id = ?",
                (account["id"],)
            )
            connection.commit()
            account = connection.execute(
                "SELECT * FROM users WHERE id = ?", (account["id"],)
            ).fetchone()

        if account["is_active"] != 1:
            raise HTTPException(
                status_code=403,
                detail="Your account has been rejected or disabled"
            )

        token = create_access_token({
            "sub": str(account["id"]),
            "role": account["role"]
        })

        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "role": account["role"]
        }

    finally:
        connection.close()


@app.get("/auth/me")
def get_my_account(
    current_user: dict = Depends(get_current_user)
):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"]
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/hello")
def hello(name: str = "World"):
    return {"message": f"Hello, {name}!"}


# ==========================================
# ADMIN: STUDENT APPROVAL
# ==========================================

@app.get("/api/admin/students/pending")
def get_pending_students(
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        students = connection.execute(
            """
            SELECT s.id, s.student_id, s.name, s.email, u.created_at
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE u.is_active = 0
            ORDER BY s.id
            """
        ).fetchall()

        return [dict(student) for student in students]

    finally:
        connection.close()


@app.put("/api/admin/students/{student_id}/approve")
def approve_student(
    student_id: int,
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            UPDATE users
            SET is_active = 1
            WHERE id = (
                SELECT user_id FROM students WHERE id = ?
            ) AND is_active = 0
            """,
            (student_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Pending student not found"
            )

        return {"message": "Student approved successfully"}

    finally:
        connection.close()


@app.put("/api/admin/students/{student_id}/reject")
def reject_student(
    student_id: int,
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            UPDATE users
            SET is_active = -1
            WHERE id = (
                SELECT user_id FROM students WHERE id = ?
            ) AND is_active = 0
            """,
            (student_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Pending student not found"
            )

        return {"message": "Student rejected successfully"}

    finally:
        connection.close()


# ==========================================
# ADMIN: FACULTY MANAGEMENT
# ==========================================

@app.post("/api/admin/faculty", status_code=201)
def create_faculty(
    faculty: FacultyCreate,
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        existing = connection.execute(
            """
            SELECT id FROM users WHERE email = ?
            UNION
            SELECT id FROM faculty
            WHERE faculty_code = ? OR email = ?
            """,
            (faculty.email, faculty.faculty_code, faculty.email)
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Faculty email or code already exists"
            )

        cursor = connection.execute(
            """
            INSERT INTO users (email, password_hash, role, is_active)
            VALUES (?, ?, 'faculty', 1)
            """,
            (faculty.email, get_password_hash(faculty.password))
        )

        faculty_cursor = connection.execute(
            """
            INSERT INTO faculty
            (faculty_code, name, email, department, user_id)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                faculty.faculty_code,
                faculty.name,
                faculty.email,
                faculty.department,
                cursor.lastrowid
            )
        )

        connection.commit()

        return {
            "message": "Faculty account created successfully",
            "faculty_id": faculty_cursor.lastrowid
        }

    except sqlite3.IntegrityError:
        connection.rollback()
        raise HTTPException(status_code=409, detail="Faculty already exists")

    finally:
        connection.close()


@app.get("/api/admin/faculty")
def get_faculty(
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        faculty = connection.execute(
            """
            SELECT id, faculty_code, name, email, department
            FROM faculty ORDER BY id
            """
        ).fetchall()

        return [dict(item) for item in faculty]

    finally:
        connection.close()


# ==========================================
# COURSE MANAGEMENT
# ==========================================

@app.post("/api/courses", status_code=201)
def create_course(
    course: CourseCreate,
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        if course.faculty_id is not None:
            faculty = connection.execute(
                "SELECT id FROM faculty WHERE id = ?",
                (course.faculty_id,)
            ).fetchone()

            if faculty is None:
                raise HTTPException(status_code=404, detail="Faculty not found")

        cursor = connection.execute(
            """
            INSERT INTO courses
            (code, title, description, credits, prerequisites, capacity, faculty_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                course.code, course.title, course.description,
                course.credits, course.prerequisites,
                course.capacity, course.faculty_id
            )
        )

        connection.commit()

        return {
            "message": "Course created successfully",
            "id": cursor.lastrowid
        }

    except sqlite3.IntegrityError:
        connection.rollback()
        raise HTTPException(status_code=409, detail="Course code already exists")

    finally:
        connection.close()


@app.get("/api/courses")
def get_courses(
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        courses = connection.execute(
            """
            SELECT courses.*, faculty.name AS faculty_name
            FROM courses
            LEFT JOIN faculty ON courses.faculty_id = faculty.id
            ORDER BY courses.id
            """
        ).fetchall()

        return [dict(course) for course in courses]

    finally:
        connection.close()


@app.get("/api/courses/{course_id}")
def get_course(
    course_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        course = connection.execute(
            """
            SELECT courses.*, faculty.name AS faculty_name
            FROM courses
            LEFT JOIN faculty ON courses.faculty_id = faculty.id
            WHERE courses.id = ?
            """,
            (course_id,)
        ).fetchone()

        if course is None:
            raise HTTPException(status_code=404, detail="Course not found")

        return dict(course)

    finally:
        connection.close()


@app.put("/api/courses/{course_id}")
def update_course(
    course_id: int,
    course: CourseUpdate,
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        existing = connection.execute(
            "SELECT id FROM courses WHERE id = ?", (course_id,)
        ).fetchone()

        if existing is None:
            raise HTTPException(status_code=404, detail="Course not found")

        updates = course.model_dump(exclude_unset=True)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields provided")

        if "faculty_id" in updates and updates["faculty_id"] is not None:
            faculty = connection.execute(
                "SELECT id FROM faculty WHERE id = ?",
                (updates["faculty_id"],)
            ).fetchone()

            if faculty is None:
                raise HTTPException(status_code=404, detail="Faculty not found")

        fields = ", ".join(f"{field} = ?" for field in updates)
        values = list(updates.values()) + [course_id]

        connection.execute(
            f"UPDATE courses SET {fields} WHERE id = ?", values
        )
        connection.commit()

        return {"message": "Course updated successfully"}

    except sqlite3.IntegrityError:
        connection.rollback()
        raise HTTPException(status_code=409, detail="Course code already exists")

    finally:
        connection.close()


@app.delete("/api/courses/{course_id}")
def delete_course(
    course_id: int,
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        existing = connection.execute(
            "SELECT id FROM courses WHERE id = ?", (course_id,)
        ).fetchone()

        if existing is None:
            raise HTTPException(status_code=404, detail="Course not found")

        connection.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        connection.commit()

        return {"message": "Course deleted successfully"}

    except sqlite3.IntegrityError:
        connection.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a course with existing registrations"
        )

    finally:
        connection.close()


# ==========================================
# STUDENT MANAGEMENT
# ==========================================

@app.post("/api/students", status_code=201)
def create_student(
    student: StudentCreate,
    admin: dict = Depends(require_role("admin"))
):
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
        connection.rollback()
        raise HTTPException(
            status_code=409,
            detail="Student ID or email already exists"
        )

    finally:
        connection.close()


@app.get("/api/students")
def get_students(
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        students = connection.execute(
            """
            SELECT s.*, u.is_active
            FROM students s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.id
            """
        ).fetchall()

        return [dict(student) for student in students]

    finally:
        connection.close()


# ==========================================
# COURSE REGISTRATION
# ==========================================

@app.post("/api/registrations", status_code=201)
def create_registration(
    registration: RegistrationCreate,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        student = connection.execute(
            "SELECT * FROM students WHERE id = ?",
            (registration.student_id,)
        ).fetchone()

        if student is None:
            raise HTTPException(status_code=404, detail="Student not found")

        if current_user["role"] == "student":
            if student["user_id"] != current_user["id"]:
                raise HTTPException(
                    status_code=403,
                    detail="You can only register yourself"
                )
        elif current_user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Faculty cannot register students"
            )

        course = connection.execute(
            "SELECT * FROM courses WHERE id = ?",
            (registration.course_id,)
        ).fetchone()

        if course is None:
            raise HTTPException(status_code=404, detail="Course not found")

        existing = connection.execute(
            """
            SELECT id FROM registrations
            WHERE student_id = ? AND course_id = ?
            """,
            (registration.student_id, registration.course_id)
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Student is already registered in this course"
            )

        count = connection.execute(
            """
            SELECT COUNT(*) AS total FROM registrations
            WHERE course_id = ?
            """,
            (registration.course_id,)
        ).fetchone()["total"]

        if count >= course["capacity"]:
            raise HTTPException(status_code=409, detail="Course capacity is full")

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
        connection.rollback()
        raise HTTPException(
            status_code=409,
            detail="Registration could not be completed"
        )

    finally:
        connection.close()


@app.get("/api/registrations")
def get_registrations(
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        query = """
            SELECT
                r.id,
                s.id AS student_id,
                s.student_id AS student_number,
                s.name AS student_name,
                c.id AS course_id,
                c.code AS course_code,
                c.title AS course_title,
                r.status,
                r.created_at
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
        """

        if current_user["role"] == "student":
            query += " WHERE s.user_id = ?"
            registrations = connection.execute(
                query + " ORDER BY r.id", (current_user["id"],)
            ).fetchall()

        elif current_user["role"] == "faculty":
            query += " WHERE c.faculty_id = (SELECT id FROM faculty WHERE user_id = ?)"
            registrations = connection.execute(
                query + " ORDER BY r.id", (current_user["id"],)
            ).fetchall()

        else:
            registrations = connection.execute(
                query + " ORDER BY r.id"
            ).fetchall()

        return [dict(item) for item in registrations]

    finally:
        connection.close()


@app.delete("/api/registrations/{registration_id}")
def drop_registration(
    registration_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        registration = connection.execute(
            """
            SELECT r.id, s.user_id
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            WHERE r.id = ?
            """,
            (registration_id,)
        ).fetchone()

        if registration is None:
            raise HTTPException(status_code=404, detail="Registration not found")

        if current_user["role"] == "student":
            if registration["user_id"] != current_user["id"]:
                raise HTTPException(status_code=403, detail="Not your registration")
        elif current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Permission denied")

        connection.execute(
            "DELETE FROM registrations WHERE id = ?", (registration_id,)
        )
        connection.commit()

        return {"message": "Registration dropped successfully"}

    finally:
        connection.close()


# ==========================================
# STUDENT DASHBOARD
# ==========================================

@app.get("/api/student/dashboard")
def student_dashboard(
    current_user: dict = Depends(require_role("student"))
):
    connection = get_connection()

    try:
        student = connection.execute(
            "SELECT * FROM students WHERE user_id = ?",
            (current_user["id"],)
        ).fetchone()

        if student is None:
            raise HTTPException(status_code=404, detail="Student profile not found")

        courses = connection.execute(
            """
            SELECT c.id, c.code, c.title, c.credits, c.capacity,
                   f.name AS faculty_name
            FROM courses c
            LEFT JOIN faculty f ON c.faculty_id = f.id
            ORDER BY c.id
            """
        ).fetchall()

        registrations = connection.execute(
            """
            SELECT r.id AS registration_id, c.code, c.title,
                   c.credits, r.status, r.created_at
            FROM registrations r
            JOIN courses c ON r.course_id = c.id
            WHERE r.student_id = ?
            ORDER BY r.id
            """,
            (student["id"],)
        ).fetchall()

        return {
            "student": dict(student),
            "available_courses": [dict(c) for c in courses],
            "my_registrations": [dict(r) for r in registrations]
        }

    finally:
        connection.close()


# ==========================================
# FACULTY DASHBOARD
# ==========================================

@app.get("/api/faculty/dashboard")
def faculty_dashboard(
    current_user: dict = Depends(require_role("faculty"))
):
    connection = get_connection()

    try:
        faculty = connection.execute(
            "SELECT * FROM faculty WHERE user_id = ?",
            (current_user["id"],)
        ).fetchone()

        if faculty is None:
            raise HTTPException(status_code=404, detail="Faculty profile not found")

        courses = connection.execute(
            """
            SELECT id, code, title, credits, capacity
            FROM courses WHERE faculty_id = ?
            ORDER BY id
            """,
            (faculty["id"],)
        ).fetchall()

        students = connection.execute(
            """
            SELECT s.student_id, s.name, s.email,
                   c.code AS course_code, c.title AS course_title,
                   r.status, r.created_at
            FROM registrations r
            JOIN students s ON r.student_id = s.id
            JOIN courses c ON r.course_id = c.id
            WHERE c.faculty_id = ?
            ORDER BY c.id, s.id
            """,
            (faculty["id"],)
        ).fetchall()

        return {
            "faculty": dict(faculty),
            "assigned_courses": [dict(c) for c in courses],
            "enrolled_students": [dict(s) for s in students]
        }

    finally:
        connection.close()


# ==========================================
# ADMIN DASHBOARD
# ==========================================

@app.get("/api/admin/dashboard")
def admin_dashboard(
    admin: dict = Depends(require_role("admin"))
):
    connection = get_connection()

    try:
        total_students = connection.execute(
            "SELECT COUNT(*) AS total FROM students"
        ).fetchone()["total"]

        pending_students = connection.execute(
            "SELECT COUNT(*) AS total FROM users WHERE role='student' AND is_active=0"
        ).fetchone()["total"]

        approved_students = connection.execute(
            "SELECT COUNT(*) AS total FROM users WHERE role='student' AND is_active=1"
        ).fetchone()["total"]

        total_faculty = connection.execute(
            "SELECT COUNT(*) AS total FROM faculty"
        ).fetchone()["total"]

        total_courses = connection.execute(
            "SELECT COUNT(*) AS total FROM courses"
        ).fetchone()["total"]

        total_registrations = connection.execute(
            "SELECT COUNT(*) AS total FROM registrations"
        ).fetchone()["total"]

        return {
            "total_students": total_students,
            "approved_students": approved_students,
            "pending_students": pending_students,
            "total_faculty": total_faculty,
            "total_courses": total_courses,
            "total_registrations": total_registrations
        }

    finally:
        connection.close()
