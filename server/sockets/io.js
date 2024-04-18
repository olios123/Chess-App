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

        // --- Draw ---
        socket.on('drawRequest', function(color) 
        {
            io.to(currentCode).emit('opponentDrawRequest', color)
        })
        socket.on('acceptDrawRequest', function(color)
        {
            io.to(currentCode).emit('opponentDrawRequestAccepted', color)
            currentCode = null
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
            currentCode == null
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