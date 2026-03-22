# PlaceMentor

Predict. Improve. Get Placed.

Student placement prediction web app built with:

- Frontend: HTML, Tailwind CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database/Auth: Firebase
- ML/NLP: Python, scikit-learn, resume parsing

## Folder Structure

```text
PlaceMentor/
|-- backend/
|   |-- .env.example
|   |-- package.json
|   |-- uploads/
|   `-- src/
|-- firebase/
|   |-- firebase.web.example.js
|   |-- firestore-schema.md
|   |-- firestore.rules
|   `-- storage.rules
|-- frontend/
|   |-- index.html
|   |-- login.html
|   |-- dashboard.html
|   `-- js/
`-- ml/
    |-- artifacts/
    |-- data/
    |-- requirements.txt
    `-- src/
```

## Backend API

### Auth

- `POST /api/auth/profile`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

### Student

- `GET /api/students/me`
- `PUT /api/students/me`
- `GET /api/students`
- `PATCH /api/students/:studentId`

### Resume / Prediction

- `POST /api/resume`
- `POST /api/predictions`

### Company / Analytics

- `GET /api/companies`
- `GET /api/companies/matches`
- `GET /api/companies/board`
- `GET /api/analytics/overview`

## Firestore Schema

See [firebase/firestore-schema.md](firebase/firestore-schema.md).

## Local Setup

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
```

Fill these values in `backend/.env`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `PYTHON_COMMAND`

Recommended `PYTHON_COMMAND` on Windows:

```bash
py -3
```

### 2. Frontend Firebase Config

```bash
copy frontend\js\config.example.js frontend\js\config.js
```

Then edit `frontend/js/config.js` and replace the placeholder Firebase web values.

### 3. Python ML Setup

```bash
cd ml
py -3 -m pip install -r requirements.txt
py -3 src/train.py
```

Notes:

- `src/predict.py` auto-trains models on first use if artifacts are missing.
- Resume parsing supports `.pdf` and `.docx`.

### 4. Firebase Rules

Deploy or paste the rules from:

- [firebase/firestore.rules](firebase/firestore.rules)
- [firebase/storage.rules](firebase/storage.rules)

### 5. Start App

```bash
cd backend
npm start
```

Open `http://localhost:5000`

## MVP User Flow

### Student

1. Register with role `student`
2. Save profile metrics
3. Run prediction
4. View company matches

### Faculty

1. Register with role `faculty`
2. Open dashboard
3. Review students
4. Edit student profile data

### TNP Officer

1. Register with role `tnp`
2. View analytics
3. Review company match board

## Notes

- Backend serves the frontend statically.
- Firebase Auth handles login and registration.
- Firestore stores users, profiles, predictions, resume analyses, and companies.
- Resume upload requires Firebase Storage to be enabled in your Firebase project.
- Python ML scripts run from Node through `child_process`.
- `backend/.env`, `frontend/js/config.js`, and `configValues.txt` stay local and are ignored by Git.
