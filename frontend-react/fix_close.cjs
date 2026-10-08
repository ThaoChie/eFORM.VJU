const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// I will just add one closing brace before `if (active === "classes") {`
// inside `renderFilters`

content = content.replace(/      \);\n    \}\n    \n    if \(active === "classes"\) \{/g, 
                          '      );\n    }\n    \n    if (active === "classes") {');

// wait, let me just find `return (\n        <Card className="mb-4">` for departments and see its end.
let idx = content.indexOf('if (active === "classes") {');
console.log(content.substring(idx - 100, idx + 50));
