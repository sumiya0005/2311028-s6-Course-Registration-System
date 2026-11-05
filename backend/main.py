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
