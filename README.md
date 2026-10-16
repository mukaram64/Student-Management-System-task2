# Student Management System — Task 2

A complete full-stack Student Management System with a modern purple dashboard, Express REST APIs, and SQLite database.

## Requirements
- Node.js (LTS recommended)
- npm (installed with Node.js)
- VS Code (recommended)

## Run on Windows
1. Extract this ZIP file to a normal folder, for example `C:\Projects\Student-Management-System-Task2`.
2. Open VS Code.
3. Select **File → Open Folder** and choose the extracted `Student-Management-System-Task2` folder.
4. Select **Terminal → New Terminal**.
5. Run:
   ```bash
   npm install
   ```
6. When installation finishes, run:
   ```bash
   npm start
   ```
7. Open `http://localhost:3000` in your browser.

Keep the terminal open while using the website. To stop the server, press `Ctrl+C` in the terminal.

## Features
- Add a student (name, email, course, phone)
- View student details
- Search student records
- Update student information
- Delete student records with confirmation
- Summary dashboard with total students, unique courses, email count, and recent-entry count
- REST API endpoints using Express
- SQLite database (`students.db`) created automatically and saved in this project folder
- Input validation and responsive layout

## REST API
- `GET /api/students` — list all students
- `GET /api/students/:id` — get one student
- `POST /api/students` — create student
- `PUT /api/students/:id` — update student
- `DELETE /api/students/:id` — delete student

## Database
The SQLite database file is automatically created when the server starts. It persists records between restarts. Do not delete `students.db` if you want to keep saved records.

## Task 2 checklist
- [x] Frontend design
- [x] Backend API
- [x] Database connectivity
- [x] Create, read, update, delete (CRUD)
- [ ] Test all CRUD actions on your computer and take screenshots for submission

## Troubleshooting
- If `npm` is not recognized, install Node.js LTS and restart VS Code.
- If port 3000 is already in use, stop the other server with `Ctrl+C`, then retry.
- Keep the terminal running while testing.
