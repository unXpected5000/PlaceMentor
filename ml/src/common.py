import csv
import re
import zipfile
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder

try:
    import PyPDF2
except Exception:  # pragma: no cover
    PyPDF2 = None


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "sample_students.csv"
ARTIFACT_DIR = ROOT / "artifacts"
PLACEMENT_MODEL_PATH = ARTIFACT_DIR / "placement_model.joblib"
ROLE_MODEL_PATH = ARTIFACT_DIR / "role_model.joblib"
SALARY_MODEL_PATH = ARTIFACT_DIR / "salary_model.joblib"
LABEL_ENCODER_PATH = ARTIFACT_DIR / "role_label_encoder.joblib"

SKILL_GROUPS = {
    "frontend": ["html", "css", "javascript", "react", "tailwind css", "figma"],
    "backend": ["node.js", "express", "mongodb", "java", "spring", "flask", "sql"],
    "data": ["python", "machine learning", "deep learning", "nlp", "pandas", "tableau", "power bi"],
    "cloud": ["aws", "linux", "networking", "docker"],
    "soft": ["communication", "leadership", "teamwork", "presentation"],
}

RESUME_SKILL_VOCAB = sorted(
    {item for values in SKILL_GROUPS.values() for item in values}
    | {"excel", "dbms", "oops", "c", "oracle java"}
)


def normalize_text(text):
    return re.sub(r"\s+", " ", text or "").strip()


def split_items(value):
    if isinstance(value, list):
        return [normalize_text(item).lower() for item in value if normalize_text(item)]
    if not value:
        return []
    separator = "|" if "|" in str(value) else ","
    return [normalize_text(item).lower() for item in str(value).split(separator) if normalize_text(item)]


def group_score(items, group_name):
    group_items = SKILL_GROUPS[group_name]
    lowered = {item.lower() for item in items}
    return sum(1 for item in group_items if item in lowered)


def build_feature_vector(record):
    skills = split_items(record.get("skills", []))
    projects = split_items(record.get("projects", []))
    certifications = split_items(record.get("certifications", []))

    return [
        float(record.get("cgpa", 0)),
        float(record.get("aptitude_score", record.get("aptitudeScore", 0))),
        float(record.get("soft_skills_score", record.get("softSkillsScore", 0))),
        float(record.get("resume_score", record.get("resumeScore", 0))),
        len(skills),
        len(projects),
        len(certifications),
        group_score(skills, "frontend"),
        group_score(skills, "backend"),
        group_score(skills, "data"),
        group_score(skills, "cloud"),
        group_score(skills, "soft"),
    ]


def load_training_rows():
    with open(DATA_PATH, "r", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def ensure_artifact_dir():
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)


def train_models():
    rows = load_training_rows()
    features = np.array([build_feature_vector(row) for row in rows], dtype=float)
    placement_targets = np.array([int(row["placement_status"]) for row in rows], dtype=int)
    role_targets = [row["predicted_role"] for row in rows]
    salary_targets = np.array([float(row["expected_salary_lpa"]) for row in rows], dtype=float)

    label_encoder = LabelEncoder()
    encoded_roles = label_encoder.fit_transform(role_targets)

    placement_model = LogisticRegression(max_iter=1000, random_state=42)
    placement_model.fit(features, placement_targets)

    role_model = RandomForestClassifier(n_estimators=250, random_state=42)
    role_model.fit(features, encoded_roles)

    salary_model = RandomForestRegressor(n_estimators=250, random_state=42)
    salary_model.fit(features, salary_targets)

    ensure_artifact_dir()
    joblib.dump(placement_model, PLACEMENT_MODEL_PATH)
    joblib.dump(role_model, ROLE_MODEL_PATH)
    joblib.dump(salary_model, SALARY_MODEL_PATH)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)

    return {
        "rows_trained": len(rows),
        "artifacts": [
            str(PLACEMENT_MODEL_PATH),
            str(ROLE_MODEL_PATH),
            str(SALARY_MODEL_PATH),
            str(LABEL_ENCODER_PATH),
        ],
    }


def ensure_models():
    paths = [PLACEMENT_MODEL_PATH, ROLE_MODEL_PATH, SALARY_MODEL_PATH, LABEL_ENCODER_PATH]
    if not all(path.exists() for path in paths):
        train_models()

    placement_model = joblib.load(PLACEMENT_MODEL_PATH)
    role_model = joblib.load(ROLE_MODEL_PATH)
    salary_model = joblib.load(SALARY_MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)

    return placement_model, role_model, salary_model, label_encoder


def extract_text_from_pdf(file_path):
    if PyPDF2 is None:
        return "", ["Install PyPDF2 to improve PDF parsing support."]

    notes = []
    reader = PyPDF2.PdfReader(file_path)
    pages = [page.extract_text() or "" for page in reader.pages]
    if not any(page.strip() for page in pages):
        notes.append("PDF text extraction was limited. Use a text-based PDF for better analysis.")
    return "\n".join(pages), notes


def extract_text_from_docx(file_path):
    with zipfile.ZipFile(file_path, "r") as archive:
        xml_bytes = archive.read("word/document.xml")
    xml_text = xml_bytes.decode("utf-8", errors="ignore")
    cleaned = re.sub(r"<[^>]+>", " ", xml_text)
    return cleaned, []


