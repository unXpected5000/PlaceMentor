import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const entries = ["index.html", "css", "js", "assets", "pages"];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of entries) {
  const source = path.join(root, entry);
  const target = path.join(dist, entry);
  if (!fs.existsSync(source)) {
    continue;
  }
  fs.cpSync(source, target, { recursive: true });
}

const datasetSourceDir = path.join(root, "placementor_assets");
const datasetTargetDir = path.join(dist, "assets");
if (fs.existsSync(datasetSourceDir)) {
  fs.mkdirSync(datasetTargetDir, { recursive: true });
  const datasetFiles = [
    "terna_students_dataset.json",
    "terna_teachers_dataset.json",
    "terna_companies_dataset.json",
  ];
  for (const datasetFile of datasetFiles) {
    const source = path.join(datasetSourceDir, datasetFile);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(datasetTargetDir, datasetFile));
    }
  }
}

console.log("Cloudflare Pages assets built in dist/");
