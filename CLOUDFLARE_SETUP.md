# Placementor Cloudflare Zero-Cost Setup

This setup replaces Cloud Run with Cloudflare Pages + Pages Functions + D1.

## What Stays Free

- Cloudflare Pages hosts the HTML/CSS/JS frontend.
- Cloudflare Pages Functions serve `/api/*`.
- Cloudflare D1 stores real users, students, companies, applications, and resume analysis metadata.

For resume file storage, keep files out of storage for the no-billing path. The app validates PDF files and stores extracted metadata in D1. Add R2 later only if your Cloudflare account supports it without violating your no-billing constraint.

## 1. Install Wrangler

```bash
npm install -g wrangler
```

Or use:

```bash
npx wrangler --version
```

## 2. Login

```bash
wrangler login
```

## 3. Create D1 Database

```bash
wrangler d1 create placementor-db
```

Copy the returned `database_id` into `wrangler.toml`:

```toml
database_id = "YOUR_REAL_DATABASE_ID"
```

## 4. Apply Schema

```bash
wrangler d1 execute placementor-db --file schema.sql
```

## 5. Deploy to Cloudflare Pages

Recommended dashboard path:

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Create Pages project.
4. Connect your GitHub repository.
5. Build command:
   ```bash
   npm run build:pages
   ```
6. Build output directory:
   ```text
   dist
   ```
7. Add D1 binding:
   - Binding name: `DB`
   - Database: `placementor-db`

## 6. Import Real Dataset

Open the deployed Pages URL.

Use the `Dataset Import` form on the login screen.

Supported CSV columns:

```text
type,id,name,email,password,role,department,year,cgpa,aptitude,softSkills,resumeScore,prediction,predictedRole,status,company,packageLpa,skills
```

Examples:

```csv
type,id,name,email,password,role,department,year,cgpa,aptitude,softSkills,resumeScore,prediction,predictedRole,status,company,packageLpa,skills
student,stu1,Aditi Sharma,student@demo.com,demo123,student,AI and Data Science,2026,8.7,88,84,82,91,Data Analyst,Selected,Insight AI,8.4,"python|sql|machine learning"
teacher,t1,Rahul Verma,teacher@demo.com,demo123,teacher,AI and Data Science,,,,,,,,,,
admin,a1,Neha Singh,admin@demo.com,demo123,admin,TNP,,,,,,,,,,
company,c1,Insight AI,,,,,,Data / AI,,,,,,Data Analyst,,8.2,"python|sql|machine learning"
```

For JSON, upload an array of objects with similar fields.

Your `terna_students_dataset.json` format is supported directly:

```json
[
  {
    "id": 1,
    "name": "Ira Patankar",
    "email": "ira.patankar@terna.edu",
    "department": "it",
    "cgpa": 8.92,
    "resumeScore": 85,
    "skills": ["Blockchain", "Go", "Vue.js"],
    "phone": "9263779415",
    "year": 4,
    "placementStatus": "Placed"
  }
]
```

Import behavior:

- Each record becomes a `student` user.
- Default password is `demo123` unless `password` is provided.
- `placementStatus: "Placed"` becomes application status `Selected`.
- Prediction, predicted role, and package are derived if not provided.

## Notes

- No Firebase is required for this Cloudflare path.
- No Cloud Run is required.
- No Cloud Build or Artifact Registry is required.
- Auth is intentionally lightweight for a college demo.
- Passwords are simple demo strings, not production security.
