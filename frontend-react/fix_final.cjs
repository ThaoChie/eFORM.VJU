const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

let idx1 = content.indexOf('export default function DirectoryPage()');
let idx2 = content.indexOf('export default function DirectoryPage()', idx1 + 10);

if (idx2 !== -1) {
    console.log("Found duplicate at index", idx2);
    // Keep everything BEFORE idx1, and EVERYTHING AFTER idx2
    let headers = content.substring(0, idx1);
    let body = content.substring(idx2);
    content = headers + body;
    fs.writeFileSync(path, content);
} else {
    console.log("No duplicate found!");
}
