const util = require('util')
const { connection } = require('./../database/mysql')

module.exports = io => {
    io.on('connection', socket => {
        console.log('New socket connection');

        let currentCode = null
        let handleDisconnecting = true

        // Handle moves
        socket.on('move', function(move) 
        {
            io.to(currentCode).emit('newMove', move);
        });

        // --- Draw ---
        socket.on('drawRequest', function(color) 
        {
            io.to(currentCode).emit('opponentDrawRequest', color)
        })
        socket.on('acceptDrawRequest', function(color)
        {
            io.to(currentCode).emit('opponentDrawRequestAccepted', color)
            currentCode = null
            handleDisconnecting = false
        })
        socket.on('rejectDrawRequest', function(color)
        {
            io.to(currentCode).emit('opponentDrawRequestRejected', color)
        })



        // --- Undo ---
        socket.on('undoRequest', function(color)
        {
            io.to(currentCode).emit('opponentUndoRequest', color)
        })
        socket.on('acceptUndoRequest', function(color)
        {
            io.to(currentCode).emit('opponentUndoRequestAccepted', color)
        })
        socket.on('rejectUndoRequest', function(color)
        {
            io.to(currentCode).emit('opponentUndoRequestRejected', color)
        })


        // Give up
        socket.on('surrender', function(color) 
        {
            io.to(currentCode).emit('opponentSurrendered', color)
            currentCode = null
            handleDisconnecting = false
        })
        
        // Joining to game
        socket.on('joinGame', function(data) 
        {
            currentCode = data.code
            socket.join(currentCode)
            if (!games[currentCode]) 
            {
                games[currentCode] = {
                    join: true,
                    players: [{ user: data.user, color: data.color }]
                }
                return
            }

            // console.log(util.inspect(games, {showHidden: false, depth: null, colors: true}))

            games[currentCode].join = false
            games[currentCode].players.push({ user: data.user, color: data.color })
            
            io.to(currentCode).emit('startGame', { gameData: games[currentCode] });
        });

        // Disconnecting
        socket.on('disconnect', function() 
        {
            if (currentCode && handleDisconnecting) 
            {
                io.to(currentCode).emit('gameOverDisconnect')
            }
            delete games[currentCode]
        })

        // End
        socket.on('endGame', function(data)
        {
            if (!games[currentCode]) return

            const winPlayer = games[data.code].players.find(x => x.color == data.win)
            const losePlayer = games[data.code].players.find(x => x.color != data.win)

            function updateRanking(player, amount)
            {
                // Update data in database
                if (player != null && player.user != null && player.user.username != '')
                {
                    connection.query('SELECT `ranking` FROM `users` WHERE `username`=?', 
                    [player.user.username],
                    function(err, results)
                    {
                        if (err) return

                        connection.query('UPDATE `users` SET `ranking`=? WHERE `username`=?', 
                        [parseInt(results[0].ranking) + amount, player.user.username],
                        function(err, results)
                        {
                            if (err) return
                        })
                    })
                }
            }

            updateRanking(winPlayer, 6)
            updateRanking(losePlayer, -6)

            delete games[currentCode]
        })

    });
};