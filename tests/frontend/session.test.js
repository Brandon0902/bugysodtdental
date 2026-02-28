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
  localStorage.clear();
  sessionStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
  app = await import(`../../public/app.exports.js?bust=${Date.now()}`);
});

describe("session and helpers", () => {
  it("setSession/activeSession/clearSession funcionan correctamente", () => {
    app.setSession({ email: "test@bugsoft.com" }, true);
    expect(app.activeSession()).toEqual({ email: "test@bugsoft.com" });

    app.clearSession();
    expect(app.activeSession()).toBeNull();
  });

  it("parseDayFromDate y roundedHour retornan valores esperados", () => {
    expect(app.parseDayFromDate("2026-03-02")).toBe("Lun");
    expect(app.roundedHour("12:45")).toBe("12:00");
  });

  it("normalizeDemoDate devuelve formato YYYY-MM-DD", () => {
    expect(app.normalizeDemoDate("Lun")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("apiRequest retorna json y lanza error cuando fetch falla", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await expect(app.apiRequest("/api/ok")).resolves.toEqual({ ok: true });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Error controlado" }),
    });

    await expect(app.apiRequest("/api/fail")).rejects.toThrow("Error controlado");
  });
});
