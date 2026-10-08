const fs = require('fs');
let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

let renderFiltersIdx = jsx.indexOf('const renderFilters = () => {');
let renderFormIdx = jsx.indexOf('title={form?.mode === \'edit\' ? "Chỉnh sửa danh mục" : "Thêm mới danh mục"}');

console.log("---- FILTERS ----");
console.log(jsx.substring(renderFiltersIdx, jsx.indexOf('return null;', renderFiltersIdx) + 20));

console.log("---- FORM ----");
console.log(jsx.substring(renderFormIdx - 50, jsx.indexOf('</Modal>', renderFormIdx) + 15));
