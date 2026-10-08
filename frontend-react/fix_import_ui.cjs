const fs = require('fs');
let jsx = fs.readFileSync('src/pages/admin/directory/DirectoryPage.jsx', 'utf-8');

// For import classes, we need directoryService.importClasses(file)
jsx = jsx.replace('const res = await directoryService.importDepartments(selectedFile, false);', 
                  'const res = await (active === "classes" ? directoryService.importClasses(selectedFile, false) : directoryService.importDepartments(selectedFile, false));');

fs.writeFileSync('src/pages/admin/directory/DirectoryPage.jsx', jsx);

let dsPath = 'src/services/directory-service.js';
let ds = fs.readFileSync(dsPath, 'utf-8');
if (!ds.includes('importClasses: async')) {
    ds = ds.replace('importDepartments: async (file, preview = true) => {', 
`importClasses: async (file, preview = true) => {
    const formData = new FormData();
    formData.append("file", file);
    return await client.post(\`/classes/import?preview=\${preview}\`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  importDepartments: async (file, preview = true) => {`);
    fs.writeFileSync(dsPath, ds);
}
