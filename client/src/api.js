export const BASE_URL = "http://localhost:5000";

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