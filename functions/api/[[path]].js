const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

const skillKeywords = [
  "python",
  "java",
  "javascript",
  "html",
  "css",
  "sql",
  "node",
  "react",
  "machine learning",
  "data science",
  "excel",
  "pandas",
  "tensorflow",
  "cloud",
  "linux",
  "communication",
  "analytics",
  "firebase",
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

function getPath(context) {
  return new URL(context.request.url).pathname.replace(/^\/api\/?/, "");
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

function createId(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}

function sanitizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function emailKey(email) {
  return sanitizeEmail(email).replace(/[^a-z0-9._-]/g, "_");
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRole(role) {
  const value = String(role || "student").trim().toLowerCase();
  if (["admin", "tnp", "tnp officer"].includes(value)) return "admin";
  if (["teacher", "faculty"].includes(value)) return "teacher";
  return "student";
}

function normalizePlacementStatus(record) {
  const status = String(record.placementStatus || record.status || record.applicationStatus || "").trim();
  if (!status) return "Applied";
  if (/placed|selected|offer/i.test(status)) return "Selected";
  if (/interview/i.test(status)) return "Interviewing";
  if (/short/i.test(status)) return "Shortlisted";
  if (/not|unplaced|pending/i.test(status)) return "Applied";
  return status;
}

function derivePrediction(record) {
  const explicit = Number(record.prediction || record.placementProbability || 0);
  if (explicit > 0) return explicit;

  const cgpa = Number(record.cgpa || 0);
  const resumeScore = Number(record.resumeScore || record.resume_score || 0);
  const skillCount = parseList(record.skills).length;
  const score = cgpa * 6 + resumeScore * 0.35 + Math.min(skillCount * 4, 18);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function deriveRole(record) {
  if (record.predictedRole || record.predicted_role || record.preferredRole) {
    return record.predictedRole || record.predicted_role || record.preferredRole;
  }

  const skills = parseList(record.skills).map((skill) => skill.toLowerCase());
  if (skills.some((skill) => /blockchain|go|rust|solidity/.test(skill))) return "Blockchain Developer";
  if (skills.some((skill) => /python|machine|data|pandas|sql|analytics/.test(skill))) return "Data Analyst";
  if (skills.some((skill) => /vue|react|javascript|html|css|node/.test(skill))) return "Software Developer";
  if (skills.some((skill) => /cloud|linux|devops|network/.test(skill))) return "Cloud Associate";
  return "Graduate Trainee";
}

function derivePackage(record) {
  const explicit = Number(record.packageLpa || record.package_lpa || record.finalSalaryLpa || 0);
  if (explicit > 0) return explicit;
  if (!/placed|selected|offer/i.test(String(record.placementStatus || record.status || ""))) return 0;

  const cgpa = Number(record.cgpa || 0);
  const resumeScore = Number(record.resumeScore || record.resume_score || 0);
  return Number(Math.max(3.5, cgpa * 0.75 + resumeScore * 0.025).toFixed(1));
}

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current || row.length) {
        row.push(current.trim());
        rows.push(row);
      }
      current = "";
      row = [];
      if (char === "\r" && next === "\n") index += 1;
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current.trim());
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows;
  return dataRows.map((cells) =>
    headers.reduce((record, header, index) => {
      record[String(header).trim()] = cells[index] || "";
      return record;
    }, {})
  );
}

function normalizeRecords(payload) {
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload)) return payload;
  if (payload.csv) return parseCsv(String(payload.csv));
  return [];
}

