const _colors = require('chalk');

module.exports = {
    error_ : (err) => {
        $error_code = typeof err.code === 'undefined' ? "" : err.code;
        console.log('');
        switch (err.code) {
            case 'ETIMEOUT':
                console.log(
                    `STATUS: ${_colors.black.bgRedBright(" TIMEOUT ERROR ")},\nERROR: ${err}
                `);
                break;
            default:
                console.log(
                    `STATUS: ${_colors.black.bgRedBright(" ERROR ")},\nERROR: ${err}
                `)
                break;
        }
        console.log('');
    },
    
    success : (msg) => {
        console.log(`${_colors.bgGreenBright.black(" SUCCESS ")}: ${msg} 
    
        `);
    },
    
    log : (msg) => {
        console.log(`${msg}
    
        `);
    }
}