import "./app.js";

const appExports = globalThis.__BUGSOFT_APP__ || {};

export const setSession = appExports.setSession;
export const activeSession = appExports.activeSession;
export const clearSession = appExports.clearSession;
export const parseDayFromDate = appExports.parseDayFromDate;
export const roundedHour = appExports.roundedHour;
export const normalizeDemoDate = appExports.normalizeDemoDate;
export const apiRequest = appExports.apiRequest;
export const renderMobileAppointments = appExports.renderMobileAppointments;
export const createMobileDayChips = appExports.createMobileDayChips;
export const __setAppointments = appExports.__setAppointments;
export const __setSelectedDay = appExports.__setSelectedDay;