def extract_text(file_path):
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Resume file not found: {file_path}")

    suffix = path.suffix.lower()
    if suffix == ".pdf":
        text, notes = extract_text_from_pdf(path)
    elif suffix == ".docx":
        text, notes = extract_text_from_docx(path)
    else:
        text = path.read_text(encoding="utf-8", errors="ignore")
        notes = []

    return normalize_text(text), notes


def extract_keywords(text):
    lowered = text.lower()
    found = [skill for skill in RESUME_SKILL_VOCAB if skill in lowered]
    return sorted(found)


def section_lines(text, section_name):
    pattern = rf"{section_name}\s*[:\-]?(.*?)(?=(skills|projects|certifications|education|experience|achievements|$))"
    matches = re.findall(pattern, text, flags=re.IGNORECASE)
    if not matches:
        return []
    chunk = matches[0][0]
    return [normalize_text(item) for item in re.split(r"[\n\-|]", chunk) if normalize_text(item)]


def extract_projects(text):
    items = section_lines(text, "projects")
    if items:
        return items[:4]

    fallback = re.findall(
        r"([A-Z][A-Za-z0-9\s]{4,30}(?:portal|system|dashboard|analyzer|tracker|detector|website|api|app))",
        text,
    )
    normalized = []
    for item in fallback:
        clean_item = normalize_text(item)
        if clean_item and clean_item not in normalized:
            normalized.append(clean_item)
    return normalized[:4]


def extract_certifications(text):
    items = section_lines(text, "certifications")
    if items:
        return items[:4]

    certification_patterns = [
        r"aws cloud practitioner",
        r"google data analytics",
        r"meta frontend",
        r"coursera ml",
        r"oracle java",
        r"ibm ai engineering",
        r"nptel [a-z ]+",
    ]
    found = []
    lowered = text.lower()
    for pattern in certification_patterns:
        matches = re.findall(pattern, lowered)
        for match in matches:
            title = normalize_text(match).title()
            if title not in found:
                found.append(title)
    return found[:4]


def score_resume(text, skills, projects, certifications):
    lowered = text.lower()
    has_contact = bool(re.search(r"[\w\.-]+@[\w\.-]+", text)) and bool(
        re.search(r"(\+91|[6-9]\d{9})", text)
    )
    has_education = "education" in lowered or "cgpa" in lowered or "b.tech" in lowered
    has_summary = "summary" in lowered or "objective" in lowered

    score = 35
    score += min(len(skills) * 4, 20)
    score += min(len(projects) * 8, 20)
    score += min(len(certifications) * 5, 15)
    score += 5 if has_contact else 0
    score += 5 if has_education else 0
    score += 5 if has_summary else 0
    score = max(0, min(100, score))

    missing = []
    if not has_contact:
        missing.append("contact details")
    if not has_education:
        missing.append("education section")
    if len(projects) == 0:
        missing.append("projects")
    if len(certifications) == 0:
        missing.append("certifications")
    if len(skills) < 5:
        missing.append("enough skill keywords")

    suggestions = []
    if "github" not in lowered and "portfolio" not in lowered:
        suggestions.append("Add GitHub or portfolio links to strengthen recruiter trust.")
    if len(projects) < 2:
        suggestions.append("Show at least two impact-focused projects with tools and outcomes.")
    if len(certifications) < 1:
        suggestions.append("Include one relevant certification for your target role.")
    if len(skills) < 6:
        suggestions.append("Add more role-specific keywords such as frameworks, tools, and databases.")
    if not has_summary:
        suggestions.append("Add a short professional summary at the top of the resume.")

    return score, missing, suggestions


def analyze_resume(file_path):
    text, notes = extract_text(file_path)
    skills = extract_keywords(text)
    projects = extract_projects(text)
    certifications = extract_certifications(text)
    ats_score, missing_elements, suggestions = score_resume(text, skills, projects, certifications)

    return {
        "skills": skills,
        "projects": projects,
        "certifications": certifications,
        "atsScore": ats_score,
        "missingElements": missing_elements,
        "suggestions": suggestions,
        "parserNotes": notes,
    }


def build_prediction_payload(student_input):
    placement_model, role_model, salary_model, label_encoder = ensure_models()
    feature_array = np.array([build_feature_vector(student_input)], dtype=float)

    placement_probability = round(float(placement_model.predict_proba(feature_array)[0][1]) * 100, 2)
    predicted_role_index = int(role_model.predict(feature_array)[0])
    predicted_role = str(label_encoder.inverse_transform([predicted_role_index])[0])
    salary_lpa = round(float(salary_model.predict(feature_array)[0]), 2)

    suggestions = []
    if float(student_input.get("resumeScore", 0)) < 70:
        suggestions.append("Improve resume structure and keyword density to raise ATS performance.")
    if float(student_input.get("aptitudeScore", 0)) < 70:
        suggestions.append("Practice quantitative aptitude and coding assessments weekly.")
    if float(student_input.get("softSkillsScore", 0)) < 70:
        suggestions.append("Work on mock interviews, communication drills, and presentation confidence.")
    if len(split_items(student_input.get("projects", []))) < 2:
        suggestions.append("Build one more measurable project with deployment or analytics outcomes.")
    if len(split_items(student_input.get("certifications", []))) < 1:
        suggestions.append("Add one certification aligned to your target role.")
    if not suggestions:
        suggestions.append("Keep applying consistently and tailor your resume to each company role.")

    return {
        "placementProbability": placement_probability,
        "predictedRole": predicted_role,
        "expectedSalaryLpa": salary_lpa,
        "improvementSuggestions": suggestions,
    }
