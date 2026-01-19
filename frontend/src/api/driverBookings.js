import api from "./axios";

/* Get driver bookings */
export const getDriverBookings = () =>
  api.get("/driver/bookings");

/* Start trip */
export const startTrip = (bookingId) =>
  api.post(`/driver/bookings/${bookingId}/start`);

/* End trip */
export const endTrip = (bookingId) =>
  api.post(`/driver/bookings/${bookingId}/end`);

/* Confirm cash payment */
export const confirmCashPayment = (bookingId) =>
  api.post(`/driver/payments/${bookingId}/cash/confirm`);

/* Driver trip history */
export const getDriverTripHistory = () =>
  api.get("/driver/bookings/history");
