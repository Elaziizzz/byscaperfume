const fs = require("fs");
const files = [
  "D:/bysca app/src/app/page.tsx",
  "D:/bysca app/src/app/materials/page.tsx",
  "D:/bysca app/src/app/restock/page.tsx"
];
for (const file of files) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, content.replace(/^\uFEFF/, ''));
  }
}
