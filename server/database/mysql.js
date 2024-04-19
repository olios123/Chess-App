const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: 'HOST',
    user: 'USER',
    port: 3306,
    database: 'DATABASE',
    password: 'PASSWORD'
})
  
connection.connect((err) =>
{
    if (err) throw(err)
    console.log("Connected to database!")
})

module.exports = { connection }