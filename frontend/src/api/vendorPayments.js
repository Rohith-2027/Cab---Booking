import api from "./axios";

export const getVendorPayments = () => {
  return api.get("/vendor/payments");
};
