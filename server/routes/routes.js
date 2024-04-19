const crypto = require('crypto')
const { connection } = require('./../database/mysql')

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
                        res.redirect('/?error=invalid')
                        return
                    }

                    // Account not found
                    if (results.length == 0)
                    {
                        res.redirect('/?error=invalid')
                        return
                    }

                    // Incorrect username or password
                    if (results[0].password != hash)
                    {
                        res.redirect('/?error=invalid')
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
            res.redirect('/?error=invalid')
        }
    })
    app.get('/logOut', (req, res) => {
        req.session.destroy()
        res.redirect('/')
    })

    app.get('/', (req, res) => {
        const sessionData = req.session
        
        res.render('index', { sessionData });
    });

    app.get('/white', (req, res) => {
        res.render('game', {
            color: 'white'
        });
    });
    app.get('/black', (req, res) => {
        if (!games[req.query.code]) {
            return res.redirect('/?error=invalidCode');
        }

        res.render('game', {
            color: 'black'
        });
    });

    app.get('/login', (req, res) => {
        if (req.session.authenticated)
        {
            res.redirect('/')
        }
        else // Not logged in
        {
            res.render('login')
        }
    })
};