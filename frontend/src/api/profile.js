import axios from "./axios";

export const getProfile = () => {
  return axios.get("/profile");
};
