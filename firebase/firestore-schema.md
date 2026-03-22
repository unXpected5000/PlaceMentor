# Firestore Collections

## `users/{uid}`

```json
{
  "name": "your name",
  "email": "example@ternaengg.ac.in",
  "role": "student",
  "department": "Computer Science",
  "createdAt": "2026-03-22T10:00:00.000Z",
  "updatedAt": "2026-03-22T10:00:00.000Z"
}
```

## `studentProfiles/{uid}`

```json
{
  "cgpa": 8.4,
  "skills": ["python", "sql", "machine learning"],
  "projects": ["resume analyzer", "placement portal"],
  "certifications": ["AWS Cloud Practitioner"],
  "aptitudeScore": 78,
  "softSkillsScore": 81,
  "resumeScore": 84,
  "preferredRole": "Data Analyst",
  "department": "Computer Science",
  "graduationYear": 2026,
  "updatedAt": "2026-03-22T10:30:00.000Z"
}
```

## `predictions/{uid}`

```json
{
  "placementProbability": 86.7,
  "predictedRole": "Data Analyst",
  "expectedSalaryLpa": 8.9,
  "improvementSuggestions": [
    "Improve resume structure and keyword density to raise ATS performance."
  ],
  "updatedAt": "2026-03-22T11:00:00.000Z"
}
```

## `resumeAnalyses/{uid}`

```json
{
  "skills": ["python", "sql", "pandas"],
  "projects": ["sales dashboard"],
  "certifications": ["Google Data Analytics"],
  "atsScore": 82,
  "missingElements": ["contact details"],
  "suggestions": ["Add GitHub or portfolio links to strengthen recruiter trust."],
  "parserNotes": [],
  "fileName": "resume.pdf",
  "storageUrl": "gs://your-project.appspot.com/resumes/uid/file.pdf",
  "localFilePath": "Y:\\PlaceMentor\\backend\\uploads\\file.pdf",
  "updatedAt": "2026-03-22T11:05:00.000Z"
}
```

## `companies/{companyId}`

```json
{
  "name": "CodeCraft Labs",
  "role": "Software Developer",
  "packageLpa": 8.5,
  "minCgpa": 7.0,
  "maxBacklogs": 0,
  "requiredSkills": ["javascript", "node.js", "sql"]
}
```
