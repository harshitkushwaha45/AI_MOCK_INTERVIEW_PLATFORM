export const BASE_URL = "https://ai-mock-interview-platform-1-ofb2.onrender.com";

export const authFetch = (url, options = {}) => {
  return fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...(options.headers || {}),
    },
  });
};