
import { useEffect, useState, type FormEvent } from "react"

const API_BASE_URL =
  "https://2311028-s6-course-registration-system-ejbh-cr18cjj7u.vercel.app"

type User = {
  id: number
  email: string
  role: "student" | "faculty" | "admin"
}

type Course = {
  id: number
  code: string
  title: string
  description?: string
  credits: number
  capacity: number
  faculty_id?: number | null
  faculty_name?: string | null
}

type Registration = {
  id?: number
  registration_id?: number
  course_id?: number
  course_code?: string
  course_title?: string
  code?: string
  title?: string
  status?: string
  student_name?: string
  name?: string
  student_id?: string | number
  email?: string
}

async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token")

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Something went wrong")
  }

  return data as T
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [studentId, setStudentId] = useState("")
  const [name, setName] = useState("")

  const [courses, setCourses] = useState<Course[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [dashboard, setDashboard] = useState<Record<string, any>>({})
  const [editingId, setEditingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    credits: "3",
    capacity: "40",
  })

  async function loadDashboard(currentUser: User) {
    if (currentUser.role === "admin") {
      const [stats, courseList] = await Promise.all([
        api<Record<string, any>>("/api/admin/dashboard"),
        api<Course[]>("/api/courses"),
      ])
      setDashboard(stats)
      setCourses(courseList)
    }

    if (currentUser.role === "student") {
      const data = await api<Record<string, any>>("/api/student/dashboard")
      setDashboard(data.student)
      setCourses(data.available_courses || [])
      setRegistrations(data.my_registrations || [])
    }

    if (currentUser.role === "faculty") {
      const data = await api<Record<string, any>>("/api/faculty/dashboard")
      setDashboard(data.faculty)
      setCourses(data.assigned_courses || [])
      setRegistrations(data.enrolled_students || [])
    }
  }

  async function loadProfile() {
    try {
      const currentUser = await api<User>("/auth/me")
      setUser(currentUser)
      await loadDashboard(currentUser)
    } catch {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setUser(null)
    }
  }

  useEffect(() => {
    if (localStorage.getItem("token")) {
      loadProfile()
    }
  }, [])

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const result = await api<{
        access_token: string
        role: User["role"]
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      localStorage.setItem("token", result.access_token)

      const currentUser = await api<User>("/auth/me")
      localStorage.setItem("user", JSON.stringify(currentUser))
      setUser(currentUser)

      await loadDashboard(currentUser)
    } catch (err) {
      localStorage.removeItem("token")
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          student_id: studentId,
          name,
          email,
          password,
        }),
      })

      setMessage("Signup successful! You can now log in.")
      setPage("login")
      setPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setCourses([])
    setRegistrations([])
    setDashboard({})
    setEmail("")
    setPassword("")
    setMessage("")
    setError("")
  }

  function resetForm() {
    setForm({
      code: "",
      title: "",
      description: "",
      credits: "3",
      capacity: "40",
    })
    setEditingId(null)
  }

  async function handleCourseSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")

    const courseData = {
      ...form,
      credits: Number(form.credits),
      capacity: Number(form.capacity),
    }

    try {
      if (editingId !== null) {
        await api(`/api/courses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(courseData),
        })
        setMessage("Course updated successfully!")
      } else {
        await api("/api/courses", {
          method: "POST",
          body: JSON.stringify(courseData),
        })
        setMessage("Course added successfully!")
      }

      resetForm()

      if (user) await loadDashboard(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Course operation failed")
    }
  }

  function handleEdit(course: Course) {
    setForm({
      code: course.code,
      title: course.title,
      description: course.description || "",
      credits: String(course.credits),
      capacity: String(course.capacity),
    })
    setEditingId(course.id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return
    }

    setError("")
    setMessage("")

    try {
      await api(`/api/courses/${id}`, { method: "DELETE" })
      setMessage("Course deleted successfully!")
      if (user) await loadDashboard(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
    }
  }

  async function handleRegistration(courseId: number) {
    setError("")
    setMessage("")

    try {
      await api("/api/registrations", {
        method: "POST",
        body: JSON.stringify({
          student_id: dashboard.id,
          course_id: courseId,
        }),
      })

      setMessage("Course registration successful!")
      if (user) await loadDashboard(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    }
  }

  async function handleDropRegistration(registrationId: number) {
    if (!window.confirm("Are you sure you want to drop this course?")) {
      return
    }

    try {
      await api(`/api/registrations/${registrationId}`, {
        method: "DELETE",
      })
      setMessage("Registration dropped successfully!")
      if (user) await loadDashboard(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not drop course")
    }
  }

  if (!user) {
    return (
      <main className="auth-container">
        <div className="auth-card">
          <h1>UniEnroll</h1>
          <p className="auth-subtitle">Course Registration System</p>

          <div className="auth-tabs">
            <button
              className={page === "login" ? "active-tab" : "secondary"}
              onClick={() => {
                setPage("login")
                setError("")
                setMessage("")
              }}
            >
              Login
            </button>
            <button
              className={page === "signup" ? "active-tab" : "secondary"}
              onClick={() => {
                setPage("signup")
                setError("")
                setMessage("")
              }}
            >
              Student Signup
            </button>
          </div>

          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}

          {page === "login" ? (
            <form onSubmit={handleLogin} className="auth-form">
              <h2>Welcome Back</h2>

              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="auth-form">
              <h2>Create Student Account</h2>

              <label>Student ID</label>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. 2311028"
                required
              />

              <label>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />

              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />

              <label>Password</label>
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <p className="auth-footer">
            UniEnroll - University Course Registration
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>UniEnroll</h1>
          <p>Course Registration System</p>
        </div>

        <div className="user-info">
          <span>{user.email}</span>
          <span className="role-badge">{user.role.toUpperCase()}</span>
          <button className="logout" onClick={logout}>Logout</button>
        </div>
      </header>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="section-heading">
        <div>
          <h2>{user.role.toUpperCase()} Dashboard</h2>
          <p>Welcome, {dashboard.name || user.email}</p>
        </div>
      </section>

      {user.role === "admin" && (
        <section className="stats-grid">
          {[
            ["Total Students", dashboard.total_students],
            ["Approved Students", dashboard.approved_students],
            ["Pending Students", dashboard.pending_students],
            ["Total Faculty", dashboard.total_faculty],
            ["Total Courses", dashboard.total_courses],
            ["Total Registrations", dashboard.total_registrations],
          ].map(([label, value]) => (
            <div className="stat-card" key={String(label)}>
              <h3>{value ?? 0}</h3>
              <p>{label}</p>
            </div>
          ))}
        </section>
      )}

      {user.role === "student" && (
        <section className="stats-grid">
          <div className="stat-card">
            <h3>{courses.length}</h3>
            <p>Available Courses</p>
          </div>
          <div className="stat-card">
            <h3>{registrations.length}</h3>
            <p>My Registrations</p>
          </div>
        </section>
      )}

      {user.role === "admin" && (
        <section className="form-section">
          <h2>{editingId === null ? "Add New Course" : "Update Course"}</h2>

          <form onSubmit={handleCourseSubmit} className="course-form">
            <input
              placeholder="Course Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />

            <input
              placeholder="Course Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="Credits"
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: e.target.value })}
              required
            />

            <input
              type="number"
              min="1"
              placeholder="Capacity"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />

            <button type="submit">
              {editingId === null ? "Add Course" : "Update Course"}
            </button>

            {editingId !== null && (
              <button type="button" className="cancel" onClick={resetForm}>
                Cancel
              </button>
            )}
          </form>
        </section>
      )}

      <section className="courses-section">
        <h2>
          {user.role === "admin"
            ? "Course Management"
            : user.role === "student"
              ? "Available Courses"
              : "Assigned Courses"}
        </h2>

        {courses.length === 0 ? (
          <p>No courses available.</p>
        ) : (
          <div className="course-list">
            {courses.map((course) => {
              const alreadyRegistered = registrations.some(
                (r) =>
                  r.course_id === course.id ||
                  r.code === course.code ||
                  r.course_code === course.code
              )

              return (
                <article className="course-card" key={course.id}>
                  <div>
                    <h3>{course.code} - {course.title}</h3>
                    <p>{course.description || "No description"}</p>
                    <p>Credits: {course.credits}</p>
                    <p>Capacity: {course.capacity}</p>
                    {course.faculty_name && (
                      <p>Faculty: {course.faculty_name}</p>
                    )}
                  </div>

                  <div className="actions">
                    {user.role === "admin" && (
                      <>
                        <button onClick={() => handleEdit(course)}>Edit</button>
                        <button
                          className="delete"
                          onClick={() => handleDelete(course.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {user.role === "student" && (
                      <button
                        disabled={alreadyRegistered}
                        onClick={() => handleRegistration(course.id)}
                      >
                        {alreadyRegistered ? "Registered" : "Register"}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {user.role === "student" && (
        <section className="courses-section">
          <h2>My Registrations</h2>

          {registrations.length === 0 ? (
            <p>You have not registered for any courses yet.</p>
          ) : (
            <div className="course-list">
              {registrations.map((registration) => (
                <article
                  className="course-card"
                  key={registration.registration_id || registration.id}
                >
                  <div>
                    <h3>
                      {registration.code || registration.course_code} -{" "}
                      {registration.title || registration.course_title}
                    </h3>
                    <p>Status: {registration.status || "Registered"}</p>
                  </div>

                  <button
                    className="delete"
                    onClick={() =>
                      handleDropRegistration(
                        registration.registration_id || registration.id || 0
                      )
                    }
                  >
                    Drop Course
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {user.role === "faculty" && (
        <section className="courses-section">
          <h2>Enrolled Students</h2>

          {registrations.length === 0 ? (
            <p>No enrolled students found.</p>
          ) : (
            <div className="course-list">
              {registrations.map((student, index) => (
                <article className="course-card" key={index}>
                  <div>
                    <h3>{student.student_name || student.name}</h3>
                    <p>Student ID: {student.student_id}</p>
                    <p>Email: {student.email}</p>
                    <p>Course: {student.course_code} - {student.course_title}</p>
                    <p>Status: {student.status}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}


