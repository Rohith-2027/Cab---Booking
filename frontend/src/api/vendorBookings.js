import api from "./axios";

export const getVendorBookings = () =>
  api.get("/vendor/bookings");

export const acceptBooking = (bookingId) =>
  api.post(`/vendor/bookings/${bookingId}/accept`);

export const getAvailableDrivers = () =>
  api.get("/vendor/drivers/available");

export const getAvailableVehicles = () =>
  api.get("/vendor/vehicles/available");

export const assignDriverAndVehicle = (bookingId, payload) =>
  api.post(`/vendor/bookings/${bookingId}/assign`, payload);

export const getVendorBookingHistory = () =>
  api.get("/vendor/bookings/history");

export const getVendorPayments = () =>
  api.get("/vendor/payments");
