const rawBaseUrl = import.meta.env.VITE_API_URL || "";

export const BASE_URL = rawBaseUrl.replace(/\/$/, "");

export const readJson = async (response) => {
  const text = await response.text();

  if (!text) {
    throw new Error("API is not running at this URL. Check your Render backend deployment.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned an invalid response");
  }
};

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
