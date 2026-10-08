const fs = require('fs');
let path = 'src/pages/admin/directory/DirectoryPage.jsx';
let content = fs.readFileSync(path, 'utf-8');

// Fix departments filter by removing the bad lines
let oldDeptFilter = `if (active === "departments" || active === "offices") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && r.status !== filters.status) return false;
        if (filters.dept && r.deptId !== Number(filters.dept)) return false;
        if (filters.cohort && r.academicCohort && !r.academicCohort.toLowerCase().includes(filters.cohort.toLowerCase())) return false;
        if (filters.query) {`;

let newDeptFilter = `if (active === "departments" || active === "offices") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && r.status !== filters.status) return false;
        if (filters.query) {`;

content = content.replace(oldDeptFilter, newDeptFilter);

// Fix classes filter by adding the correct lines
let oldClassFilter = `if (active === "classes") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && (r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") !== filters.status) return false;
        if (filters.query) {`;

let newClassFilter = `if (active === "classes") {
      rows = rows.filter(r => {
        if (filters.status !== "Tất cả" && (r.status === 1 ? "Đang hoạt động" : "Vô hiệu hóa") !== filters.status) return false;
        if (filters.dept && r.deptId !== Number(filters.dept)) return false;
        if (filters.cohort && r.academicCohort && !r.academicCohort.toLowerCase().includes(filters.cohort.toLowerCase())) return false;
        if (filters.query) {`;

content = content.replace(oldClassFilter, newClassFilter);

fs.writeFileSync(path, content);
