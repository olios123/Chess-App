const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: '54.38.50.59',
    user: 'www13678_chess',
    port: 3306,
    database: 'www13678_chess',
    password: 'wTgnfe3RoizDoouVyQQ3'
})
  
connection.connect((err) =>
{
    if (err) throw(err)
    console.log("Connected to database!")
})

module.exports = { connection }