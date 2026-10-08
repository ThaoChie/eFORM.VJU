const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

let renderFiltersIdx = content.indexOf('const renderFilters = () => {');
let idx = content.indexOf('if (active === "classes") {', renderFiltersIdx);
console.log(content.substring(idx - 100, idx + 50));
