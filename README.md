# Placementor

Placementor is a placement management and student-readiness system built for institutional use. It started as a Firebase + Node + Python ML app and was later evolved into a zero-payment Cloudflare-hosted version focused on real datasets, role-based access, and lightweight deployment.

This repository currently contains both:

- the newer Cloudflare Pages + Workers + D1 version at the project root
- the older Firebase + Express + Python ML version in `backend/`, `frontend/`, and `ml/`

If you are setting up the project today, use the **Cloudflare version** unless you specifically want the legacy Firebase stack.

## Contents

- Overview
- Current Architecture
- Repository Structure
- Main Features
- Role System
- Datasets
- Local Development Setup
- Cloudflare Deployment Setup
- R2 Profile Photo Setup
- D1 Database Setup
- How to Use the App
- If You Are Using a Different PC
- Sensitive Files and Security Notes
- Known Constraints
- Problems Faced and Solutions
- Legacy Firebase Version
- Recommended Next Improvements

## Overview

Placementor is intended for:

- `100–150 students`
- `~10 teachers / faculty`
- `~2 TNP / admin users`

The current Cloudflare version is designed to:

- run with no immediate payment
- use real datasets from JSON
- support role-based access
- provide in-app OTP verification
- support persistent profile photos through Cloudflare R2
- remain simple enough for college deployment and handoff

## Current Architecture

### Current Active Stack

- Frontend: `HTML + CSS + Vanilla JavaScript`
- Hosting: `Cloudflare Pages`
- Server/API: `Cloudflare Pages Functions / Workers`
- Database: `Cloudflare D1`
- File storage: `Cloudflare R2` for profile images
- Auth/session: `sessionStorage/localStorage + Worker-backed OTP`

### Legacy Stack Still Present in Repo

- Frontend: `HTML + Tailwind CSS + Vanilla JS`
- Backend: `Node.js + Express`
- Database/Auth: `Firebase`
- ML/NLP: `Python + scikit-learn`

## Repository Structure

### Current Cloudflare App

```text
PlaceMentor/
|-- assets/
|   |-- terna_students_dataset.json
|   |-- terna_teachers_dataset.json
|   `-- terna_companies_dataset.json
|-- css/
|   |-- icons.css
|   `-- styles.css
|-- functions/
|   `-- api/
|       `-- [[path]].js
|-- js/
|   |-- api.js
|   |-- app.js
|   |-- auth.js
|   |-- dashboard.js
|   |-- data.js
|   |-- otp.js
|   |-- profile.js
|   `-- roles.js
|-- pages/
|-- scripts/
|   `-- build-pages.js
|-- dist/                  (generated deploy output)
|-- index.html
|-- package.json
|-- schema.sql
`-- wrangler.toml
```

### Legacy Firebase / Node / Python App

```text
PlaceMentor/
|-- backend/
|-- frontend/
|-- ml/
`-- firebase/
```

## Main Features

### Cloudflare Version

- Real dataset loading from JSON asset files
- Role-based login:
  - `student`
  - `faculty`
  - `tnp/admin`
- In-app OTP verification during login
- Dashboard KPIs computed from real data
- Search, filter, and sort for students
- Company eligibility matching
- Student profile strength calculation
- Context-based placement tips
- Resume analyzer UI
- Profile photo upload with cloud persistence
- Theme toggle with saved preference

### Legacy Firebase Version

- Firebase Auth
- Firestore-based user/profile storage
- Resume upload and analysis
- Placement prediction
- Salary prediction
- Company matching
- Faculty and TNP dashboards

## Role System

### Student

- can only view their own data
- can see:
  - personal dashboard
  - profile strength
  - eligible companies
  - placement tips
  - resume analysis output
  - profile page

### Faculty

- can view all student records
- can search/filter/sort students
- can view analytics
- cannot upload datasets
- cannot override company management

### TNP / Admin

- highest access
- can upload / replace datasets
- can add faculty accounts
- can manage companies
- can edit student details
- can view all analytics

## Datasets

The current app uses these files:

- [assets/terna_students_dataset.json](/Y:/PlaceMentor/assets/terna_students_dataset.json)
- [assets/terna_teachers_dataset.json](/Y:/PlaceMentor/assets/terna_teachers_dataset.json)
- [assets/terna_companies_dataset.json](/Y:/PlaceMentor/assets/terna_companies_dataset.json)

The project also keeps a source copy under:

- `placementor_assets/`

Those files are copied into the Cloudflare deploy output by [build-pages.js](/Y:/PlaceMentor/scripts/build-pages.js).

