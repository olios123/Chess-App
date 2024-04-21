const mysql = require('mysql2')
const config = require('./../../config')

const connection = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    port: config.database.port,
    database: config.database.database,
    password: config.database.password
})
  
connection.connect((err) =>
{
    if (err) throw(err)
    console.log("Connected to database!")
})

module.exports = { connection }