const STORAGE_KEYS = {
  session: "bugsoft_session",
  appointments: "bugsoft_appointments",
};

const USERS = [
  { email: "admin@bugsoft.com", password: "123456", role: "Administrador", name: "Admin Principal" },
  { email: "recep@bugsoft.com", password: "123456", role: "Recepcionista", name: "Laura Recepción" },
  { email: "dentista@bugsoft.com", password: "123456", role: "Dentista", name: "Dr. Dentista" },
];

const DAY_ORDER = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00"];
const COLOR_CLASSES = ["#e8f1ff", "#e8f8ef", "#fff3e7", "#ffeaea", "#f1ecff"];
let selectedDay = "Lun";

const views = {
  login: document.getElementById("login-view"),
  agenda: document.getElementById("agenda-view"),
};

const loginForm = document.getElementById("login-form");
const loginAlert = document.getElementById("login-alert");
const rolePill = document.getElementById("role-pill");
const logoutBtn = document.getElementById("logout-btn");
const weeklyGrid = document.getElementById("weekly-grid");
const upcomingList = document.getElementById("upcoming-list");
const remindersList = document.getElementById("reminders-list");
const mobileAppointments = document.getElementById("mobile-appointments");
const mobileDaySelector = document.querySelector(".mobile-day-selector");

const modal = document.getElementById("appointment-modal");
const modalTitle = document.getElementById("modal-title");
const appointmentForm = document.getElementById("appointment-form");
const cancelAppointmentBtn = document.getElementById("cancel-appointment");
const closeModalBtn = document.getElementById("close-modal");

const statScheduled = document.getElementById("stat-scheduled");
const statCompleted = document.getElementById("stat-completed");
const statCancelled = document.getElementById("stat-cancelled");

const formFields = {
  id: document.getElementById("appointment-id"),
  patient: document.getElementById("patient"),
  phone: document.getElementById("phone"),
  date: document.getElementById("date"),
  time: document.getElementById("time"),
  reason: document.getElementById("reason"),
  doctor: document.getElementById("doctor"),
  notes: document.getElementById("notes"),
  whatsapp: document.getElementById("whatsapp"),
};

function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
}

function setSession(session, remember) {
  if (remember) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } else {
    sessionStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
  sessionStorage.removeItem(STORAGE_KEYS.session);
}

function activeSession() {
  return (
    JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null") ||
    JSON.parse(sessionStorage.getItem(STORAGE_KEYS.session) || "null")
  );
}

function normalizeDemoDate(dayShort) {
  const monday = new Date();
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  const index = DAY_ORDER.indexOf(dayShort);
  monday.setDate(monday.getDate() + index);
  return monday.toISOString().slice(0, 10);
}

function loadAppointments() {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.appointments) || "null");
  if (stored && Array.isArray(stored) && stored.length) return stored;

  const seed = [
    { patient: "Luis García", phone: "555-1001", day: "Lun", time: "10:00", reason: "Limpieza Dental", doctor: "Dra. Marta Ruiz", notes: "Primera visita" },
    { patient: "Ana Torres", phone: "555-2034", day: "Lun", time: "11:00", reason: "Revisión", doctor: "Dr. Carlos Pérez", notes: "Control mensual" },
    { patient: "Jorge Díaz", phone: "555-4512", day: "Mar", time: "12:30", reason: "Caries y Empaste", doctor: "Dra. Marta Ruiz", notes: "Dolor moderado" },
    { patient: "Marta León", phone: "555-1200", day: "Mié", time: "09:00", reason: "Ortodoncia", doctor: "Dr. Carlos Pérez", notes: "Ajuste de brackets" },
    { patient: "Sofía Muñoz", phone: "555-8822", day: "Jue", time: "10:00", reason: "Limpieza Dental", doctor: "Dra. Marta Ruiz", notes: "Seguimiento" },
    { patient: "Pedro Rivas", phone: "555-9921", day: "Vie", time: "11:00", reason: "Urgencia", doctor: "Dr. Carlos Pérez", notes: "Inflamación" },
    { patient: "Carla Pineda", phone: "555-4456", day: "Vie", time: "12:00", reason: "Revisión", doctor: "Dra. Marta Ruiz", notes: "Paciente nueva" },
  ].map((item, i) => ({
    id: `a-${Date.now()}-${i}`,
    ...item,
    date: normalizeDemoDate(item.day),
    status: "Programada",
    whatsapp: i % 2 === 0,
  }));

  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(seed));
  return seed;
}

let appointments = loadAppointments();

function saveAppointments() {
  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments));
}

function showView(viewName) {
  views.login.classList.toggle("hidden", viewName !== "login");
  views.agenda.classList.toggle("hidden", viewName !== "agenda");
}

function showLoginError(message) {
  loginAlert.textContent = message;
  loginAlert.style.display = "block";
}

function clearLoginError() {
  loginAlert.textContent = "";
  loginAlert.style.display = "none";
}

function parseDayFromDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const map = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return map[d.getDay()] || "Lun";
}

function roundedHour(time) {
  const [h] = time.split(":").map(Number);
  return `${String(h).padStart(2, "0")}:00`;
}

function openAppointmentModal(item = null) {
  modalTitle.textContent = item ? "Editar Cita" : "Nueva Cita";
  cancelAppointmentBtn.style.display = item ? "inline-block" : "none";

  formFields.id.value = item?.id || "";
  formFields.patient.value = item?.patient || "";
  formFields.phone.value = item?.phone || "";
  formFields.date.value = item?.date || normalizeDemoDate(selectedDay);
  formFields.time.value = item?.time || "10:00";
  formFields.reason.value = item?.reason || "";
  formFields.doctor.value = item?.doctor || "Dra. Marta Ruiz";
  formFields.notes.value = item?.notes || "";
  formFields.whatsapp.checked = !!item?.whatsapp;

  modal.showModal();
}

