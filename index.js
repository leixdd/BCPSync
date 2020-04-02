const sql = require('mssql');
const cliProgress = require('cli-progress');
const mssql_config = require('./config/mssql');
const _colors = require('chalk');

const connection_pool = new sql.ConnectionPool(mssql_config);
const grade_pool = connection_pool.connect();

let grdWeight = 0;

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
            console.log(result);
            resolve(pool);
        });
    });

}


const getGrades = async () => {
    grade_pool
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
                    console.log(row);
                });

                request.on('error', err => {
                    console.log(err);
                });

            }).catch(err => {
                console.log(err); //SQL Error
            })

        ).catch(err => {
            console.log(err); //SQL Error
        });
}


// create new progress bar
const b1 = new cliProgress.SingleBar({
    format: 'CLI Progress |' + _colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

// initialize the bar - defining payload token "speed" with the default value "N/A"
b1.start(200000, 0, {
    speed: "N/A"
});

// update values
for (let i = 0; i < 200000; i++) {
    
    b1.increment();
    b1.update(i);
}


// stop the bar
//b1.stop();