const sql = require('mssql');
const _colors = require('chalk');
const m = require('./messages');
const mssql_config = require('../config/mssql');
const cliProgress = require('cli-progress');
const connection_pool = new sql.ConnectionPool(mssql_config);
const grade_pool = connection_pool.connect();
const ORM = require('./logics/mysqlORM');

let grades_checksum = 0;
let grades_rows = 0;
let grades = [];




const pB_grades = new cliProgress.SingleBar({
    format: 'Downloading Grades : Progress |' + _colors.greenBright('{bar}') + '| {percentage}% || {value}/{total} Rows ',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: false
});

const gradeRecordSetWeight = (pool) => {

    return new Promise((resolve, reject) => {
        m.log('Calculating Checksum and total rows of Grades Table. Please Wait!');
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

                m.success('Calculation Complete!.');
                //initialize the progress bar
                grades_checksum = result.recordset[0].checksum;
                grades_rows = result.recordset[0].totalGrades;

                console.log("Grade table checksum: " + _colors.green(grades_checksum))
                console.log("Total rows: " + _colors.green(grades_rows))

                pB_grades.start(result.recordset[0].totalGrades, 0);
                resolve(pool);
            }

        });
    });

};


const Grades = async () => {
    console.log('Connecting to Server...');
    await grade_pool
        .then((pool) => gradeRecordSetWeight(pool)

            .then((result_pool) => {

                const request = result_pool.request();
                request.stream = true;

                request.query(`
                SELECT 
                TOP 1
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
                    grades.push(row);
                    pB_grades.increment();
                });

                request.on('error', err => {
                    error_(err);
                });

                request.on('done', data => {
                    pB_grades.stop();
                    m.success('Download Complete!.');
                    m.log('Initiating Upload to Backend Servers');
                    UpdateGradesToBackend();
                })

            })

        ).catch(err => {
            m.error_(err); //SQL Error
        });
};

const UpdateGradesToBackend = () => {
    
}

module.exports = {
    getGrades: Grades
};