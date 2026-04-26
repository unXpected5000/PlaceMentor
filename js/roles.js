export const ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  TNP: "tnp_officer",
};

export const ROUTES_BY_ROLE = {
  [ROLES.STUDENT]: ["dashboard", "resume", "applications", "profile"],
  [ROLES.FACULTY]: ["dashboard", "students", "resume", "analytics", "profile"],
  [ROLES.TNP]: ["dashboard", "students", "resume", "applications", "analytics", "profile"],
};

export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (["tnp", "admin", "tnp officer", "tnp_officer", "placement head"].includes(value)) {
    return ROLES.TNP;
  }
  if (["teacher", "faculty", "hod"].includes(value)) {
    return ROLES.FACULTY;
  }
  return ROLES.STUDENT;
}

export function roleLabel(role) {
  if (role === ROLES.TNP) return "TNP Officer";
  if (role === ROLES.FACULTY) return "Faculty";
  return "Student";
}

export function canManageDatasets(role) {
  return role === ROLES.TNP;
}

export function canManageCompanies(role) {
  return role === ROLES.TNP;
}

export function canManageFaculty(role) {
  return role === ROLES.TNP;
}

export function canEditStudents(role) {
  return role === ROLES.TNP || role === ROLES.FACULTY;
}

export function canEditPlacementStatus(role) {
  return role === ROLES.TNP;
}

export function canViewAllStudents(role) {
  return role === ROLES.TNP || role === ROLES.FACULTY;
}

export function canViewAnalytics(role) {
  return role === ROLES.TNP || role === ROLES.FACULTY;
}

export function allowedRoutes(role) {
  return ROUTES_BY_ROLE[role] || ROUTES_BY_ROLE[ROLES.STUDENT];
}
