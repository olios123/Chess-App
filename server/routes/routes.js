const crypto = require('crypto')
const { connection } = require('./../database/mysql')

function gameIDGenerator() 
{
  var S4 = function() 
  {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1)
  }
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

module.exports = app => {

    // POST
    app.post('/accountLogin', (req, res) => {
        const { username, password } = req.body

        if (username && password) 
        {
            if (req.session.authenticated) 
            {
                res.redirect('/')
            } 
            else 
            {
                const hash = crypto.createHash('md5').update(password).digest("hex")
                
                connection.query('SELECT * FROM `users` WHERE `username`= ?', [username], 
                function(err, results) 
                {
                    if (err)
                    {
                        res.redirect('/login/?error=invalid')
                        return
                    }

                    // Account not found
                    if (results.length == 0)
                    {
                        res.redirect('/login/?error=invalid')
                        return
                    }

                    // Incorrect username or password
                    if (results[0].password != hash)
                    {
                        res.redirect('/login/?error=invalid')
                        return
                    }

                    // Correct login
                    req.session.authenticated = true
                    req.session.user = { 
                        username: results[0].username,
                        avatar: results[0].avatar,
                        ranking: results[0].ranking
                    }
                    res.redirect('/')
                })
            }
        } 
        else 
        {
            res.redirect('/login/?error=invalid')
        }
    })
    // POST
    app.post('/accountRegister', (req, res) => {
        const { username, password } = req.body

        if (username && password) 
        {
            if (req.session.authenticated) 
            {
                res.redirect('/')
            } 
            else 
            {
                const hash = crypto.createHash('md5').update(password).digest("hex")

                connection.query('INSERT INTO `users` (`username`, `password`, `ranking`) VALUES (?,?,?)', [username, hash, 1500],
                function(err, results)
                {
                    if (err)
                    {
                        res.redirect('/register/?error=err')
                        return
                    }

                    // Account created
                    req.session.authenticated = true
                    req.session.user = { 
                        username: username,
                        avatar: '',
                        ranking: 1500
                    }
                    res.redirect('/')
                })
            }
        } 
        else 
        {
            res.redirect('/register/?error=err')
        }
    })

    app.get('/logOut', (req, res) => {
        req.session.destroy()
        res.redirect('/')
    })

    app.get('/', (req, res) => {
        if (!req.session || !req.session.authenticated)
        {
            res.render('index', { sessionData: req.session })
            return
        }

        connection.query('SELECT * FROM `users` WHERE `username`=?', 
        [req.session.user.username],
        function(err, results)
        {
            if (err) return

            // Refresh data
            req.session.authenticated = true
            req.session.user = { 
                username: results[0].username,
                avatar: results[0].avatar,
                ranking: results[0].ranking
            }

            res.render('index', { sessionData: req.session })
        })
    });

    app.post('/game', (req, res) => {
        let user = {}

        // Logged user
        if (req.session.authenticated)
        {
            user = req.session.user
        }

        // Find game
        for (const key in games)
        {
            // Game found
            if (games[key].join === true)
            {
                // Join game
                res.render('game', {
                    data: {
                        color: 'black',
                        code: key,
                        user
                    }
                })
                return
            }
        }

        // Create game
        res.render('game', {
            data: {
                color: 'white',
                code: gameIDGenerator(),
                user
            }
        })
    })

    app.get('/login', (req, res) => {
        if (req.session.authenticated) res.redirect('/')
        else // Not logged in
        {
            res.render('login')
        }
    })
    app.get('/register', (req, res) => {
        if (req.session.authenticated) res.redirect('/')
        else // Not logged in
        {
            res.render('register')
        }
    })
}