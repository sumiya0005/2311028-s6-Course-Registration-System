
import sqlite3
from pathlib import Path
import os

# Database file location
BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = (
    Path("/tmp/unienroll.db")
    if os.getenv("VERCEL")
    else BASE_DIR / "unienroll.db"
)


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def create_tables():
    connection = get_connection()

    try:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL
                    CHECK (role IN ('student', 'faculty', 'admin')),
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                user_id INTEGER UNIQUE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS faculty (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                faculty_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                department TEXT,
                user_id INTEGER UNIQUE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                credits REAL NOT NULL,
                prerequisites TEXT,
                capacity INTEGER NOT NULL,
                faculty_id INTEGER,
                FOREIGN KEY (faculty_id) REFERENCES faculty(id)
            );

            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                status TEXT DEFAULT 'Registered',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (student_id) REFERENCES students(id),
                FOREIGN KEY (course_id) REFERENCES courses(id),

                UNIQUE (student_id, course_id)
            );
        """)

        # Safely add new columns to existing databases
        student_columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(students)"
            ).fetchall()
        ]

        if "user_id" not in student_columns:
            connection.execute("""
                ALTER TABLE students
                ADD COLUMN user_id INTEGER 
                REFERENCES users(id)
            """)

        course_columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(courses)"
            ).fetchall()
        ]

        if "faculty_id" not in course_columns:
            connection.execute("""
                ALTER TABLE courses
                ADD COLUMN faculty_id INTEGER
                REFERENCES faculty(id)
            """)

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()