function closeModal() {
  if (modal.open) modal.close();
}

function createWeeklyGrid() {
  weeklyGrid.innerHTML = "";
  weeklyGrid.appendChild(createCell("", "header"));
  DAY_ORDER.forEach((day) => weeklyGrid.appendChild(createCell(day, "header")));

  TIME_SLOTS.forEach((slot) => {
    weeklyGrid.appendChild(createCell(slot, "time"));
    DAY_ORDER.forEach((day) => {
      const cell = createCell("", "body");
      const appts = appointments.filter((a) => parseDayFromDate(a.date) === day && roundedHour(a.time) === slot);
      appts.forEach((appt, index) => {
        const card = document.createElement("div");
        card.className = `appointment-block ${appt.status === "Cancelada" ? "cancelled" : ""}`;
        card.style.background = COLOR_CLASSES[index % COLOR_CLASSES.length];
        card.innerHTML = `<strong>${appt.patient}</strong><span>${appt.reason}</span>`;
        card.title = `${appt.time} - ${appt.patient}`;
        card.onclick = () => openAppointmentModal(appt);
        cell.appendChild(card);
      });
      weeklyGrid.appendChild(cell);
    });
  });
}

function createCell(text, type) {
  const div = document.createElement("div");
  div.className = `cell ${type}`;
  div.textContent = text;
  return div;
}

function createMobileDayChips() {
  mobileDaySelector.innerHTML = "";
  DAY_ORDER.forEach((day) => {
    const chip = document.createElement("button");
    chip.className = `day-chip ${selectedDay === day ? "active" : ""}`;
    chip.textContent = day;
    chip.onclick = () => {
      selectedDay = day;
      createMobileDayChips();
      renderMobileAppointments();
    };
    mobileDaySelector.appendChild(chip);
  });
}

function renderMobileAppointments() {
  mobileAppointments.innerHTML = "";
  const dayItems = appointments
    .filter((a) => parseDayFromDate(a.date) === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!dayItems.length) {
    mobileAppointments.innerHTML = `<p class="muted">Sin citas para ${selectedDay}.</p>`;
    return;
  }

  dayItems.forEach((appt) => {
    const card = document.createElement("article");
    card.className = "mobile-card";
    card.innerHTML = `
      <strong>${appt.time} · ${appt.patient}</strong>
      <p>${appt.reason}</p>
      <small>${appt.doctor} ${appt.status === "Cancelada" ? "· Cancelada" : ""}</small>
    `;
    if (appt.status === "Cancelada") card.style.opacity = "0.6";
    card.onclick = () => openAppointmentModal(appt);
    mobileAppointments.appendChild(card);
  });
}

function renderSidePanels() {
  const sorted = [...appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const nextThree = sorted.filter((a) => a.status !== "Cancelada").slice(0, 3);
  upcomingList.innerHTML = nextThree.map((a) => `<li>${a.time} · ${a.patient} (${a.reason})</li>`).join("");

  remindersList.innerHTML = sorted
    .filter((a) => a.whatsapp)
    .slice(0, 2)
    .map((a) => `<li>WhatsApp: ${a.patient} - ${a.time}</li>`)
    .join("");

  statScheduled.textContent = appointments.filter((a) => a.status === "Programada").length;
  statCompleted.textContent = appointments.filter((a) => a.status === "Completada").length;
  statCancelled.textContent = appointments.filter((a) => a.status === "Cancelada").length;
}

function refreshAgenda() {
  createWeeklyGrid();
  createMobileDayChips();
  renderMobileAppointments();
  renderSidePanels();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearLoginError();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const remember = document.getElementById("remember-me").checked;

  const user = USERS.find((u) => u.email === email && u.password === password);

  if (!user) {
    showLoginError("Credenciales inválidas. Verifica tu correo y contraseña.");
    return;
  }

  setSession({ userRole: user.role, userName: user.name, email: user.email }, remember);
  initializeApp();
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  showView("login");
});

document.getElementById("new-appointment-desktop").addEventListener("click", () => openAppointmentModal());
document.getElementById("new-appointment-mobile").addEventListener("click", () => openAppointmentModal());
closeModalBtn.addEventListener("click", closeModal);

cancelAppointmentBtn.addEventListener("click", () => {
  const id = formFields.id.value;
  if (!id) return;

  appointments = appointments.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "Cancelada",
        }
      : item
  );

  saveAppointments();
  refreshAgenda();
  closeModal();
});

appointmentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    id: formFields.id.value || `a-${Date.now()}`,
    patient: formFields.patient.value.trim(),
    phone: formFields.phone.value.trim(),
    date: formFields.date.value,
    day: parseDayFromDate(formFields.date.value),
    time: formFields.time.value,
    reason: formFields.reason.value,
    doctor: formFields.doctor.value,
    notes: formFields.notes.value.trim(),
    whatsapp: formFields.whatsapp.checked,
    status: "Programada",
  };

  if (formFields.id.value) {
    const current = appointments.find((a) => a.id === formFields.id.value);
    payload.status = current?.status || "Programada";
    appointments = appointments.map((a) => (a.id === payload.id ? payload : a));
  } else {
    appointments.push(payload);
  }

  saveAppointments();
  refreshAgenda();
  closeModal();
});

function initializeApp() {
  const session = activeSession();
  if (!session) {
    showView("login");
    return;
  }

  rolePill.textContent = `${session.userName} · ${session.userRole}`;
  showView("agenda");
  refreshAgenda();
}

initializeApp();
