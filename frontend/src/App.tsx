import { useEffect, useState, type FormEvent } from "react"

type Course = {
  id: number
  code: string
  title: string
  description: string | null
  credits: number
  prerequisites: string | null
  capacity: number
  faculty_id?: number | null
}

type Student = {
  id: number
  student_id: string
  name: string
  email: string
}

type Registration = {
  id: number
  student_id: number
  student_number?: string
  student_name?: string
  course_id: number
  course_code?: string
  course_title?: string
  status: string
  created_at?: string
}

type Faculty = {
  id: number
  faculty_code: string
  name: string
  email: string
  department?: string
}

type DashboardData = Record<string, any>

const API = ""

async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("unienroll_token")

  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (options.body) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || data.message || `Request failed: ${response.status}`)
  }

  return data as T
}

const emptyCourse = {
  code: "",
  title: "",
  description: "",
  credits: "3",
  prerequisites: "",
  capacity: "40",
  faculty_id: "",
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("unienroll_token") || "")
  const [role, setRole] = useState(localStorage.getItem("unienroll_role") || "")
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")

  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({
    student_id: "",
    name: "",
    email: "",
    password: "",
  })

  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [pendingStudents, setPendingStudents] = useState<Student[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [form, setForm] = useState(emptyCourse)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [studentForm, setStudentForm] = useState({
    student_id: "",
    name: "",
    email: "",
  })

  const [facultyForm, setFacultyForm] = useState({
    faculty_code: "",
    name: "",
    email: "",
    password: "",
    department: "CSE",
  })

  const [registrationForm, setRegistrationForm] = useState({
    student_id: "",
    course_id: "",
  })

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function showError(err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong")
  }

  async function loadAdminData() {
    setLoading(true)
    setError("")

    try {
      const results = await Promise.all([
        api<Course[]>("/api/courses"),
        api<Student[]>("/api/students"),
        api<Registration[]>("/api/registrations"),
        api<Student[]>("/api/admin/students/pending"),
        api<Faculty[]>("/api/admin/faculty"),
        api<DashboardData>("/api/admin/dashboard"),
      ])

      setCourses(results[0])
      setStudents(results[1])
      setRegistrations(results[2])
      setPendingStudents(results[3])
      setFaculty(results[4])
      setDashboard(results[5])
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadRoleDashboard(currentRole: string) {
    setLoading(true)
    setError("")

    try {
      if (currentRole === "admin") {
        await loadAdminData()
      } else if (currentRole === "student") {
        const data = await api<DashboardData>("/api/student/dashboard")
        setDashboard(data)
        setCourses(data.courses || [])
        setRegistrations(data.registrations || [])
      } else if (currentRole === "faculty") {
        const data = await api<DashboardData>("/api/faculty/dashboard")
        setDashboard(data)
        setCourses(data.courses || [])
      }
    } catch (err) {
      showError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token || !role) return

    api("/auth/me")
      .then(() => loadRoleDashboard(role))
      .catch(() => {
        localStorage.removeItem("unienroll_token")
        localStorage.removeItem("unienroll_role")
        setToken("")
        setRole("")
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")

    try {
      const data = await api<{
        access_token: string
        token_type: string
        role: string
        message: string
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      })

      localStorage.setItem("unienroll_token", data.access_token)
      localStorage.setItem("unienroll_role", data.role)

      setToken(data.access_token)
      setRole(data.role)
      setMessage("Login successful!")
      await loadRoleDashboard(data.role)
    } catch (err) {
      showError(err)
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")

    try {
      const data = await api<{ message: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(signupForm),
      })

      setMessage(data.message || "Signup successful. Wait for Admin approval.")
      setSignupForm({ student_id: "", name: "", email: "", password: "" })
      setAuthMode("login")
    } catch (err) {
      showError(err)
    }
  }

  function handleLogout() {
    localStorage.removeItem("unienroll_token")
    localStorage.removeItem("unienroll_role")
    setToken("")
    setRole("")
    setDashboard(null)
    setCourses([])
    setStudents([])
    setRegistrations([])
    setPendingStudents([])
    setFaculty([])
    setMessage("You have logged out.")
    setError("")
  }

  async function handleCourseSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")

    const courseData = {
      ...form,
      credits: Number(form.credits),
      capacity: Number(form.capacity),
      faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
    }

    try {
      await api(
        editingId === null ? "/api/courses" : `/api/courses/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          body: JSON.stringify(courseData),
        }
      )

      setMessage(editingId === null ? "Course added successfully!" : "Course updated successfully!")
      setForm(emptyCourse)
      setEditingId(null)
      await loadAdminData()
    } catch (err) {
      showError(err)
    }
  }

  function handleEdit(course: Course) {
    setForm({
      code: course.code,
      title: course.title,
      description: course.description || "",
      credits: String(course.credits),
      prerequisites: course.prerequisites || "",
      capacity: String(course.capacity),
      faculty_id: course.faculty_id ? String(course.faculty_id) : "",
    })
    setEditingId(course.id)
    setMessage("")
    setError("")
  }

  async function handleDeleteCourse(id: number) {
    if (!window.confirm("Are you sure you want to delete this course?")) return

    try {
      await api(`/api/courses/${id}`, { method: "DELETE" })
      setMessage("Course deleted successfully!")
      await loadAdminData()
    } catch (err) {
      showError(err)
    }
  }

  async function handleStudentSubmit(e: FormEvent) {
    e.preventDefault()

    try {
      await api("/api/students", {
        method: "POST",
        body: JSON.stringify(studentForm),
      })

      setMessage("Student created successfully!")
      setStudentForm({ student_id: "", name: "", email: "" })
      await loadAdminData()
    } catch (err) {
      showError(err)
    }
  }

  async function handleFacultySubmit(e: FormEvent) {
    e.preventDefault()

    try {
      await api("/api/admin/faculty", {
        method: "POST",
        body: JSON.stringify(facultyForm),
      })

      setMessage("Faculty account created successfully!")
      setFacultyForm({
        faculty_code: "",
        name: "",
        email: "",
        password: "",
        department: "CSE",
      })
      await loadAdminData()
    } catch (err) {
      showError(err)
    }
  }

  async function handleApproveStudent(studentId: number) {
    try {
      await api(`/api/admin/students/${studentId}/approve`, {
        method: "PUT",
      })
      setMessage("Student approved successfully!")
      await loadAdminData()
    } catch (err) {
      showError(err)
    }
  }

  async function handleRejectStudent(studentId: number) {
    if (!window.confirm("Are you sure you want to reject this student?")) return

    try {
      await api(`/api/admin/students/${studentId}/reject`, {
        method: "PUT",
      })
      setMessage("Student rejected.")
      await loadAdminData()
    } catch (err) {
      showError(err)
    }
  }

  async function handleRegistrationSubmit(e: FormEvent) {
    e.preventDefault()

    try {
      await api("/api/registrations", {
        method: "POST",
        body: JSON.stringify({
          student_id: Number(registrationForm.student_id),
          course_id: Number(registrationForm.course_id),
        }),
      })

      setMessage("Course registration successful!")
      setRegistrationForm({ student_id: "", course_id: "" })
      await loadAdminData()
    } catch (err) {
      showError(err)
    }
  }

  async function handleStudentRegistration(courseId: number) {
    const studentProfile = dashboard?.student || dashboard?.profile
    const studentDatabaseId = studentProfile?.id

    if (!studentDatabaseId) {
      setError("Student profile ID was not found in the dashboard.")
      return
    }

    try {
      await api("/api/registrations", {
        method: "POST",
        body: JSON.stringify({
          student_id: Number(studentDatabaseId),
          course_id: courseId,
        }),
      })

      setMessage("Course registration successful!")
      await loadRoleDashboard("student")
    } catch (err) {
      showError(err)
    }
  }

  async function handleDropRegistration(registrationId: number) {
    if (!window.confirm("Are you sure you want to drop this registration?")) return

    try {
      await api(`/api/registrations/${registrationId}`, {
        method: "DELETE",
      })

      setMessage("Registration dropped successfully!")
      await loadRoleDashboard(role)
    } catch (err) {
      showError(err)
    }
  }

  if (!token || !role) {
    return (
      <main className="container">
        <header className="header">
          <h1>UniEnroll</h1>
          <p>Course Registration System</p>
        </header>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <section className="form-section">
          <h2>{authMode === "login" ? "Login to UniEnroll" : "Student Signup"}</h2>

          <div className="actions">
            <button type="button" onClick={() => { setAuthMode("login"); setError(""); }}>
              Login
            </button>
            <button type="button" onClick={() => { setAuthMode("signup"); setError(""); }}>
              Student Signup
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} className="course-form">
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <button type="submit">Login</button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="course-form">
              <input
                placeholder="Student ID"
                value={signupForm.student_id}
                onChange={(e) => setSignupForm({ ...signupForm, student_id: e.target.value })}
                required
              />
              <input
                placeholder="Full Name"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password (minimum 8 characters)"
                minLength={8}
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                required
              />
              <button type="submit">Create Student Account</button>
            </form>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="container">
      <header className="header">
        <h1>UniEnroll</h1>
        <p>Course Registration System</p>
        <p>Logged in as: <strong>{role.toUpperCase()}</strong></p>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}

      <div className="section-heading">
        <h2>{role === "admin" ? "Admin Dashboard" : role === "faculty" ? "Faculty Dashboard" : "Student Dashboard"}</h2>
        <button onClick={() => loadRoleDashboard(role)}>Refresh Dashboard</button>
      </div>

      {role === "admin" && (
        <>
          <section className="courses-section">
            <h2>Dashboard Summary</h2>
            <div className="course-list">
              {[
                ["Total Students", dashboard?.total_students],
                ["Approved Students", dashboard?.approved_students],
                ["Pending Students", dashboard?.pending_students],
                ["Total Faculty", dashboard?.total_faculty],
                ["Total Courses", dashboard?.total_courses],
                ["Total Registrations", dashboard?.total_registrations],
              ].map(([label, value]) => (
                <article className="course-card" key={String(label)}>
                  <h3>{label}</h3>
                  <p>{value ?? 0}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="form-section">
            <h2>Pending Student Approvals</h2>
            {pendingStudents.length === 0 ? (
              <p>No pending students.</p>
            ) : (
              <div className="course-list">
                {pendingStudents.map((student) => (
                  <article className="course-card" key={student.id}>
                    <div>
                      <h3>{student.name}</h3>
                      <p>Student ID: {student.student_id}</p>
                      <p>Email: {student.email}</p>
                    </div>
                    <div className="actions">
                      <button onClick={() => handleApproveStudent(student.id)}>Approve</button>
                      <button className="delete" onClick={() => handleRejectStudent(student.id)}>Reject</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="form-section">
            <h2>Create Faculty Account</h2>
            <form onSubmit={handleFacultySubmit} className="course-form">
              <input placeholder="Faculty Code" value={facultyForm.faculty_code} onChange={(e) => setFacultyForm({ ...facultyForm, faculty_code: e.target.value })} required />
              <input placeholder="Faculty Name" value={facultyForm.name} onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} required />
              <input type="email" placeholder="Faculty Email" value={facultyForm.email} onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} required />
              <input type="password" placeholder="Temporary Password (min 8)" minLength={8} value={facultyForm.password} onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })} required />
              <input placeholder="Department" value={facultyForm.department} onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })} />
              <button type="submit">Create Faculty</button>
            </form>
          </section>

          <section className="form-section">
            <h2>{editingId === null ? "Add New Course" : "Update Course"}</h2>
            <form onSubmit={handleCourseSubmit} className="course-form">
              <input placeholder="Course Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
              <input placeholder="Course Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input type="number" min="0.1" step="0.1" placeholder="Credits" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} required />
              <input placeholder="Prerequisites" value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} />
              <input type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
              <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}>
                <option value="">Assign Faculty (optional)</option>
                {faculty.map((item) => (
                  <option key={item.id} value={item.id}>{item.faculty_code} - {item.name}</option>
                ))}
              </select>
              <button type="submit">{editingId === null ? "Add Course" : "Save Changes"}</button>
              {editingId !== null && <button type="button" className="cancel" onClick={() => { setForm(emptyCourse); setEditingId(null); }}>Cancel</button>}
            </form>
          </section>

          <section className="courses-section">
            <h2>Course Catalog</h2>
            <div className="course-list">
              {courses.map((course) => (
                <article className="course-card" key={course.id}>
                  <div>
                    <h3>{course.code} - {course.title}</h3>
                    <p>{course.description || "No description"}</p>
                    <p>Credits: {course.credits} | Capacity: {course.capacity}</p>
                    <p>Prerequisites: {course.prerequisites || "None"}</p>
                    <p>Faculty ID: {course.faculty_id || "Not assigned"}</p>
                  </div>
                  <div className="actions">
                    <button onClick={() => handleEdit(course)}>Edit</button>
                    <button className="delete" onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="form-section">
            <h2>Add Student Profile</h2>
            <form onSubmit={handleStudentSubmit} className="course-form">
              <input placeholder="Student ID" value={studentForm.student_id} onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })} required />
              <input placeholder="Student Name" value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} required />
              <input type="email" placeholder="Student Email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} required />
              <button type="submit">Add Student</button>
            </form>
          </section>

          <section className="courses-section">
            <h2>Student List</h2>
            {students.map((student) => (
              <article className="course-card" key={student.id}>
                <h3>{student.name}</h3>
                <p>Student ID: {student.student_id} | Email: {student.email}</p>
              </article>
            ))}
          </section>

          <section className="form-section">
            <h2>Course Registration (Admin)</h2>
            <form onSubmit={handleRegistrationSubmit} className="course-form">
              <select value={registrationForm.student_id} onChange={(e) => setRegistrationForm({ ...registrationForm, student_id: e.target.value })} required>
                <option value="">Select Student</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.student_id} - {student.name}</option>)}
              </select>
              <select value={registrationForm.course_id} onChange={(e) => setRegistrationForm({ ...registrationForm, course_id: e.target.value })} required>
                <option value="">Select Course</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.code} - {course.title}</option>)}
              </select>
              <button type="submit">Register Student</button>
            </form>
          </section>

          <section className="courses-section">
            <h2>Registration List</h2>
            {registrations.map((item) => (
              <article className="course-card" key={item.id}>
                <h3>{item.course_code || `Course ${item.course_id}`} - {item.course_title || ""}</h3>
                <p>Student: {item.student_name || item.student_number || item.student_id}</p>
                <p>Status: {item.status}</p>
                <p>Date: {item.created_at || "N/A"}</p>
                <button className="delete" onClick={() => handleDropRegistration(item.id)}>Drop Registration</button>
              </article>
            ))}
          </section>
        </>
      )}

      {role === "faculty" && (
        <>
          <section className="courses-section">
            <h2>My Assigned Courses</h2>
            {courses.length === 0 ? <p>No courses assigned yet.</p> : courses.map((course) => (
              <article className="course-card" key={course.id}>
                <h3>{course.code} - {course.title}</h3>
                <p>{course.description || "No description"}</p>
                <p>Credits: {course.credits} | Capacity: {course.capacity}</p>
              </article>
            ))}
          </section>
          <section className="courses-section">
            <h2>Faculty Dashboard Information</h2>
            <pre>{JSON.stringify(dashboard, null, 2)}</pre>
          </section>
        </>
      )}

      {role === "student" && (
        <>
          <section className="courses-section">
            <h2>Available Courses</h2>
            {courses.length === 0 ? <p>No courses available.</p> : courses.map((course) => (
              <article className="course-card" key={course.id}>
                <h3>{course.code} - {course.title}</h3>
                <p>{course.description || "No description"}</p>
                <p>Credits: {course.credits} | Capacity: {course.capacity}</p>
                <p>Prerequisites: {course.prerequisites || "None"}</p>
                <button onClick={() => handleStudentRegistration(course.id)}>Register</button>
              </article>
            ))}
          </section>
          <section className="courses-section">
            <h2>My Registrations</h2>
            {registrations.length === 0 ? <p>You have no registrations yet.</p> : registrations.map((item) => (
              <article className="course-card" key={item.id}>
                <h3>{item.course_code || `Course ${item.course_id}`} - {item.course_title || ""}</h3>
                <p>Status: {item.status}</p>
                <p>Date: {item.created_at || "N/A"}</p>
                <button className="delete" onClick={() => handleDropRegistration(item.id)}>Drop Course</button>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  )
}