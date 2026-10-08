const fs = require('fs');

let jsx = fs.readFileSync('src/App.tsx', 'utf-8');

jsx = jsx.replace('<Toaster position="top-right" toastOptions={{ duration: 3000 }} />\n    <BrowserRouter>', '<>\n      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />\n      <BrowserRouter>');
jsx = jsx.replace('</BrowserRouter>\n  )', '</BrowserRouter>\n    </>\n  )');

fs.writeFileSync('src/App.tsx', jsx);
