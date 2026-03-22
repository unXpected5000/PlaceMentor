import { auth } from "./firebase.js";
import { appConfig } from "./config.js";

async function getAuthToken() {
  if (!auth || !auth.currentUser) {
    throw new Error("Please login first.");
  }

  return auth.currentUser.getIdToken();
}

async function apiRequest(path, options = {}) {
  const token = await getAuthToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export { apiRequest };
