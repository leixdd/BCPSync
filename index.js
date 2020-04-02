const sql = require('mssql');
const cliProgress = require('cli-progress');
const mssql_config = require('./config/mssql');
const _colors = require('chalk');

const connection_pool = new sql.ConnectionPool(mssql_config);
const grade_pool = connection_pool.connect();

// create new progress bar
const pB_grades = new cliProgress.SingleBar({
    format: 'Downloading Grades : Progress |' + _colors.greenBright('{bar}') + '| {percentage}% || {value}/{total} Rows ',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: false
});

let grades_checksum = "";

const error_ = (err) => {
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
};

const success = (msg) => {
    console.log(`${_colors.bgGreenBright.black(" SUCCESS ")}: ${msg} 

    `);
}

const log = (msg) => {
    console.log(`${msg}

    `);
}

const gradeRecordSetWeight = (pool) => {

    return new Promise((resolve, reject) => {
        log('Calculating Checksum and total rows of Grades Table. Please Wait!');
        pool.request().query(`
        SELECT     
        count(*) as totalGrades,
        CHECKSUM_AGG(BINARY_CHECKSUM(*)) as checksum
        FROM         
        dbo.ES_Grades INNER JOIN
        dbo.ES_Subjects ON dbo.ES_Grades.SubjectID = dbo.ES_Subjects.SubjectID INNER JOIN
        dbo.ES_AYTerm ON dbo.ES_Grades.TermID = dbo.ES_AYTerm.TermID
        `, (err, result) => {
            if (typeof result === "undefined") {
                reject(err);
            } else {
                
                success('Calculation Complete!.');
                //initialize the progress bar
                grades_checksum = result.recordset[0].checksum;

                console.log("Grade table checksum: " + _colors.green(grades_checksum))
                console.log("Total rows: " + _colors.green(result.recordset[0].totalGrades))

                pB_grades.start(result.recordset[0].totalGrades, 0);
                resolve(pool);
            }

        });
    });

}

const getGrades = async () => {
    console.log('Connecting to Server...');
    await grade_pool
        .then((pool) => gradeRecordSetWeight(pool)

            .then((result_pool) => {

                const request = result_pool.request();
                request.stream = true;

                request.query(`
                SELECT 
                dbo.ES_Grades.StudentNo,     
                dbo.ES_Subjects.SubjectCode, 
                dbo.ES_Subjects.SubjectTitle, 
                dbo.ES_Grades.Midterm, 
                dbo.ES_Grades.ReExam, 
                dbo.ES_Grades.Final, 
                dbo.ES_Grades.DatePosted
                FROM         
                dbo.ES_Grades INNER JOIN
                dbo.ES_Subjects ON dbo.ES_Grades.SubjectID = dbo.ES_Subjects.SubjectID INNER JOIN
                dbo.ES_AYTerm ON dbo.ES_Grades.TermID = dbo.ES_AYTerm.TermID
                `);

                request.on('row', row => {
                    pB_grades.increment();
                });

                request.on('error', err => {
                    error_(err);
                });

                request.on('done', data => {
                    pB_grades.stop();
                    success('Download Complete!.');
                    log('Initiating Upload to Backend Servers');
                })

            })

        ).catch(err => {
            error_(err); //SQL Error
        });
}


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
getGrades();