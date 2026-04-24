const OTP_EXPIRY_MS = 5 * 60 * 1000;

export function formatOtpExpiry(expiresAt) {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isOtpExpired(expiresAt) {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
}

export function createOtpNotice(response) {
  if (!response?.otpPreview) {
    return "Verification code generated. Enter the 6-digit code to continue.";
  }

  return `Verification code: ${response.otpPreview}. This free mode shows the OTP in-app because no outbound email service is configured.`;
}

export function defaultOtpExpiry() {
  return new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
}