### Expected Student Record Shape

Example:

```json
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
```

### Notes About Dataset Usage

- student passwords default to `demo123` unless a password field is introduced
- teacher/faculty records are normalized into app users
- TNP/admin account is seeded in code

## Local Development Setup

These steps are for the current Cloudflare version.

### Prerequisites

Install:

- `Node.js` 18 or newer
- `npm`
- a modern browser
- Cloudflare Wrangler via `npx` or install globally

Check versions:

```bash
node --version
npm --version
```

### First-Time Install

From [PlaceMentor](/Y:/PlaceMentor):

```bash
cd Y:\PlaceMentor
npm install
```

### Build Deployable Output Locally

```bash
npm run build:pages
```

This creates the `dist/` folder used for Cloudflare Pages deployment.

### Quick Syntax Checks

Useful checks:

```bash
node --check js/app.js
node --check js/dashboard.js
node --check js/data.js
node --check functions/api/[[path]].js
```

### Local Preview Options

Because this is a static Pages-style app, the safest local preview is through a simple local server or Wrangler preview.

Example:

```bash
npx wrangler pages dev dist
```

If you do not need Worker endpoints for a quick UI-only check, you can also open:

- [index.html](/Y:/PlaceMentor/index.html)

But full API-backed behavior is best tested with Pages dev or deployed Pages.

## Cloudflare Deployment Setup

### 1. Login to Cloudflare

```bash
npx wrangler login
```

Check account:

```bash
npx wrangler whoami
```

### 2. D1 Database

Create once:

```bash
npx wrangler d1 create placementor-db
```

Then update [wrangler.toml](/Y:/PlaceMentor/wrangler.toml) with the returned `database_id`.

### 3. Apply Schema Remotely

```bash
npx wrangler d1 execute placementor-db --remote --file schema.sql
```

This creates the database structure used by the current app.

### 4. Build for Pages

```bash
npm run build:pages
```

### 5. Deploy

```bash
npx wrangler pages deploy dist --project-name placementor
```

### 6. Health Check

After deployment:

