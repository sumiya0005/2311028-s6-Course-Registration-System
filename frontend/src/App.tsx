
import { useEffect, useState, type FormEvent } from "react"

type Course = {
  id: number
  code: string
  title: string
  description: string | null
  credits: number
  prerequisites: string | null
  capacity: number
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
  student_number: string
  student_name: string
  course_id: number
  course_code: string
  course_title: string
  status: string
  created_at: string
}

const emptyForm = {
  code: "",
  title: "",
  description: "",
  credits: "3",
  prerequisites: "",
  capacity: "40",
}

export default function App() {
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [studentForm, setStudentForm] = useState({
    student_id: "",
    name: "",
    email: "",
  })

  const [registrationForm, setRegistrationForm] = useState({
    student_id: "",
    course_id: "",
  })

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function loadCourses() {
    try {
      setLoading(true)
      const response = await fetch("/api/courses")
      if (!response.ok) throw new Error("Failed to load courses")
      const data: Course[] = await response.json()
      setCourses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function loadStudents() {
    try {
      const response = await fetch("/api/students")
      if (!response.ok) throw new Error("Failed to load students")
      const data: Student[] = await response.json()
      setStudents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  async function loadRegistrations() {
    try {
      const response = await fetch("/api/registrations")
      if (!response.ok) throw new Error("Failed to load registrations")
      const data: Registration[] = await response.json()
      setRegistrations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  async function loadAllData() {
    await Promise.all([
      loadCourses(),
      loadStudents(),
      loadRegistrations(),
    ])
  }

  useEffect(() => {
    loadAllData()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")

    const courseData = {
      ...form,
      credits: Number(form.credits),
      capacity: Number(form.capacity),
    }

    try {
      const response = await fetch(
        editingId === null
          ? "/api/courses"
          : `/api/courses/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courseData),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Request failed")
      }

      setMessage(
        editingId === null
          ? "Course added successfully!"
          : "Course updated successfully!"
      )

      setForm(emptyForm)
      setEditingId(null)
      await loadCourses()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
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
    })
    setEditingId(course.id)
    setMessage("")
    setError("")
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return
    }

    setMessage("")
    setError("")

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Delete failed")
      }

      setMessage("Course deleted successfully!")
      await loadAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  function cancelEdit() {
    setForm(emptyForm)
    setEditingId(null)
    setError("")
    setMessage("")
  }

  async function handleStudentSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create student")
      }

      setMessage("Student created successfully!")
      setStudentForm({ student_id: "", name: "", email: "" })
      await loadStudents()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  async function handleRegistrationSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: Number(registrationForm.student_id),
          course_id: Number(registrationForm.course_id),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed")
      }

      setMessage("Course registration successful!")
      setRegistrationForm({ student_id: "", course_id: "" })
      await loadRegistrations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  return (
    <main className="container">
      <header className="header">
        <h1>UniEnroll</h1>
        <p>Course Registration System</p>
      </header>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      {/* COURSE MANAGEMENT */}
      <section className="form-section">
        <h2>{editingId === null ? "Add New Course" : "Update Course"}</h2>

        <form onSubmit={handleSubmit} className="course-form">
          <input
            placeholder="Course Code (e.g. CSE101)"
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
            placeholder="Credits"
            min="0.1"
            step="0.1"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: e.target.value })}
            required
          />

          <input
            placeholder="Prerequisites"
            value={form.prerequisites}
            onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
          />

          <input
            type="number"
            placeholder="Capacity"
            min="1"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            required
          />

          <button type="submit">
            {editingId === null ? "Add Course" : "Save Changes"}
          </button>

          {editingId !== null && (
            <button type="button" onClick={cancelEdit} className="cancel">
              Cancel
            </button>
          )}
        </form>
      </section>

      {/* COURSE LIST */}
      <section className="courses-section">
        <div className="section-heading">
          <h2>Course Catalog</h2>
          <button onClick={loadAllData}>Refresh</button>
        </div>

        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>No courses available. Add your first course!</p>
        ) : (
          <div className="course-list">
            {courses.map((course) => (
              <article className="course-card" key={course.id}>
                <div>
                  <h3>{course.code} - {course.title}</h3>
                  <p>{course.description || "No description"}</p>
                  <p>Credits: {course.credits}</p>
                  <p>Prerequisites: {course.prerequisites || "None"}</p>
                  <p>Capacity: {course.capacity}</p>
                </div>

                <div className="actions">
                  <button onClick={() => handleEdit(course)}>Edit</button>
                  <button
                    className="delete"
                    onClick={() => handleDelete(course.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* STUDENT MANAGEMENT */}
      <section className="form-section">
        <h2>Student Management</h2>

        <form onSubmit={handleStudentSubmit} className="course-form">
          <input
            placeholder="Student ID"
            value={studentForm.student_id}
            onChange={(e) =>
              setStudentForm({ ...studentForm, student_id: e.target.value })
            }
            required
          />

          <input
            placeholder="Student Name"
            value={studentForm.name}
            onChange={(e) =>
              setStudentForm({ ...studentForm, name: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder="Student Email"
            value={studentForm.email}
            onChange={(e) =>
              setStudentForm({ ...studentForm, email: e.target.value })
            }
            required
          />

          <button type="submit">Add Student</button>
        </form>

        <h3>Student List</h3>

        {students.length === 0 ? (
          <p>No students available.</p>
        ) : (
          <div className="course-list">
            {students.map((student) => (
              <article className="course-card" key={student.id}>
                <div>
                  <h3>{student.name}</h3>
                  <p>Student ID: {student.student_id}</p>
                  <p>Email: {student.email}</p>
                  <p>Database ID: {student.id}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* COURSE REGISTRATION */}
      <section className="form-section">
        <h2>Course Registration</h2>

        <form onSubmit={handleRegistrationSubmit} className="course-form">
          <select
            value={registrationForm.student_id}
            onChange={(e) =>
              setRegistrationForm({
                ...registrationForm,
                student_id: e.target.value,
              })
            }
            required
          >
            <option value="">Select Student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.student_id} - {student.name}
              </option>
            ))}
          </select>

          <select
            value={registrationForm.course_id}
            onChange={(e) =>
              setRegistrationForm({
                ...registrationForm,
                course_id: e.target.value,
              })
            }
            required
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>

          <button type="submit">Register Student</button>
        </form>
      </section>

      {/* REGISTRATION LIST */}
      <section className="courses-section">
        <div className="section-heading">
          <h2>Registration List</h2>
          <button onClick={loadRegistrations}>Refresh</button>
        </div>

        {registrations.length === 0 ? (
          <p>No registrations available.</p>
        ) : (
          <div className="course-list">
            {registrations.map((registration) => (
              <article className="course-card" key={registration.id}>
                <div>
                  <h3>
                    {registration.course_code} - {registration.course_title}
                  </h3>
                  <p>Student: {registration.student_name}</p>
                  <p>Student ID: {registration.student_number}</p>
                  <p>Status: {registration.status}</p>
                  <p>Registration Date: {registration.created_at}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
