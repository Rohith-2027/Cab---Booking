import axios from "./axios";

export const getMyNotifications = () => {
  return axios.get("/notifications");
};
