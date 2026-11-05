
import { useState, type FormEvent } from "react"

type Course = {
  id: number
  code: string
  title: string
  description: string
  credits: number
  capacity: number
}

export default function App() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      code: "CSE110",
      title: "Introduction to Programming",
      description: "Programming fundamentals",
      credits: 3,
      capacity: 40,
    },
  ])

  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",
    credits: "3",
    capacity: "40",
  })

  const [editingId, setEditingId] = useState<number | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const courseData = {
      ...form,
      credits: Number(form.credits),
      capacity: Number(form.capacity),
    }

    if (editingId !== null) {
      setCourses(
        courses.map((course) =>
          course.id === editingId
            ? { ...courseData, id: editingId }
            : course
        )
      )
      alert("Course updated successfully!")
    } else {
      const newCourse = {
        ...courseData,
        id: Date.now(),
      }

      setCourses([...courses, newCourse])
      alert("Course added successfully!")
    }

    setForm({
      code: "",
      title: "",
      description: "",
      credits: "3",
      capacity: "40",
    })

    setEditingId(null)
  }

  function handleEdit(course: Course) {
    setForm({
      code: course.code,
      title: course.title,
      description: course.description,
      credits: String(course.credits),
      capacity: String(course.capacity),
    })

    setEditingId(course.id)
  }

  function handleDelete(id: number) {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter((course) => course.id !== id))
      alert("Course deleted successfully!")
    }
  }

  return (
    <main className="container">
      <header className="header">
        <h1>UniEnroll</h1>
        <p>Course Registration System</p>
      </header>

      <section className="section-heading">
        <h2>Dashboard</h2>
        <p>Total Courses: {courses.length}</p>
      </section>

      <section className="form-section">
        <h2>
          {editingId === null ? "Add New Course" : "Update Course"}
        </h2>

        <form onSubmit={handleSubmit} className="course-form">
          <input
            placeholder="Course Code"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value })
            }
            required
          />

          <input
            placeholder="Course Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            required
          />

          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            type="number"
            min="1"
            placeholder="Credits"
            value={form.credits}
            onChange={(e) =>
              setForm({ ...form, credits: e.target.value })
            }
            required
          />

          <input
            type="number"
            min="1"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) =>
              setForm({ ...form, capacity: e.target.value })
            }
            required
          />

          <button type="submit">
            {editingId === null ? "Add Course" : "Update Course"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel"
              onClick={() => {
                setForm({
                  code: "",
                  title: "",
                  description: "",
                  credits: "3",
                  capacity: "40",
                })
                setEditingId(null)
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </section>

      <section className="courses-section">
        <h2>Course Catalog</h2>

        {courses.length === 0 ? (
          <p>No courses available. Add a new course.</p>
        ) : (
          <div className="course-list">
            {courses.map((course) => (
              <article className="course-card" key={course.id}>
                <h3>{course.code} - {course.title}</h3>

                <p>{course.description || "No description"}</p>
                <p>Credits: {course.credits}</p>
                <p>Capacity: {course.capacity}</p>

                <div className="actions">
                  <button onClick={() => handleEdit(course)}>
                    Edit
                  </button>

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
