const mssql_config = require('./config/mssql');
const sql = require('mssql');

const getGrades = async () => {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(mssql_config, err => {

            const request = new sql.Request();

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
            dbo.ES_AYTerm ON dbo.ES_Grades.TermID = dbo.ES_AYTerm.TermID`
            );
 
            request.on('row', row => {
                console.log(row);
            });

            request.on('error', err => {
                console.log(err);
            });

        });
    } catch (err) {
        console.log(err);
    }
}

getGrades();