async function listAll(db) {
  const [users, students, companies, applications, resumes] = await Promise.all([
    db.prepare("SELECT id, name, email, role, department FROM users ORDER BY name").all(),
    db.prepare("SELECT * FROM students ORDER BY name").all(),
    db.prepare("SELECT * FROM companies ORDER BY name").all(),
    db.prepare("SELECT * FROM applications ORDER BY company").all(),
    db.prepare("SELECT * FROM resumes ORDER BY created_at DESC").all(),
  ]);

  return {
    users: users.results || [],
    students: (students.results || []).map((student) => ({
      ...student,
      skills: JSON.parse(student.skills || "[]"),
    })),
    companies: (companies.results || []).map((company) => ({
      ...company,
      skills: JSON.parse(company.skills || "[]"),
    })),
    applications: applications.results || [],
    resumes: (resumes.results || []).map((resume) => ({
      ...resume,
      skills: JSON.parse(resume.skills || "[]"),
    })),
  };
}

async function importDataset(context) {
  const body = await readJson(context.request);
  const records = normalizeRecords(body);
  if (!records.length) {
    return json({ success: false, message: "No records found. Upload JSON records or CSV text." }, 400);
  }

  const statements = [];
  let users = 0;
  let students = 0;
  let companies = 0;
  let applications = 0;

  records.forEach((record, index) => {
    const type = String(record.type || record.model || "student").trim().toLowerCase();
    if (type === "company") {
      const id = String(record.id || createId("company"));
      statements.push(
        context.env.DB.prepare(
          "INSERT OR REPLACE INTO companies (id, name, sector, role, min_cgpa, package_lpa, skills) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          id,
          record.name || record.company || `Company ${index + 1}`,
          record.sector || "Other",
          record.role || "",
          Number(record.minCgpa || record.min_cgpa || 0),
          Number(record.packageLpa || record.package_lpa || 0),
          JSON.stringify(parseList(record.skills || record.requiredSkills))
        )
      );
      companies += 1;
      return;
    }

    if (type === "application") {
      statements.push(
        context.env.DB.prepare(
          "INSERT OR REPLACE INTO applications (id, user_id, company, status) VALUES (?, ?, ?, ?)"
        ).bind(
          String(record.id || createId("application")),
          String(record.user_id || record.userId || record.email || ""),
          record.company || "",
          record.status || "Applied"
        )
      );
      applications += 1;
      return;
    }

    const role = normalizeRole(record.role);
    const id = String(record.id || record.user_id || record.email || createId("user"));
    const email = String(record.email || `${id}@placementor.local`).trim().toLowerCase();
    statements.push(
      context.env.DB.prepare(
        "INSERT OR REPLACE INTO users (id, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        id,
        record.name || `User ${index + 1}`,
        email,
        record.password || "demo123",
        role,
        record.department || ""
      )
    );
    users += 1;

    if (role === "student" || type === "student") {
      statements.push(
        context.env.DB.prepare(
          `INSERT OR REPLACE INTO students
          (id, user_id, name, email, department, phone, year, cgpa, aptitude, soft_skills, resume_score, prediction, predicted_role, status, company, package_lpa, skills)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          String(record.student_id || record.studentId || id),
          id,
          record.name || `Student ${index + 1}`,
          email,
          record.department || "",
          record.phone || "",
          Number(record.year || record.graduationYear || 0),
          Number(record.cgpa || 0),
          Number(record.aptitude || record.aptitudeScore || 0),
          Number(record.softSkills || record.soft_skills || record.softSkillsScore || 0),
          Number(record.resumeScore || record.resume_score || 0),
          derivePrediction(record),
          deriveRole(record),
          normalizePlacementStatus(record),
          record.company || record.placedCompany || "",
          derivePackage(record),
          JSON.stringify(parseList(record.skills))
        )
      );
      students += 1;
    }
  });

  await context.env.DB.batch(statements);
  return json({
    success: true,
    imported: { users, students, companies, applications },
  });
}

function analyzeText(text, fileName) {
  const lower = text.toLowerCase();
  const skills = skillKeywords.filter((skill) => lower.includes(skill));
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}/)?.[0] || "";
  let score = 35;
  if (email) score += 10;
  if (phone) score += 10;
  if (/project|portfolio|github/i.test(text)) score += 15;
  if (/intern|experience|work/i.test(text)) score += 10;
  if (/certification|certificate/i.test(text)) score += 10;
  score = Math.min(100, score + Math.min(skills.length * 3, 20));

  return {
    file_name: fileName,
    email,
    phone,
    skills,
    education: /b\.?tech|engineering|degree|university|college/i.test(text)
      ? "Education section detected"
      : "Add a clear education section",
    experience: /intern|experience|work|project/i.test(text)
      ? "Experience/project signals detected"
      : "Add projects or internship details",
    score,
  };
}

async function analyzeResume(context) {
  const body = await readJson(context.request);
  const userId = String(body.user_id || body.userId || "");
  const fileName = String(body.file_name || body.fileName || "resume.pdf");
  const fileSize = Number(body.file_size || body.fileSize || 0);

  if (!/\.pdf$/i.test(fileName)) {
    return json({ success: false, message: "Only PDF resumes are allowed." }, 400);
  }

  if (fileSize > 2 * 1024 * 1024) {
    return json({ success: false, message: "Resume must be 2 MB or smaller for the free demo." }, 400);
  }

  const analysis = analyzeText(String(body.text || fileName), fileName);
  await context.env.DB.prepare(
    `INSERT OR REPLACE INTO resumes
    (id, user_id, file_name, file_ref, email, phone, skills, education, experience, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      createId("resume"),
      userId,
      fileName,
      body.file_ref || "",
      analysis.email,
      analysis.phone,
      JSON.stringify(analysis.skills),
      analysis.education,
      analysis.experience,
      analysis.score
    )
    .run();

  return json({ success: true, resume: analysis });
}

function otpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtpCode(context) {
  const body = await readJson(context.request);
  const email = sanitizeEmail(body.email);
  if (!email) {
    return json({ success: false, message: "Email is required to generate an OTP." }, 400);
  }

  const code = otpCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await context.env.DB.prepare(
    `INSERT OR REPLACE INTO otp_codes (email, code, expires_at, created_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(email, code, expiresAt)
    .run();

  return json({
    success: true,
    deliveryMode: "in_app",
    otpPreview: code,
    expiresAt,
  });
}

async function verifyOtpCode(context) {
  const body = await readJson(context.request);
  const email = sanitizeEmail(body.email);
  const code = String(body.code || "").trim();
  if (!email || !code) {
    return json({ success: false, message: "Email and OTP are required." }, 400);
  }

  const record = await context.env.DB.prepare(
    "SELECT email, code, expires_at FROM otp_codes WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!record) {
    return json({ success: false, message: "No OTP found. Generate a new code." }, 404);
  }

  if (String(record.code) !== code) {
    return json({ success: false, message: "Invalid OTP." }, 401);
  }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    return json({ success: false, message: "OTP expired. Generate a new code." }, 401);
  }

  await context.env.DB.prepare("DELETE FROM otp_codes WHERE email = ?").bind(email).run();
  return json({ success: true, verified: true });
}

function profileImageUrl(email) {
  return `/api/profile/image?email=${encodeURIComponent(email)}`;
}

async function getProfile(context) {
  const email = sanitizeEmail(new URL(context.request.url).searchParams.get("email"));
  if (!email) {
    return json({ success: false, message: "Email is required." }, 400);
  }

  const record = await context.env.DB.prepare(
    "SELECT email, image_key, updated_at FROM user_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  return json({
    success: true,
    profile: {
      email,
      imageUrl: record?.image_key ? profileImageUrl(email) : "",
      updatedAt: record?.updated_at || "",
    },
  });
}

function fileExtension(contentType, fileName) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/jpeg") return "jpg";
  return String(fileName || "").split(".").pop() || "jpg";
}

async function uploadPhoto(context) {
  if (!context.env.PROFILE_IMAGES) {
    return json({ success: false, message: "R2 binding PROFILE_IMAGES is missing." }, 500);
  }

  const body = await readJson(context.request);
  const email = sanitizeEmail(body.email);
  const contentType = String(body.contentType || "");
  const fileData = String(body.fileData || "");
  const fileName = String(body.fileName || "profile.jpg");

  if (!email || !fileData) {
    return json({ success: false, message: "Email and image data are required." }, 400);
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(contentType)) {
    return json({ success: false, message: "Only PNG, JPG, and WEBP profile photos are allowed." }, 400);
  }

  const binary = Uint8Array.from(atob(fileData), (char) => char.charCodeAt(0));
  if (binary.byteLength > 1024 * 1024) {
    return json({ success: false, message: "Profile photo must be 1 MB or smaller." }, 400);
  }

  const existing = await context.env.DB.prepare(
    "SELECT image_key FROM user_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (existing?.image_key) {
    await context.env.PROFILE_IMAGES.delete(existing.image_key);
  }

  const objectKey = `profiles/${emailKey(email)}/${Date.now()}.${fileExtension(contentType, fileName)}`;
  await context.env.PROFILE_IMAGES.put(objectKey, binary, {
    httpMetadata: { contentType },
  });

  await context.env.DB.prepare(
    `INSERT OR REPLACE INTO user_profiles (email, image_key, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`
  )
    .bind(email, objectKey)
    .run();

  return json({
    success: true,
    profile: {
      email,
      imageUrl: profileImageUrl(email),
      updatedAt: new Date().toISOString(),
    },
  });
}

async function removePhoto(context) {
  if (!context.env.PROFILE_IMAGES) {
    return json({ success: false, message: "R2 binding PROFILE_IMAGES is missing." }, 500);
  }

  const email = sanitizeEmail(new URL(context.request.url).searchParams.get("email"));
  if (!email) {
    return json({ success: false, message: "Email is required." }, 400);
  }

  const existing = await context.env.DB.prepare(
    "SELECT image_key FROM user_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (existing?.image_key) {
    await context.env.PROFILE_IMAGES.delete(existing.image_key);
  }

  await context.env.DB.prepare("DELETE FROM user_profiles WHERE email = ?").bind(email).run();
  return json({ success: true });
}

async function serveProfileImage(context) {
  if (!context.env.PROFILE_IMAGES) {
    return new Response("R2 binding PROFILE_IMAGES is missing.", { status: 500 });
  }

  const email = sanitizeEmail(new URL(context.request.url).searchParams.get("email"));
  if (!email) {
    return new Response("Missing email.", { status: 400 });
  }

  const record = await context.env.DB.prepare(
    "SELECT image_key FROM user_profiles WHERE email = ?"
  )
    .bind(email)
    .first();

  if (!record?.image_key) {
    return new Response("Not found.", { status: 404 });
  }

  const object = await context.env.PROFILE_IMAGES.get(record.image_key);
  if (!object) {
    return new Response("Not found.", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=300");
  return new Response(object.body, { headers });
}

export async function onRequest(context) {
  const path = getPath(context);
  const method = context.request.method.toUpperCase();

  if (!context.env.DB) {
    return json({ success: false, message: "D1 binding DB is missing." }, 500);
  }

  if (method === "GET" && path === "health") {
    return json({
      success: true,
      service: "placementor-cloudflare",
      database: "D1",
      profileStorage: Boolean(context.env.PROFILE_IMAGES),
    });
  }

  if (method === "GET" && path === "data") return json({ success: true, data: await listAll(context.env.DB) });
  if (method === "POST" && path === "import") return importDataset(context);
  if (method === "POST" && path === "resume/analyze") return analyzeResume(context);
  if (method === "POST" && path === "auth/request-otp") return requestOtpCode(context);
  if (method === "POST" && path === "auth/verify-otp") return verifyOtpCode(context);
  if (method === "GET" && path === "profile") return getProfile(context);
  if (method === "POST" && path === "profile/photo") return uploadPhoto(context);
  if (method === "DELETE" && path === "profile/photo") return removePhoto(context);
  if (method === "GET" && path === "profile/image") return serveProfileImage(context);

  return json({ success: false, message: `Route not found: /api/${path}` }, 404);
}
