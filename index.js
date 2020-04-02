const _colors = require('chalk');
const grades_lists = [];
const grades_logic = require('./logics/grades');

console.log(
    `
==========================================
${_colors.blueBright('BCP')} ${_colors.greenBright('Sync')} v1
------------------------------------------
Synching data from 
Princetech Integrated School Management System 
Database to BCP Backend Servers
==========================================

`);

grades_logic.getGrades();

