const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.resolve(__dirname, '..', '..', '..', 'skills');

const parseSkillFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const nameMatch = content.match(/^#\s+Skill:\s*(.+)$/m);
  const keyMatch = content.match(/^-\s+Key:\s*(.+)$/m);
  const ownerMatch = content.match(/^-\s+Owner:\s*(.+)$/m);
  const versionMatch = content.match(/^-\s+Version:\s*(.+)$/m);
  const statusMatch = content.match(/^-\s+Status:\s*(.+)$/m);
  const purposeMatch = content.match(/##\s+Purpose\s+([\s\S]*?)(?:\n##\s+|$)/m);

  return {
    key: keyMatch ? keyMatch[1].trim() : path.basename(filePath, '.md'),
    name: nameMatch ? nameMatch[1].trim() : path.basename(filePath, '.md'),
    owner: ownerMatch ? ownerMatch[1].trim() : null,
    version: versionMatch ? versionMatch[1].trim() : null,
    status: statusMatch ? statusMatch[1].trim() : null,
    purpose: purposeMatch ? purposeMatch[1].trim().split('\n')[0] : null,
    file: path.basename(filePath),
  };
};

const listSkills = () => {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  const files = fs.readdirSync(SKILLS_DIR).filter((file) => file.endsWith('.md'));
  return files.map((file) => parseSkillFile(path.join(SKILLS_DIR, file)));
};

const getSkillByKey = (skillKey) => {
  const skills = listSkills();
  return skills.find((skill) => skill.key === skillKey);
};

module.exports = {
  listSkills,
  getSkillByKey,
  SKILLS_DIR,
};
