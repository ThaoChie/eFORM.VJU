const fs = require('fs');
let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');
let idx = jsx.indexOf('if (active === "classes") {');
console.log(jsx.substring(idx, idx + 2000));
