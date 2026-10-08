const fs = require('fs');

let jsx = fs.readFileSync('src/App.tsx', 'utf-8');

if (!jsx.includes('import { Toaster } from "react-hot-toast"')) {
    jsx = 'import { Toaster } from "react-hot-toast";\n' + jsx;
}

fs.writeFileSync('src/App.tsx', jsx);
