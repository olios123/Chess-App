module.exports = io => {
    io.on('connection', socket => {
        console.log('New socket connection');

        let currentCode = null;
        let handleDisconnecting = true

        // Handle moves
        socket.on('move', function(move) 
        {
            io.to(currentCode).emit('newMove', move);
        });

        // Draw
        socket.on('drawRequest', function(color) 
        {
            io.to(currentCode).emit('opponentDrawRequest', color)
        })

        // Move back
        socket.on('undoRequest', function(color)
        {
            io.to(currentCode).emit('opponentUndoRequest', color)
        })

        // Give up
        socket.on('surrender', function(color) 
        {
            io.to(currentCode).emit('opponentSurrendered', color)
            handleDisconnecting = false
        })
        
        // Joining to game
        socket.on('joinGame', function(data) 
        {

            currentCode = data.code;
            socket.join(currentCode);
            if (!games[currentCode]) {
                games[currentCode] = true;
                return;
            }
            
            io.to(currentCode).emit('startGame');
        });

        // Disconnecting
        socket.on('disconnect', function() 
        {
            if (currentCode && handleDisconnecting) 
            {
                io.to(currentCode).emit('gameOverDisconnect');
                delete games[currentCode];
            }
        });

    });
};