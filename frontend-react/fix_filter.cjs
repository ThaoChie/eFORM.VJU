const fs = require('fs');
let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

let newFilter = `  rows = rows.filter(r => {
    if (filters.status !== "Tất cả" && r.status !== filters.status) return false;
    if (filters.query) {
       const q = filters.query.toLowerCase();
       return r.code?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.fullName?.toLowerCase().includes(q);
    }
    return true;
  });

  return (`;
jsx = jsx.replace('  return (', newFilter);
fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);
