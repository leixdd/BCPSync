const mysql = require('mysql');
const connection = mysql.createConnection(require('../config/mysql'));
const m = require('./messages');

connection.connect((err) => {
    if (err) m.error_(err);
});

class orm_functions {

    /**
     * (table, [], [
     * 
     * ])
     * 
     * @param {string} table 
     * @param {*} whereClause 
     * @param {*} values 
     */
    static UpdateOrInsert(table, values, whereClause = []) {
        let Build = 'UPDATE ' + table + " SET ";

        let setStack = [];
        let whereStack = [];

        //Columns Stack Set [column = ?]
        Object.keys(values).map(objects => {
            setStack.push(objects + " = ?");
        });

        //Where Stack
        Object.keys(whereClause).map(objects => {
            whereStack.push(objects + " = ?");
        });

        Build += setStack.toString() + " WHERE " + whereStack;

        let setStack_vals = Object.values(values);
        let whereStack_vals = Object.values(whereClause);
        
        let sql = connection.format(Build, setStack_vals.concat(whereStack_vals));

        console.log(sql);

    }
}

module.exports = orm_functions;