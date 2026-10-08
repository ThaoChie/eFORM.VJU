const fs = require('fs');
let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');
console.log(jsx.substring(0, jsx.indexOf('export default function')));
