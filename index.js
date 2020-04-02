const sql = require('mssql');
const cliProgress = require('cli-progress');
const mssql_config = require('./config/mssql');
const _colors = require('chalk');

const connection_pool = new sql.ConnectionPool(mssql_config);
const grade_pool = connection_pool.connect();

// create new progress bar
const pB_grades = new cliProgress.SingleBar({
    format: 'Downloading Grades Progress |' + _colors.greenBright('{bar}') + '| {percentage}% || {value}/{total} Rows ',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: false
});


const gradeRecordSetWeight = (pool) => {

    return new Promise((resolve, reject) => {
        pool.request().query(`
        SELECT     
        count(*) as totalGrades
        FROM         
        dbo.ES_Grades INNER JOIN
        dbo.ES_Subjects ON dbo.ES_Grades.SubjectID = dbo.ES_Subjects.SubjectID INNER JOIN
        dbo.ES_AYTerm ON dbo.ES_Grades.TermID = dbo.ES_AYTerm.TermID
        `, (err, result) => {
            if (result === 'undefined') {
                reject(err);
            }
            //initialize the progress bar
            pB_grades.start(result.recordset[0].totalGrades, 0);
            resolve(pool);
        });
    });

}


const getGrades = async () => {
    await grade_pool
        .then((pool) => gradeRecordSetWeight(pool)

            .then((result_pool) => {

                const request = result_pool.request();
                request.stream = true;

                request.query(`
                SELECT     
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
                    console.log(err);
                });

                request.on('done', data => {
                    pB_grades.stop();
                })

            })

        ).catch(err => {
            console.log(err); //SQL Error
        });
}


getGrades();

console.log('test');