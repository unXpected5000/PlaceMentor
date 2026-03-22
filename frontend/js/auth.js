import {
  auth,
  hasFirebaseConfig,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "./firebase.js";

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const statusMessage = document.getElementById("statusMessage");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");
const verifyEmailInfoButton = document.getElementById("verifyEmailInfoButton");

function showMessage(message, type = "info") {
  statusMessage.className =
    "mb-4 rounded-2xl px-4 py-3 text-sm " +
    (type === "error"
      ? "bg-red-500/15 text-red-200"
      : "bg-emerald-500/15 text-emerald-200");
  statusMessage.textContent = message;
  statusMessage.classList.remove("hidden");
}

function switchTab(target) {
  const isLogin = target === "login";
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  loginTab.className = isLogin
    ? "flex-1 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white"
    : "flex-1 rounded-xl px-4 py-3 font-semibold text-slate-300";
  registerTab.className = !isLogin
    ? "flex-1 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white"
    : "flex-1 rounded-xl px-4 py-3 font-semibold text-slate-300";
}

loginTab.addEventListener("click", () => switchTab("login"));
registerTab.addEventListener("click", () => switchTab("register"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    if (!hasFirebaseConfig() || !auth) {
      throw new Error("Update frontend/js/config.js with your Firebase web credentials.");
    }

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/dashboard";
  } catch (error) {
    showMessage(error.message, "error");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    if (!hasFirebaseConfig() || !auth) {
      throw new Error("Update frontend/js/config.js with your Firebase web credentials.");
    }

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const role = document.getElementById("registerRole").value;
    const department = document.getElementById("registerDepartment").value.trim();

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();

    const response = await fetch("/api/auth/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        uid: credential.user.uid,
        name,
        email,
        role,
        department,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to save user profile");
    }

    await sendEmailVerification(credential.user);

    showMessage("Account created. Verification email sent. Redirecting to dashboard...");
    window.setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  } catch (error) {
    showMessage(error.message, "error");
  }
});

forgotPasswordButton?.addEventListener("click", async () => {
  try {
    if (!hasFirebaseConfig() || !auth) {
      throw new Error("Update frontend/js/config.js with your Firebase web credentials.");
    }

    const email = document.getElementById("loginEmail").value.trim();
    if (!email) {
      throw new Error("Enter your email first, then click Forgot Password.");
    }

    await sendPasswordResetEmail(auth, email);
    showMessage("Password reset email sent. Check your inbox.");
  } catch (error) {
    showMessage(error.message, "error");
  }
});

verifyEmailInfoButton?.addEventListener("click", () => {
  showMessage("A verification email is sent right after registration. You can continue testing before enforcing verification.");
});

if (!hasFirebaseConfig()) {
  showMessage(
    "Firebase config is missing. Edit frontend/js/config.js and backend/.env before testing auth.",
    "error"
  );
}
