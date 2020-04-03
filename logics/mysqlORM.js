const mysql = require('mysql');
const connection = mysql.createConnection(require('../config/mysql'));
const m = require('./messages');

connection.connect((err) => {
    if (err) m.error_(err);
});

connection.on('error', (err) => {
    if (err) m.error_(err);
})

const updatePool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bcp_portal',
    port: 3306,
    multipleStatements: true,
    connectTimeout: 0
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

    static GenerateInsertQuery(table, values) {
        let Build = 'INSERT INTO ' + table;

        let setStack = [];
        //Columns Stack Set [column = ?]
        Object.keys(values).map(objects => {
            setStack.push("?");
        });
        Build += "(" + Object.keys(values).toString() + ") VALUES (" + setStack.toString() +")";
        let setStack_vals = Object.values(values);
        return connection.format(Build, setStack_vals);

    }

    static GenerateUpdateQuery(table, values, whereClause = []) {
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

        Build += setStack.toString() + " WHERE " + whereStack.join(" and ");

        let setStack_vals = Object.values(values);
        let whereStack_vals = Object.values(whereClause);

        return connection.format(Build, setStack_vals.concat(whereStack_vals));

    }

    static getConnectionPool() {
        return updatePool;
    }
}

module.exports = orm_functions;