import {
  buildAnalytics,
  getCompanyMatches,
  getStudentInsights,
} from "./analysis.js";
import { avatarMarkup } from "./profile.js";
import {
  allowedRoutes,
  canEditPlacementStatus,
  canEditStudents,
  canManageCompanies,
  canManageDatasets,
  canManageFaculty,
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
  const lower = String(status || "").toLowerCase();
  if (lower.includes("placed")) return "selected";
  if (lower.includes("interview")) return "warning";
  return "applied";
}

function studentActions(student, role, viewState) {
  if (!canEditStudents(role)) return "";
  if (viewState.editingStudentId === student.id) {
    return `
      <td class="row-actions">
        <button class="button primary small" type="button" data-save-edit="${student.id}">Save</button>
        <button class="button secondary small" type="button" data-cancel-edit="${student.id}">Cancel</button>
      </td>
    `;
  }
  return `
    <td class="row-actions">
      <button class="button secondary small" type="button" data-start-edit="${student.id}">Edit</button>
    </td>
  `;
}

function renderStudentRow(student, role, viewState) {
  const isEditing = canEditStudents(role) && viewState.editingStudentId === student.id;
  if (!isEditing) {
    return `
      <tr>
        <td><strong>${student.name}</strong><br><small>${student.email}</small></td>
        <td>${student.department.toUpperCase()}</td>
        <td>${student.cgpa.toFixed(2)}</td>
        <td>${Math.round(student.resumeScore)}</td>
        <td>${student.skills.slice(0, 4).join(", ") || "-"}</td>
        <td><span class="status ${statusClass(student.placementStatus)}">${student.placementStatus}</span></td>
        ${canEditStudents(role) ? studentActions(student, role, viewState) : ""}
      </tr>
    `;
  }

  return `
    <tr class="editing-row" data-edit-row="${student.id}">
      <td>
        <strong>${student.name}</strong><br><small>${student.email}</small>
      </td>
      <td>${student.department.toUpperCase()}</td>
      <td><input class="table-input" data-field="cgpa" type="number" min="0" max="10" step="0.01" value="${student.cgpa}" /></td>
      <td><input class="table-input" data-field="resumeScore" type="number" min="0" max="100" step="1" value="${student.resumeScore}" /></td>
      <td><input class="table-input" data-field="skills" type="text" value="${student.skills.join(", ")}" /></td>
      <td>
        ${
          canEditPlacementStatus(role)
            ? `
              <select class="table-input" data-field="placementStatus">
                ${["Not Placed", "Shortlisted", "Interviewing", "Placed"]
                  .map((status) => `<option value="${status}" ${status === student.placementStatus ? "selected" : ""}>${status}</option>`)
                  .join("")}
              </select>
            `
            : `<span class="status ${statusClass(student.placementStatus)}">${student.placementStatus}</span>`
        }
      </td>
      ${studentActions(student, role, viewState)}
    </tr>
  `;
}

