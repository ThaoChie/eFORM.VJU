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
  if (line.includes('const renderToolbar')) console.log("renderToolbar start:", open);
  if (line.includes('const renderFilters')) console.log("renderFilters start:", open);
  if (line.includes('let columns = [];')) console.log("columns start:", open);
}
console.log("End open:", open);
