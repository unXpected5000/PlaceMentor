import {
  calculateProfileStrength,
  getEligibleCompanies,
  getPlacementTips,
} from "./data.js";
import { avatarMarkup } from "./profile.js";
import {
  allowedRoutes,
  canEditStudents,
  canManageCompanies,
  canManageDatasets,
  canViewAllStudents,
  canViewAnalytics,
  roleLabel,
  ROLES,
} from "./roles.js";

function average(values) {
  const numeric = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numeric.length) return 0;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function statusClass(status) {
  return String(status || "").toLowerCase().includes("placed") ? "selected" : "applied";
}

function renderStudentsTable(students, role) {
  const actionHead = canEditStudents(role) ? "<th>Actions</th>" : "";
  const actionCells = (student) =>
    canEditStudents(role)
      ? `<td><button class="button secondary" type="button" data-edit-student="${student.id}">Edit</button></td>`
      : "";

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Department</th>
          <th>CGPA</th>
          <th>Resume Score</th>
          <th>Placement Status</th>
          ${actionHead}
        </tr>
      </thead>
      <tbody>
        ${
          students
            .map(
              (student) => `
                <tr>
                  <td><strong>${student.name}</strong><br><small>${student.email}</small></td>
                  <td>${student.department.toUpperCase()}</td>
                  <td>${student.cgpa}</td>
                  <td>${student.resumeScore}</td>
                  <td><span class="status ${statusClass(student.placementStatus)}">${student.placementStatus}</span></td>
                  ${actionCells(student)}
                </tr>
              `
            )
            .join("") || `<tr><td colspan="${canEditStudents(role) ? 6 : 5}">No student records found.</td></tr>`
        }
      </tbody>
    </table>
  `;
}

export function getFilteredStudents(state, filters, currentUser) {
  const baseStudents = canViewAllStudents(currentUser.role)
    ? state.students
    : state.students.filter((student) => student.email === currentUser.email);

  return baseStudents
    .filter((student) => {
      const departmentMatch =
        filters.department === "all" || student.department === filters.department;
      const statusMatch =
        filters.status === "all" || student.placementStatus === filters.status;
      const searchMatch =
        !filters.query ||
        student.name.toLowerCase().includes(filters.query) ||
        student.email.toLowerCase().includes(filters.query) ||
        student.department.toLowerCase().includes(filters.query);
      return departmentMatch && statusMatch && searchMatch;
    })
    .sort((a, b) => {
      if (filters.sort === "cgpa") return Number(b.cgpa) - Number(a.cgpa);
      if (filters.sort === "resume") return Number(b.resumeScore) - Number(a.resumeScore);
      return a.name.localeCompare(b.name);
    });
}

export function renderNav(navElement, currentRoute, role) {
  const labels = {
    dashboard: "Dashboard",
    students: "Students",
    resume: "Resume Analyzer",
    applications: "Applications",
    analytics: "Analytics",
    profile: "Profile",
  };
  const iconClasses = {
    dashboard: "icon-dashboard",
    students: "icon-students",
    resume: "icon-resume",
    applications: "icon-applications",
    analytics: "icon-analytics",
    profile: "icon-profile",
  };

  navElement.innerHTML = allowedRoutes(role)
    .map(
      (route) => `
        <button class="nav-item ${currentRoute === route ? "active" : ""}" data-route="${route}">
          <span class="icon ${iconClasses[route]}" aria-hidden="true"></span>
          ${labels[route]}
        </button>
      `
    )
    .join("");
}

export function renderKpis(container, students) {
  const placements = students.filter((student) => student.placementStatus === "Placed").length;
  const avgCgpa = average(students.map((student) => student.cgpa)).toFixed(2);
  const avgResume = Math.round(average(students.map((student) => student.resumeScore)));
  const kpis = [
    ["Total Students", students.length],
    ["Placed Students", placements],
    ["Avg CGPA", avgCgpa],
    ["Avg Resume Score", avgResume],
  ];
  container.innerHTML = kpis
    .map(([label, value]) => `<article class="kpi"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

export function renderActivity(container, state) {
  container.innerHTML = (state.activity || [])
    .slice(0, 6)
    .map((item) => `<div class="activity-item">${item}</div>`)
    .join("");
}

export function renderStudentsSection(container, students, role) {
  container.innerHTML = renderStudentsTable(students, role);
}

export function renderRoute(container, state, currentUser, route, filteredStudents, profile = {}) {
  if (route === "dashboard") {
    if (currentUser.role === ROLES.STUDENT) {
      const student = state.students.find((item) => item.email === currentUser.email);
      if (!student) {
        container.innerHTML = `<section class="card"><h3>No student record found</h3></section>`;
        return;
      }

      const eligibleCompanies = getEligibleCompanies(student, state.companies);
      const tips = getPlacementTips(student, state.companies);
      const profileStrength = calculateProfileStrength(student);
      container.innerHTML = `
        <section class="two-column">
          <article class="card span-6">
            <span class="eyebrow">Personal Dashboard</span>
            <h3>${student.name}</h3>
            <div class="list">
              <div class="activity-item">Department: ${student.department.toUpperCase()}</div>
              <div class="activity-item">CGPA: ${student.cgpa}</div>
              <div class="activity-item">Resume Score: ${student.resumeScore}</div>
              <div class="activity-item">Placement Status: ${student.placementStatus}</div>
              <div class="activity-item">Profile Strength: ${profileStrength}%</div>
            </div>
          </article>
          <article class="card span-6">
            <span class="eyebrow">Eligibility</span>
            <h3>Eligible Companies</h3>
            <div class="list">
              ${
                eligibleCompanies.length
                  ? eligibleCompanies
                      .map(
                        (company) =>
                          `<div class="activity-item"><strong>${company.name}</strong><br>${company.roles.join(", ")} · ${company.packageLPA} LPA</div>`
                      )
                      .join("")
                  : `<div class="activity-item">No eligible companies currently matched.</div>`
              }
            </div>
          </article>
        </section>
        <section class="two-column">
          <article class="card span-6">
            <span class="eyebrow">Recommendations</span>
            <h3>Skills to improve</h3>
            <div class="skill-list">
              ${(student.skills || []).map((skill) => `<span class="skill-pill">${skill}</span>`).join("")}
            </div>
          </article>
          <article class="card span-6">
            <span class="eyebrow">Placement Tips</span>
            <h3>Context-based guidance</h3>
            <div class="list">
              ${tips.map((tip) => `<div class="activity-item">${tip}</div>`).join("")}
            </div>
          </article>
        </section>
      `;
      return;
    }

    container.innerHTML = `
      <section class="card">
        <span class="eyebrow">Students</span>
        <h3>Student records</h3>
        <div class="table">${renderStudentsTable(filteredStudents, currentUser.role)}</div>
      </section>
    `;
    return;
  }

  if (route === "students") {
    container.innerHTML = `
      <section class="card">
        <span class="eyebrow">Students</span>
        <h3>All student records</h3>
        <div class="table">${renderStudentsTable(filteredStudents, currentUser.role)}</div>
      </section>
    `;
    return;
  }

  if (route === "resume") {
    const student = state.students.find((item) => item.email === currentUser.email) || filteredStudents[0];
    const resume = state.resumes?.[student?.id];
    container.innerHTML = `
      <section class="two-column">
        <article class="card span-6">
          <span class="eyebrow">Resume Analyzer</span>
          <h3>Upload Resume</h3>
          <label class="dropzone" id="dropzone">
            <input id="resumeInput" class="hidden" type="file" accept=".pdf" />
            <span><strong>Upload PDF</strong><br><small>PDF only, 2 MB max</small></span>
          </label>
        </article>
        <article class="card span-6">
          <span class="eyebrow">Parsed Output</span>
          <h3>Resume Details</h3>
          <div class="list">
            <div class="activity-item">Skills: ${(resume?.skills || student?.skills || []).join(", ") || "-"}</div>
            <div class="activity-item">Education: ${resume?.education || `${student?.department?.toUpperCase() || "-"} Year ${student?.year || "-"}`}</div>
            <div class="activity-item">Score: ${resume?.score || student?.resumeScore || 0}</div>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (route === "applications") {
    const companies = currentUser.role === ROLES.STUDENT
      ? getEligibleCompanies(
          state.students.find((item) => item.email === currentUser.email),
          state.companies
        )
      : state.companies;

    container.innerHTML = `
      <section class="card">
        <span class="eyebrow">Applications</span>
        <h3>${currentUser.role === ROLES.STUDENT ? "Eligible companies" : "Company list"}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Roles</th>
              <th>Departments</th>
              <th>Min CGPA</th>
              <th>Resume</th>
              ${canManageCompanies(currentUser.role) ? "<th>Actions</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${
              companies
                .map(
                  (company) => `
                    <tr>
                      <td>${company.name}</td>
                      <td>${company.roles.join(", ")}</td>
                      <td>${company.eligibleDepartments.join(", ").toUpperCase()}</td>
                      <td>${company.minCGPA}</td>
                      <td>${company.minResumeScore}</td>
                      ${canManageCompanies(currentUser.role) ? `<td><button class="button secondary" type="button" data-edit-company="${company.id}">Edit</button> <button class="button danger" type="button" data-delete-company="${company.id}">Delete</button></td>` : ""}
                    </tr>
                  `
                )
                .join("") || `<tr><td colspan="${canManageCompanies(currentUser.role) ? 6 : 5}">No companies found.</td></tr>`
            }
          </tbody>
        </table>
      </section>
    `;
    return;
  }

  if (route === "analytics") {
    container.innerHTML = canViewAnalytics(currentUser.role)
      ? `
        <section class="two-column">
          <article class="card span-6">
            <span class="eyebrow">Departments</span>
            <h3>Department distribution</h3>
            <table class="data-table">
              <thead><tr><th>Department</th><th>Students</th></tr></thead>
              <tbody>
                ${Object.entries(
                  filteredStudents.reduce((acc, student) => {
                    acc[student.department] = (acc[student.department] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .map(([department, count]) => `<tr><td>${department.toUpperCase()}</td><td>${count}</td></tr>`)
                  .join("")}
              </tbody>
            </table>
          </article>
          <article class="card span-6">
            <span class="eyebrow">Placement</span>
            <h3>Status summary</h3>
            <table class="data-table">
              <thead><tr><th>Status</th><th>Students</th></tr></thead>
              <tbody>
                ${Object.entries(
                  filteredStudents.reduce((acc, student) => {
                    acc[student.placementStatus] = (acc[student.placementStatus] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`)
                  .join("")}
              </tbody>
            </table>
          </article>
        </section>
      `
      : "";
    return;
  }

  if (route === "profile") {
    const controls = canManageDatasets(currentUser.role)
      ? `
        <section class="two-column">
          <form class="card span-6" id="datasetImportForm">
            <span class="eyebrow">Dataset Upload</span>
            <h3>Replace dataset</h3>
            <label>Dataset type
              <select id="datasetType">
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="companies">Companies</option>
              </select>
            </label>
            <label>JSON file
              <input id="datasetFile" type="file" accept=".json" />
            </label>
            <button class="button primary" type="submit">Upload Dataset</button>
            <button class="button secondary" type="button" id="resetDatasetsButton">Reset to Asset Data</button>
          </form>
          <form class="card span-6" id="companyForm">
            <span class="eyebrow">Company Management</span>
            <h3>Add / Edit Company</h3>
            <input type="hidden" id="companyId" />
            <label>Name<input id="companyName" required /></label>
            <label>Roles<input id="companyRoles" placeholder="Comma separated" required /></label>
            <label>Eligible Departments<input id="companyDepartments" placeholder="Comma separated" required /></label>
            <label>Min CGPA<input id="companyCgpa" type="number" step="0.1" required /></label>
            <label>Min Resume Score<input id="companyResume" type="number" required /></label>
            <label>Package LPA<input id="companyPackage" type="number" step="0.1" required /></label>
            <button class="button primary" type="submit">Save Company</button>
          </form>
        </section>
        <form class="card" id="facultyForm">
          <span class="eyebrow">Faculty Accounts</span>
          <h3>Add Faculty Account</h3>
          <div class="filter-row">
            <input id="facultyName" placeholder="Faculty name" required />
            <input id="facultyEmail" placeholder="Faculty email" type="email" required />
            <input id="facultyDepartment" placeholder="Department" required />
            <button class="button primary" type="submit">Add Faculty</button>
          </div>
        </form>
      `
      : "";

    container.innerHTML = `
      <section class="card">
        <span class="eyebrow">Profile</span>
        <div class="profile-hero">
          ${avatarMarkup(currentUser.name, profile.imageUrl, "profile-avatar")}
          <div>
            <h3>${currentUser.name}</h3>
            <div class="list">
              <div class="activity-item">Email: ${currentUser.email}</div>
              <div class="activity-item">Role: ${roleLabel(currentUser.role)}</div>
              <div class="activity-item">Department: ${currentUser.department.toUpperCase()}</div>
            </div>
          </div>
        </div>
        <form id="profilePhotoForm" class="profile-actions">
          <label class="button secondary" for="profilePhotoInput">Choose Photo</label>
          <input id="profilePhotoInput" class="hidden" type="file" accept="image/png,image/jpeg,image/webp" />
          <button class="button primary" type="submit">Upload Photo</button>
          <button class="button secondary" type="button" id="refreshProfileButton">Refresh Profile</button>
          ${profile.imageUrl ? `<button class="button danger" type="button" id="removePhotoButton">Remove Photo</button>` : ""}
        </form>
        <p class="inline-note">Photos are stored in Cloudflare storage so they remain visible after login on other devices.</p>
      </section>
      <section class="card">
        <span class="eyebrow">Verification</span>
        <h3>Identity and access</h3>
        <div class="profile-grid">
          <div class="activity-item"><strong>OTP mode</strong><br>In-app verification</div>
          <div class="activity-item"><strong>Last profile sync</strong><br>${profile.updatedAt || "Not synced yet"}</div>
        </div>
      </section>
      ${controls}
    `;
  }
}
