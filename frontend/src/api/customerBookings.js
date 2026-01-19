import axios from "./axios";

// Get logged-in customer's bookings
export const getMyBookings = () => {
  return axios.get("/bookings/my");
};

// Create new booking
export const createBooking = (data) => {
  return axios.post("/bookings", data);
};

// Cancel booking (customer)
export const cancelBooking = (bookingId) => {
  return axios.patch(`/bookings/${bookingId}/cancel`);
};

// Initiate online payment
export const initiateOnlinePayment = (bookingId) => {
  return axios.post(`/payments/${bookingId}/online/initiate`);
};
