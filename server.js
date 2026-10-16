const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database(path.join(__dirname, "students.db"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    course TEXT NOT NULL,
    phone TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

function validateStudent(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const course = String(body.course || "").trim();
  const phone = String(body.phone || "").trim();
  if (!name || !email || !course) return { error: "Name, email, and course are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  return { student: { name, email, course, phone } };
}

app.get("/api/students", (req, res) => {
  db.all("SELECT * FROM students ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Could not load students." });
    res.json(rows);
  });
});

app.get("/api/students/:id", (req, res) => {
  db.get("SELECT * FROM students WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Could not load student." });
    if (!row) return res.status(404).json({ error: "Student not found." });
    res.json(row);
  });
});

app.post("/api/students", (req, res) => {
  const result = validateStudent(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  const s = result.student;
  db.run(
    "INSERT INTO students (name, email, course, phone) VALUES (?, ?, ?, ?)",
    [s.name, s.email, s.course, s.phone],
    function (err) {
      if (err) return res.status(500).json({ error: "Could not add student." });
      db.get("SELECT * FROM students WHERE id = ?", [this.lastID], (getErr, row) => {
        if (getErr) return res.status(500).json({ error: "Student saved, but could not retrieve it." });
        res.status(201).json(row);
      });
    }
  );
});

app.put("/api/students/:id", (req, res) => {
  const result = validateStudent(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  const s = result.student;
  db.run(
    "UPDATE students SET name = ?, email = ?, course = ?, phone = ? WHERE id = ?",
    [s.name, s.email, s.course, s.phone, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Could not update student." });
      if (!this.changes) return res.status(404).json({ error: "Student not found." });
      db.get("SELECT * FROM students WHERE id = ?", [req.params.id], (getErr, row) => {
        if (getErr) return res.status(500).json({ error: "Could not retrieve updated student." });
        res.json(row);
      });
    }
  );
});

app.delete("/api/students/:id", (req, res) => {
  db.run("DELETE FROM students WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Could not delete student." });
    if (!this.changes) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Student deleted successfully." });
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Student Management System running at http://localhost:${PORT}`);
});
