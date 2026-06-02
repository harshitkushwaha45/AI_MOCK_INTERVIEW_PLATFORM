const RENDER_BACKEND_URL = "https://ai-mock-interview-platform-elvw.onrender.com";
const RENDER_FRONTEND_HOST = "ai-mock-interview-platform-1-ofb2.onrender.com";
const isConfiguredRenderFrontend =
  typeof window !== "undefined" && window.location.hostname === RENDER_FRONTEND_HOST;

const rawBaseUrl =
  import.meta.env.VITE_API_URL || (isConfiguredRenderFrontend ? RENDER_BACKEND_URL : "");

export const BASE_URL = rawBaseUrl.replace(/\/$/, "");

export const readJson = async (response) => {
  const text = await response.text();

  if (!text) {
    throw new Error(`Server returned an empty response (${response.status}).`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned an invalid JSON response (${response.status}).`);
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
