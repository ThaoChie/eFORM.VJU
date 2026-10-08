const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');
let open = 0;
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') open++;
    else if (line[j] === '}') open--;
  }
  if (open < 0) { console.log("Negative at line", i); break; }
}
console.log("End open:", open);
