import axios from "axios";

const API_BASE = "http://localhost:5000";

export const loginTeacher = async (username, password) => {
  return axios.post(`${API_BASE}/api/login`, { username, password });
};

export const createPoll = async (pollData) => {
  return axios.post(`${API_BASE}/api/poll`, pollData);
};

export const getPolls = async () => {
  return axios.get(`${API_BASE}/api/polls`);
};