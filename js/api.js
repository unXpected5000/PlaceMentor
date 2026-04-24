const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }
  return data;
}

export function login(email, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getData() {
  return request("/data");
}

export function importDataset(payload) {
  return request("/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function analyzeResume(payload) {
  return request("/resume/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestOtp(email) {
  return request("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email, code) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function getProfile(email) {
  return request(`/profile?email=${encodeURIComponent(email)}`);
}

export function uploadProfilePhoto(payload) {
  return request("/profile/photo", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteProfilePhoto(email) {
  return request(`/profile/photo?email=${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}
