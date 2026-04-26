import { getSuggestedCourses } from "./analysis.js";
import { parseList } from "./data.js";

const SKILL_LIBRARY = [
  "python",
  "sql",
  "excel",
  "power bi",
  "tableau",
  "machine learning",
  "javascript",
  "react",
  "node",
  "java",
  "spring",
  "html",
  "css",
  "aws",
  "docker",
  "cloud",
  "linux",
  "communication",
  "leadership",
  "pandas",
  "numpy",
  "tensorflow",
  "c++",
  "go",
];

const GENERIC_PHRASES = [
  "hardworking individual",
  "team player",
  "results-driven professional",
  "detail oriented",
  "highly motivated",
  "works well under pressure",
];

function extractTextFromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return decoded.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

async function readFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read the resume file."));
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 50));
      }
    };
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function detectSkills(text, student) {
  const lower = text.toLowerCase();
  const resumeSkills = SKILL_LIBRARY.filter((skill) => lower.includes(skill));
  return [...new Set([...(student?.skills || []), ...resumeSkills.map((skill) => skill.toLowerCase())])];
}

function detectEducation(text, student) {
  const lower = text.toLowerCase();
  if (/b\.?tech|bachelor|engineering|university|college|cgpa|gpa/.test(lower)) {
    return "Education section detected with degree or academic indicators.";
  }
  return student?.department
    ? `${student.department.toUpperCase()} department details inferred from profile.`
    : "Education section needs to be added more clearly.";
}

function detectExperience(text) {
  const lower = text.toLowerCase();
  if (/internship|intern|experience|project|developed|implemented|led/.test(lower)) {
    return "Project or internship experience detected.";
  }
  return "No strong experience section found. Add projects, internships, or measurable contributions.";
}

function detectWeakAreas(text) {
  const lower = text.toLowerCase();
  const weakAreas = [];
  const strengths = [];
  const suggestions = [];

  const sentences = splitSentences(text);
  const longSentences = sentences.filter((sentence) => sentence.split(/\s+/).length > 28);
  const repeatedWords = [];
  const words = lower.match(/[a-z]{4,}/g) || [];
  const counts = words.reduce((accumulator, word) => {
    accumulator[word] = (accumulator[word] || 0) + 1;
    return accumulator;
  }, {});

  Object.entries(counts).forEach(([word, count]) => {
    if (count >= 5 && !["skill", "project", "experience", "student"].includes(word)) {
      repeatedWords.push(word);
    }
  });

  if (/@/.test(text)) strengths.push("Contact email present.");
  else {
    weakAreas.push("Email address missing.");
    suggestions.push("Add a professional email at the top of the resume.");
  }

  if (/(?:\+91[-\s]?)?[6-9]\d{9}/.test(text)) strengths.push("Phone number present.");
  else {
    weakAreas.push("Phone number missing.");
    suggestions.push("Add an active mobile number for recruiter follow-up.");
  }

  if (/github|portfolio|linkedin/.test(lower)) strengths.push("Professional links detected.");
  else {
    weakAreas.push("Professional links are missing.");
    suggestions.push("Add GitHub, LinkedIn, or portfolio links to strengthen credibility.");
  }

  if (longSentences.length) {
    weakAreas.push("Some bullet points are too long.");
    suggestions.push("Break long sentences into shorter impact-focused bullet points.");
  }

  if (repeatedWords.length) {
    weakAreas.push("Repetitive phrasing detected.");
    suggestions.push(`Reduce repeated wording such as ${repeatedWords.slice(0, 3).join(", ")}.`);
  }

  const genericMatches = GENERIC_PHRASES.filter((phrase) => lower.includes(phrase));
  if (genericMatches.length) {
    weakAreas.push("Generic or template-like phrases detected.");
    suggestions.push("Replace generic phrases with measurable, role-specific achievements.");
  }

  if (/\b\d+%|\b\d+\+|\b\d+\s?(users|clients|projects|features)\b/i.test(text)) {
    strengths.push("Measurable impact statements detected.");
  } else {
    weakAreas.push("Measurable impact is weak or missing.");
    suggestions.push("Add metrics such as percentages, counts, or timelines to show impact.");
  }

  return {
    strengths,
    weakAreas,
    suggestions,
    aiSignals: genericMatches,
  };
}

function calculateResumeScore(signals, skills) {
  let score = 35;
  score += Math.min(skills.length * 4, 24);
  score += Math.min(signals.strengths.length * 8, 24);
  score -= Math.min(signals.weakAreas.length * 5, 25);
  return Math.max(20, Math.min(98, score));
}

export async function analyzeResumeDocument(file, student, companies, onProgress) {
  onProgress?.(5);
  const buffer = await readFileWithProgress(file, onProgress);
  onProgress?.(60);

  const text = extractTextFromArrayBuffer(buffer);
  const skills = detectSkills(text, student);
  const education = detectEducation(text, student);
  const experience = detectExperience(text);
  const signals = detectWeakAreas(text);
  const score = calculateResumeScore(signals, skills);
  const suggestedCourses = getSuggestedCourses(
    { ...student, skills, resumeScore: score },
    companies
  );

  onProgress?.(90);
  const result = {
    fileName: file.name,
    extractedText: text.slice(0, 1800),
    skills,
    education,
    experience,
    score,
    strengths: signals.strengths,
    weakAreas: signals.weakAreas,
    suggestions: signals.suggestions,
    aiSignals: signals.aiSignals,
    suggestedCourses,
    grammarFlags: [
      ...(signals.weakAreas.includes("Some bullet points are too long.") ? ["Shorten long bullet points."] : []),
      ...(signals.weakAreas.includes("Repetitive phrasing detected.") ? ["Reduce repeated words and sentence patterns."] : []),
    ],
  };
  onProgress?.(100);
  return result;
}

export function mergeResumeIntoStudent(student, resume) {
  return {
    ...student,
    resumeScore: resume.score,
    skills: [...new Set(parseList([...(student.skills || []), ...(resume.skills || [])]))],
  };
}
