
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
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
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

  useEffect(() => {
    loadCourses()
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
      await loadCourses()
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

  return (
    <main className="container">
      <header className="header">
        <h1>UniEnroll</h1>
        <p>Course Registration System</p>
      </header>

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

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="courses-section">
        <div className="section-heading">
          <h2>Course Catalog</h2>
          <button onClick={loadCourses}>Refresh</button>
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
    </main>
  )
}