function renderStudentsTable(students, role, viewState) {
  const actionHead = canEditStudents(role) ? "<th>Actions</th>" : "";
  const body = students.length
    ? students.map((student) => renderStudentRow(student, role, viewState)).join("")
    : `<tr><td colspan="${canEditStudents(role) ? 7 : 6}">No student records found.</td></tr>`;

  return `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Department</th>
          <th>CGPA</th>
          <th>Resume Score</th>
          <th>Skills</th>
          <th>Placement Status</th>
          ${actionHead}
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function renderStudentDashboard(student, companies, resume) {
  const insights = getStudentInsights(student, companies, resume);
  return `
    <section class="two-column">
      <article class="card span-4">
        <span class="eyebrow">Profile Strength</span>
        <h3>${insights.profileStrength}%</h3>
        <div class="metric-stack">
          <div class="metric-line"><span>Placement readiness</span><strong>${insights.readiness.label}</strong></div>
          <div class="metric-line"><span>Best fit role</span><strong>${insights.bestFitRole}</strong></div>
          <div class="metric-line"><span>Eligible companies</span><strong>${insights.eligibleCompanies.length}</strong></div>
        </div>
      </article>
      <article class="card span-4">
        <span class="eyebrow">Resume Score Breakdown</span>
        <h3>${resume?.score || student.resumeScore}</h3>
        <div class="metric-stack">
          <div class="metric-line"><span>Structure</span><strong>${insights.resumeBreakdown.structure}/35</strong></div>
          <div class="metric-line"><span>Content</span><strong>${insights.resumeBreakdown.content}/30</strong></div>
          <div class="metric-line"><span>Skills</span><strong>${insights.resumeBreakdown.skills}/20</strong></div>
          <div class="metric-line"><span>Impact</span><strong>${insights.resumeBreakdown.impact}/15</strong></div>
        </div>
      </article>
      <article class="card span-4">
        <span class="eyebrow">Gap Analysis</span>
        <h3>Priority Skills</h3>
        <div class="skill-list">
          ${insights.gapAnalysis.length ? insights.gapAnalysis.map((skill) => `<span class="skill-pill">${skill}</span>`).join("") : `<span class="skill-pill">No major gaps</span>`}
        </div>
      </article>
    </section>
    <section class="two-column">
      <article class="card span-7">
        <span class="eyebrow">Eligible Companies</span>
        <h3>Best matches</h3>
        <div class="list">
          ${
            insights.companyMatches.slice(0, 6).map((company) => `
              <div class="activity-item">
                <strong>${company.name}</strong> | ${company.roles.join(", ")} | ${company.packageLPA} LPA
                <br />
                Match Score: ${company.matchScore}% | ${company.eligible ? "Eligible" : company.gapSummary}
              </div>
            `).join("") || `<div class="activity-item">No companies available.</div>`
          }
        </div>
      </article>
      <article class="card span-5">
        <span class="eyebrow">Recommendations</span>
        <h3>Action Plan</h3>
        <div class="list">
          ${insights.placementTips.map((tip) => `<div class="activity-item">${tip}</div>`).join("")}
        </div>
        <div class="inline-note">Suggested learning areas are generated from missing company requirements and role demand.</div>
      </article>
    </section>
    <section class="card">
      <span class="eyebrow">Suggested Courses</span>
      <h3>Learning areas to close gaps</h3>
      <div class="course-grid">
        ${insights.suggestedCourses.map((course) => `<div class="activity-item"><strong>${course.area}</strong><br>${course.reason}</div>`).join("") || `<div class="activity-item">No course recommendations yet.</div>`}
      </div>
    </section>
  `;
}

export function getFilteredStudents(state, filters, currentUser) {
  const baseStudents = canViewAllStudents(currentUser.role)
    ? state.students
    : state.students.filter((student) => student.email === currentUser.email);

  return baseStudents
    .filter((student) => {
      const departmentMatch = filters.department === "all" || student.department === filters.department;
      const statusMatch = filters.status === "all" || student.placementStatus === filters.status;
      const searchMatch =
        !filters.query ||
        student.name.toLowerCase().includes(filters.query) ||
        student.email.toLowerCase().includes(filters.query) ||
        student.department.toLowerCase().includes(filters.query);
      return departmentMatch && statusMatch && searchMatch;
    })
    .sort((left, right) => {
      if (filters.sort === "cgpa") return Number(right.cgpa) - Number(left.cgpa);
      if (filters.sort === "resume") return Number(right.resumeScore) - Number(left.resumeScore);
      return left.name.localeCompare(right.name);
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

export function renderStudentsSection(container, students, role, viewState) {
  container.innerHTML = renderStudentsTable(students, role, viewState);
}

export function renderRoute(container, state, currentUser, route, filteredStudents, profile = {}, viewState = {}) {
  if (route === "dashboard") {
    if (currentUser.role === ROLES.STUDENT) {
      const student = state.students.find((item) => item.email === currentUser.email);
      const resume = state.resumes?.[student?.id];
      container.innerHTML = student
        ? renderStudentDashboard(student, state.companies, resume)
        : `<section class="card"><h3>No student record found</h3></section>`;
      return;
    }

    const analytics = buildAnalytics(filteredStudents, state.companies);
    container.innerHTML = `
      <section class="two-column">
        <article class="card span-8">
          <span class="eyebrow">Operational Overview</span>
          <h3>Student pipeline</h3>
          <div class="table">${renderStudentsTable(filteredStudents.slice(0, 8), currentUser.role, viewState)}</div>
        </article>
        <article class="card span-4">
          <span class="eyebrow">Insights</span>
          <h3>Placement summary</h3>
          <div class="metric-stack">
            <div class="metric-line"><span>Departments tracked</span><strong>${analytics.departmentRows.length}</strong></div>
            <div class="metric-line"><span>Roles in demand</span><strong>${analytics.roleDemand.length}</strong></div>
            <div class="metric-line"><span>Avg CGPA</span><strong>${analytics.avgCgpa}</strong></div>
            <div class="metric-line"><span>Avg Resume Score</span><strong>${analytics.avgResumeScore}</strong></div>
          </div>
        </article>
      </section>
    `;
    return;
  }

  if (route === "students") {
    container.innerHTML = `
      <section class="card">
        <span class="eyebrow">Students</span>
        <h3>All student records</h3>
        <div class="table">${renderStudentsTable(filteredStudents, currentUser.role, viewState)}</div>
      </section>
    `;
    return;
  }

  if (route === "resume") {
    const student = state.students.find((item) => item.email === currentUser.email) || filteredStudents[0];
    const resume = state.resumes?.[student?.id];
    container.innerHTML = `
      <section class="two-column">
        <article class="card span-5">
          <span class="eyebrow">Resume Analyzer</span>
          <h3>Upload Resume</h3>
          <label class="dropzone" id="dropzone">
            <input id="resumeInput" class="hidden" type="file" accept=".pdf,.txt" />
            <span><strong>Upload PDF or Text Resume</strong><br><small>PDF/TXT only, 2 MB max</small></span>
          </label>
          <div class="progress-shell ${viewState.resumeProgress ? "" : "hidden"}">
            <div class="progress-bar" style="width:${viewState.resumeProgress || 0}%"></div>
          </div>
          <p class="inline-note">${viewState.resumeStatus || "The analyzer checks structure, impact, skills, repetition, and improvement opportunities."}</p>
        </article>
        <article class="card span-7">
          <span class="eyebrow">Parsed Output</span>
          <h3>Resume Details</h3>
          ${
            resume
              ? `
                <div class="metric-stack">
                  <div class="metric-line"><span>Resume Score</span><strong>${resume.score}</strong></div>
                  <div class="metric-line"><span>Education</span><strong>${resume.education}</strong></div>
                  <div class="metric-line"><span>Experience</span><strong>${resume.experience}</strong></div>
                </div>
                <div class="two-column compact-grid">
                  <div class="card span-6 nested-card">
                    <span class="eyebrow">Strengths</span>
                    <div class="list">${(resume.strengths || []).map((item) => `<div class="activity-item">${item}</div>`).join("") || `<div class="activity-item">No strong strengths identified yet.</div>`}</div>
                  </div>
                  <div class="card span-6 nested-card">
                    <span class="eyebrow">Weak Areas</span>
                    <div class="list">${(resume.weakAreas || []).map((item) => `<div class="activity-item">${item}</div>`).join("") || `<div class="activity-item">No major weak areas detected.</div>`}</div>
                  </div>
                </div>
                <div class="list">
                  ${(resume.suggestions || []).map((item) => `<div class="activity-item">${item}</div>`).join("") || `<div class="activity-item">Suggestions will appear after analysis.</div>`}
                </div>
                <div class="two-column compact-grid">
                  <div class="card span-6 nested-card">
                    <span class="eyebrow">Grammar Flags</span>
                    <div class="list">${(resume.grammarFlags || []).map((item) => `<div class="activity-item">${item}</div>`).join("") || `<div class="activity-item">No major grammar or phrasing alerts.</div>`}</div>
                  </div>
                  <div class="card span-6 nested-card">
                    <span class="eyebrow">Generic Content Signals</span>
                    <div class="list">${(resume.aiSignals || []).map((item) => `<div class="activity-item">${item}</div>`).join("") || `<div class="activity-item">No strong generic-content signals found.</div>`}</div>
                  </div>
                </div>
              `
              : `<div class="list"><div class="activity-item">Upload a resume to see extracted skills, education, experience, grammar flags, and line-by-line feedback.</div></div>`
          }
        </article>
      </section>
    `;
    return;
  }

  if (route === "applications") {
    const student = state.students.find((item) => item.email === currentUser.email);
    const companies = currentUser.role === ROLES.STUDENT && student
      ? getCompanyMatches(student, state.companies)
      : state.companies.map((company) => ({ ...company, matchScore: "-", gapSummary: "-" }));

    container.innerHTML = `
      <section class="card">
        <span class="eyebrow">Applications</span>
        <h3>${currentUser.role === ROLES.STUDENT ? "Eligible companies and fit analysis" : "Company list"}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Roles</th>
              <th>Departments</th>
              <th>Min CGPA</th>
              <th>Resume Score</th>
              <th>Match</th>
              <th>Gap</th>
              ${canManageCompanies(currentUser.role) ? "<th>Actions</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${companies.map((company) => `
              <tr>
                <td>${company.name}</td>
                <td>${company.roles.join(", ")}</td>
                <td>${company.eligibleDepartments.join(", ").toUpperCase()}</td>
                <td>${company.minCGPA}</td>
                <td>${company.minResumeScore}</td>
                <td>${company.matchScore === "-" ? "-" : `${company.matchScore}%`}</td>
                <td>${company.gapSummary || "-"}</td>
                ${canManageCompanies(currentUser.role) ? `<td><button class="button secondary small" type="button" data-edit-company="${company.id}">Edit</button> <button class="button danger small" type="button" data-delete-company="${company.id}">Delete</button></td>` : ""}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    `;
    return;
  }

  if (route === "analytics") {
    const analytics = buildAnalytics(filteredStudents, state.companies);
    container.innerHTML = canViewAnalytics(currentUser.role)
      ? `
        <section class="two-column">
          <article class="card span-7">
            <span class="eyebrow">Department Analysis</span>
            <h3>Department placement health</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Placed</th>
                  <th>Placement Rate</th>
                  <th>Avg CGPA</th>
                  <th>Avg Resume</th>
                </tr>
              </thead>
              <tbody>
                ${analytics.departmentRows.map((row) => `
                  <tr>
                    <td>${row.department.toUpperCase()}</td>
                    <td>${row.total}</td>
                    <td>${row.placed}</td>
                    <td>${row.placementRate}%</td>
                    <td>${row.avgCgpa}</td>
                    <td>${row.avgResume}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </article>
          <article class="card span-5">
            <span class="eyebrow">Role Demand</span>
            <h3>Company role demand</h3>
            <div class="list">
              ${analytics.roleDemand.slice(0, 8).map((row) => `<div class="activity-item"><strong>${row.role}</strong><br>${row.count} companies hiring</div>`).join("")}
            </div>
          </article>
        </section>
      `
      : "";
    return;
  }

  if (route === "profile") {
    const managementControls = canManageDatasets(currentUser.role)
      ? `
        <section class="two-column">
          <form class="card span-6" id="datasetImportForm">
            <span class="eyebrow">Dataset Upload</span>
            <h3>Replace dataset</h3>
            <label>Dataset type
              <select id="datasetType">
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="tnp_officers">TNP Officers</option>
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
            <label>Required Skills<input id="companySkills" placeholder="Comma separated" required /></label>
            <label>Min CGPA<input id="companyCgpa" type="number" step="0.1" required /></label>
            <label>Min Resume Score<input id="companyResume" type="number" required /></label>
            <label>Package LPA<input id="companyPackage" type="number" step="0.1" required /></label>
            <button class="button primary" type="submit">Save Company</button>
          </form>
        </section>
      `
      : "";

    const facultyControls = canManageFaculty(currentUser.role)
      ? `
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
      </section>
      <section class="card">
        <span class="eyebrow">Verification</span>
        <h3>Identity and access</h3>
        <div class="profile-grid">
          <div class="activity-item"><strong>OTP mode</strong><br>In-app verification</div>
          <div class="activity-item"><strong>Last profile sync</strong><br>${profile.updatedAt || "Not synced yet"}</div>
        </div>
      </section>
      ${managementControls}
      ${facultyControls}
    `;
  }
}
