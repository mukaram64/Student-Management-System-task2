const $ = (id) => document.getElementById(id);
const state = { students: [], query: "", busy: false };
const modal = $("student-modal");
let toastTimer;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}
function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
  return data;
}
function renderStats() {
  const students = state.students;
  $("total-students").textContent = students.length;
  $("side-count").textContent = students.length;
  $("total-courses").textContent = new Set(students.map(s => (s.course || "").trim().toLowerCase()).filter(Boolean)).size;
  $("total-emails").textContent = students.filter(s => (s.email || "").trim()).length;
  $("recent-students").textContent = Math.min(students.length, 5);
  $("record-count").textContent = `${students.length} ${students.length === 1 ? "record" : "records"}`;
  $("footer-count").textContent = `${students.length} student ${students.length === 1 ? "record" : "records"} in your directory`;
}
function renderTable() {
  const query = state.query.trim().toLowerCase();
  const filtered = state.students.filter(s =>
    [s.name, s.email, s.course, s.phone, String(s.id)].some(v => String(v || "").toLowerCase().includes(query))
  );
  $("showing-label").textContent = `Showing ${filtered.length} of ${state.students.length} students`;
  const tbody = $("student-table");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-cell"><div class="empty-symbol">♙</div><div class="empty-title">${query ? "No matching students" : "Your directory is ready"}</div><div class="empty-subtitle">${query ? "Try another name, email, or course." : "Add your first student to get started."}</div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td><div class="student-cell"><div class="student-avatar">${escapeHTML(initials(s.name))}</div><div><div class="student-name">${escapeHTML(s.name)}</div><div class="student-email">${escapeHTML(s.email)}</div></div></div></td>
      <td><span class="course-pill">${escapeHTML(s.course)}</span></td>
      <td class="phone-cell">${escapeHTML(s.phone || "—")}</td>
      <td class="id-cell">#${escapeHTML(s.id)}</td>
      <td class="actions-cell"><button class="action-btn" title="View details" aria-label="View ${escapeHTML(s.name)}" data-action="view" data-id="${escapeHTML(s.id)}">⌕</button><button class="action-btn" title="Edit student" aria-label="Edit ${escapeHTML(s.name)}" data-action="edit" data-id="${escapeHTML(s.id)}">✎</button><button class="action-btn delete" title="Delete student" aria-label="Delete ${escapeHTML(s.name)}" data-action="delete" data-id="${escapeHTML(s.id)}">⌫</button></td>
    </tr>`).join("");
}
async function loadStudents(showMessage = false) {
  $("student-table").innerHTML = '<tr><td colspan="5" class="loading-cell">Loading student records…</td></tr>';
  try {
    state.students = await api("/api/students");
    renderStats();
    renderTable();
    if (showMessage) showToast("Student records refreshed.");
  } catch (error) {
    $("student-table").innerHTML = `<tr><td colspan="5" class="empty-cell">Could not load records. Please check that the server is running.<br><br>${escapeHTML(error.message)}</td></tr>`;
    showToast("Unable to connect to the server.");
  }
}
function openModal(student = null) {
  $("student-form").reset();
  $("form-error").textContent = "";
  $("student-id").value = student?.id || "";
  $("modal-title").textContent = student ? "Update student" : "Add new student";
  $("save-btn").innerHTML = student ? 'Save changes <span>→</span>' : 'Save student <span>→</span>';
  if (student) {
    $("student-name").value = student.name || "";
    $("student-email").value = student.email || "";
    $("student-course").value = student.course || "";
    $("student-phone").value = student.phone || "";
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => $("student-name").focus(), 50);
}
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}
async function handleRowAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const student = state.students.find(s => Number(s.id) === id);
  if (!student) return;
  if (action === "view") {
    alert(`STUDENT DETAILS\n\nName: ${student.name}\nEmail: ${student.email}\nCourse: ${student.course}\nPhone: ${student.phone || "Not provided"}\nRecord ID: ${student.id}`);
  } else if (action === "edit") {
    openModal(student);
  } else if (action === "delete") {
    if (!confirm(`Delete ${student.name}'s record? This action cannot be undone.`)) return;
    try {
      await api(`/api/students/${id}`, { method: "DELETE" });
      await loadStudents();
      showToast("Student record deleted.");
    } catch (error) { showToast(error.message); }
  }
}
$("add-student").addEventListener("click", () => openModal());
$("add-student-top").addEventListener("click", () => openModal());
$("close-modal").addEventListener("click", closeModal);
$("cancel-modal").addEventListener("click", closeModal);
$("refresh-btn").addEventListener("click", () => loadStudents(true));
$("search-input").addEventListener("input", event => { state.query = event.target.value; renderTable(); });
$("student-table").addEventListener("click", handleRowAction);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

$("student-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (state.busy) return;
  const id = $("student-id").value;
  const payload = {
    name: $("student-name").value.trim(),
    email: $("student-email").value.trim(),
    course: $("student-course").value.trim(),
    phone: $("student-phone").value.trim()
  };
  if (!payload.name || !payload.email || !payload.course) {
    $("form-error").textContent = "Please fill in name, email, and course.";
    return;
  }
  state.busy = true;
  const button = $("save-btn");
  button.disabled = true;
  button.textContent = id ? "Saving changes…" : "Adding student…";
  $("form-error").textContent = "";
  try {
    await api(id ? `/api/students/${id}` : "/api/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    await loadStudents();
    showToast(id ? "Student record updated." : "Student added successfully.");
  } catch (error) {
    $("form-error").textContent = error.message;
  } finally {
    state.busy = false;
    button.disabled = false;
    button.innerHTML = id ? 'Save changes <span>→</span>' : 'Save student <span>→</span>';
  }
});
loadStudents();