[placementor.pages.dev/api/health](https://placementor.pages.dev/api/health)

Expected:

```json
{
  "success": true,
  "service": "placementor-cloudflare",
  "database": "D1",
  "profileStorage": true
}
```

If `profileStorage` is `false`, the R2 binding is missing.

## R2 Profile Photo Setup

R2 is used only for profile photos in the current version.

### Important Clarification

R2 may require enabling a subscription on the Cloudflare account, but the free tier is generous and for this project usually remains at `$0.00` unless usage grows beyond free limits.

### Create the Bucket

```bash
npx wrangler r2 bucket create placementor-profile-images
```

### Wrangler Binding

[wrangler.toml](/Y:/PlaceMentor/wrangler.toml) already includes:

```toml
[[r2_buckets]]
binding = "PROFILE_IMAGES"
bucket_name = "placementor-profile-images"
```

If Cloudflare Pages says the binding is managed by `toml`, that is okay.

### After Creating the Bucket

Redeploy:

```bash
npm run build:pages
npx wrangler pages deploy dist --project-name placementor
```

## D1 Database Setup

Current schema file:

- [schema.sql](/Y:/PlaceMentor/schema.sql)

Tables currently created:

- `users`
- `students`
- `companies`
- `applications`
- `resumes`
- `otp_codes`
- `user_profiles`

### Useful D1 Commands

See all tables:

```bash
npx wrangler d1 execute placementor-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

View some users:

```bash
npx wrangler d1 execute placementor-db --remote --command "SELECT id, name, email, role FROM users LIMIT 10;"
```

View some students:

```bash
npx wrangler d1 execute placementor-db --remote --command "SELECT id, name, department, cgpa FROM students LIMIT 10;"
```

Update a record:

```bash
npx wrangler d1 execute placementor-db --remote --command "UPDATE users SET department='it' WHERE email='ira.patankar@terna.edu';"
```

### Important Note

You can safely rerun:

```bash
npx wrangler d1 execute placementor-db --remote --file schema.sql
```

as long as your schema file contains safe migration-style SQL like:

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`

Do not put destructive commands in `schema.sql` unless you intentionally want them rerun.

## How to Use the App

### Login

1. open the deployed app
2. enter dataset email
3. use password `demo123` unless a custom password system is added
4. password is validated
5. Worker generates in-app OTP
6. enter OTP
7. dashboard opens

### Student Flow

- login
- view profile strength
- view eligible companies
- view placement tips
- use resume analyzer
- upload or update profile photo

### Faculty Flow

- login
- view all students
- search/filter/sort student records
- check analytics

### TNP/Admin Flow

- login
- upload/replace datasets
- manage companies
- add faculty
- edit students
- view analytics

## If You Are Using a Different PC

On another machine, install:

- Node.js
- npm
- Git (recommended)

Then:

```bash
git clone https://github.com/unXpected5000/PlaceMentor.git
cd PlaceMentor
npm install
```

If you want to deploy from that machine too:

```bash
npx wrangler login
```

Then make sure the Cloudflare account used there has access to:

- Pages project `placementor`
- D1 database `placementor-db`
- R2 bucket `placementor-profile-images`

Then run:

```bash
npx wrangler d1 execute placementor-db --remote --file schema.sql
npm run build:pages
npx wrangler pages deploy dist --project-name placementor
```

## Sensitive Files and Security Notes

### Do Not Commit

- `.env` files with real credentials
- private keys
- service account JSON files
- local Cloud Run env files
- any copied secret notes like `configValues.txt`

### Safe to Commit

- [wrangler.toml](/Y:/PlaceMentor/wrangler.toml) without secrets
- [schema.sql](/Y:/PlaceMentor/schema.sql)
- dataset JSON files if they are intended to be part of the repo

### Current Auth Limitation

The current OTP system is:

- Worker-backed
- real verification logic
- in-app display

It is **not true email delivery**.

That was a deliberate choice to stay within zero-payment constraints.

## Known Constraints

- profile photos require R2 to be enabled
- current OTP is not email-based
- some editable records are still asset/local override based rather than fully D1-backed
- the resume analyzer in the Cloudflare version is lightweight, not the full legacy ML pipeline
- the repo still contains the old Firebase stack, which can confuse new contributors if they do not read this README carefully

## Problems Faced and Solutions

### 1. Cloud Run Billing Blocker

Problem:

- Cloud Run / Artifact Registry / Cloud Build required billing

Decision:

- moved the deploy target to Cloudflare Pages + Workers for a no-immediate-payment path

### 2. Firebase Storage Not Suitable for Strict Zero-Payment Direction

Problem:

- the Firebase path required more billing-sensitive services for the wanted feature set

Decision:

- current profile media moved toward Cloudflare R2

### 3. True Email OTP Under Free Constraints

Problem:

- real email OTP sending was not practical under strict zero-payment + no external paid provider rules

Decision:

- implemented Worker-backed in-app OTP instead

### 4. Profile Photo Persistence Across Devices

Problem:

- localStorage would only persist on the same browser/device

Decision:

- added `user_profiles` in D1 and `PROFILE_IMAGES` in R2

### 5. Dataset Persistence vs Real Cloud Records

Problem:

- early static/demo approaches were not enough for institutional use

Decision:

- retained real dataset import and layered in cloud persistence for identity features first

### 6. UI Looking Too Demo-Like

Problem:

- early UI was too flashy / experimental

Decision:

- refactored toward flat, table-first, ERP/admin styling with restrained Terna-inspired blue/orange accents

## Legacy Firebase Version

The repository still contains the earlier full-stack version:

- [backend](/Y:/PlaceMentor/backend)
- [frontend](/Y:/PlaceMentor/frontend)
- [ml](/Y:/PlaceMentor/ml)
- [firebase](/Y:/PlaceMentor/firebase)

Use that path only if you explicitly want:

- Firebase Auth
- Firestore
- Python ML pipeline
- legacy resume upload flow

That version is not the currently recommended deployment path.

## Recommended Next Improvements

- move all editable student/company/profile data fully into D1
- replace prompt-based TNP edit flows with structured forms
- add D1-backed activity logs
- add proper audit history
- add stronger resume parsing in the Cloudflare version
- add production-grade email verification only if payment/external provider policy changes
- clean up or archive the legacy Firebase stack into a dedicated branch if you want this repo to become Cloudflare-only

## Quick Start Summary

If you want the shortest possible path:

```bash
cd Y:\PlaceMentor
npm install
npx wrangler login
npx wrangler d1 execute placementor-db --remote --file schema.sql
npm run build:pages
npx wrangler pages deploy dist --project-name placementor
```

Then visit:

[placementor.pages.dev](https://placementor.pages.dev)

For profile photos, also ensure:

- R2 is enabled
- bucket `placementor-profile-images` exists
- `PROFILE_IMAGES` binding is active

