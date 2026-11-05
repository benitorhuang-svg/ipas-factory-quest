import fs from 'node:fs';
export function hydrate(data) {
  for (const material of data.studyMaterials) {
    const payload = JSON.parse(fs.readFileSync(`dist/${material.file}`, 'utf8'));
    material.details = payload.details;
    material.questions = payload.questions;
    material.notes = payload.notes;
  }
  return data;
}
