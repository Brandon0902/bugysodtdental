import { beforeEach, describe, expect, it, vi } from "vitest";

function buildDom() {
  document.body.innerHTML = `
    <section id="login-view"></section>
    <section id="agenda-view"></section>
    <form id="login-form"></form>
    <div id="login-alert"></div>
    <div id="role-pill"></div>
    <button id="logout-btn"></button>
    <div id="weekly-grid"></div>
    <ul id="upcoming-list"></ul>
    <ul id="reminders-list"></ul>
    <div id="mobile-appointments"></div>
    <div class="mobile-day-selector"></div>
    <dialog id="appointment-modal"></dialog>
    <h3 id="modal-title"></h3>
    <form id="appointment-form"></form>
    <button id="cancel-appointment"></button>
    <button id="close-modal"></button>
    <span id="stat-scheduled"></span>
    <span id="stat-completed"></span>
    <span id="stat-cancelled"></span>
    <input id="appointment-id" />
    <input id="patient" />
    <input id="phone" />
    <input id="date" />
    <input id="time" />
    <input id="reason" />
    <input id="doctor" />
    <textarea id="notes"></textarea>
    <input id="whatsapp" type="checkbox" />
    <input id="email" />
    <input id="password" />
    <input id="remember-me" type="checkbox" />
    <button id="new-appointment-desktop"></button>
    <button id="new-appointment-mobile"></button>
  `;
}

let app;

beforeEach(async () => {
  vi.resetModules();
  buildDom();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  app = await import(`../../public/app.exports.js?bust=${Date.now()}`);
});

describe("ui helpers", () => {
  it('renderMobileAppointments muestra "Sin citas" cuando no hay resultados', () => {
    app.__setAppointments([]);
    app.__setSelectedDay("Lun");

    app.renderMobileAppointments();

    expect(document.getElementById("mobile-appointments").textContent).toContain("Sin citas");
  });

  it("renderMobileAppointments crea tarjetas con paciente y motivo", () => {
    app.__setSelectedDay("Lun");
    app.__setAppointments([
      {
        date: "2026-03-02",
        time: "10:00",
        patient: "Ana",
        reason: "Revisión",
        doctor: "Dra. Ruiz",
        status: "Programada",
      },
    ]);

    app.renderMobileAppointments();

    const cards = document.querySelectorAll("#mobile-appointments .mobile-card");
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain("Ana");
    expect(cards[0].textContent).toContain("Revisión");
  });

  it("createMobileDayChips crea botones y marca el seleccionado", () => {
    app.__setSelectedDay("Mar");

    app.createMobileDayChips();

    const chips = document.querySelectorAll(".mobile-day-selector .day-chip");
    expect(chips.length).toBe(5);
    const active = document.querySelector(".mobile-day-selector .day-chip.active");
    expect(active.textContent).toBe("Mar");
  });
});
