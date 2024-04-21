let gameHasStarted = false;
let board = null
let game = new Chess()
let stat = document.querySelectorAll('.status')
let pgn = document.querySelectorAll('.pgn')
let gameOver = false;

function onDragStart(source, piece, position, orientation) 
{
    // do not pick up pieces if the game is over
    if (game.game_over()) return false
    if (!gameHasStarted) return false;
    if (gameOver) return false;

    if ((playerColor === 'black' && piece.search(/^w/) !== -1) || (playerColor === 'white' && piece.search(/^b/) !== -1)) {
        return false;
    }

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }

    // Get all squares from selected piece
    for (let square of game.moves({ 'square': source }))
    {
        const canBeAttacked = square.includes("x")

        square = square.replace(/[+#]?[!?]?\+?$/, '')
        let pos = square.match(/[a-h][1-8]/)

        // Castling
        if (square == 'O-O') // Short
        {
            if (playerColor === 'black') pos = 'g8'
            else if (playerColor == 'white') pos = 'g1'
        }
        else if (square == "O-O-O") // Long
        {
            if (playerColor === 'black') pos = 'c8'
            else if (playerColor == 'white') pos = 'c1'
        }

        const squareElement = document.querySelector("div[data-square=" + pos + "]")

        if (canBeAttacked)
        {
            squareElement.classList.add('attack')
        }
        else // Legal move
        {
            const dot = document.createElement("div")
            dot.classList.add("dot")
            
            squareElement.appendChild(dot)
        }
    }
}

function onDrop(source, target) 
{
    let theMove = {
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for simplicity
    };
    // see if the move is legal
    var move = game.move(theMove);

    // Remove all dots
    const dots = document.querySelectorAll(".dot")
    dots.forEach(dot => 
    {
        dot.remove()
    })

    // Remove all attacks
    const attack = document.querySelectorAll(".attack")
    attack.forEach(atc =>
    {
        atc.classList.remove('attack')
    })


    // illegal move
    if (move === null) return 'snapback'

    socket.emit('move', theMove);

    // If player moved piece reject all requests
    const message = document.querySelector(".message")
    $('.message').animate({ height: '0px' }, 100)
    message.innerHTML = ""

    socket.emit('rejectDrawRequest', playerColor)
    socket.emit('rejectUndoRequest', playerColor)


    updateStatus()
}

socket.on('newMove', function(move) 
{
    game.move(move);
    board.position(game.fen());

    // Remove check king
    const checks = document.querySelectorAll('.check')
    checks.forEach(ch =>
    {
        ch.classList.remove('check')
    })

    updateStatus();
});

socket.on('opponentSurrendered', (color) =>
{
    if (gameOver) return
    if (color != playerColor) 
    {
        displayWin("przeciwnik się poddał.")
        endGame(playerColor)
    }
})

socket.on('opponentDrawRequest', (color) =>
{
    const message = document.querySelector(".message")

    if (color != playerColor)
    {
        message.innerHTML = "<button class='green' action='acceptDraw'>Akceptuj</button><h3>Przeciwnik proponuje remis</h3><button class='cancel' action='rejectDraw'>Odrzuć</button>"
        $('.message').animate({ height: '8vh' }, 100)

        // Accept draw
        document.querySelector('button[action=acceptDraw]').addEventListener('click', () =>
        {
            socket.emit('acceptDrawRequest')
        })

        // Reject draw
        document.querySelector('button[action=rejectDraw]').addEventListener('click', () =>
        {
            socket.emit('rejectDrawRequest')
        })
    }
})
socket.on('opponentDrawRequestAccepted', () => // Draw accepted
{
    if (gameOver) return
    gameOver = true

    displayDraw()
    $('.message').animate({ height: '0px' }, 100)
    message.innerHTML = "" 
})
socket.on('opponentDrawRequestRejected', () => // Draw rejected
{
    $('.message').animate({ height: '0px' }, 100)
    message.innerHTML = ""
})



socket.on('opponentUndoRequest', (color) =>
{
    const message = document.querySelector(".message")

    if (color != playerColor)
    {
        message.innerHTML = "<button class='green' action='acceptUndo'>Akceptuj</button><h3>Przeciwnik prosi o cofnięcie ruchu</h3><button class='cancel' action='rejectUndo'>Odrzuć</button>"
        $('.message').animate({ height: '8vh' }, 100)

        // Accept undo
        document.querySelector('button[action=acceptUndo]').addEventListener('click', () =>
        {
            socket.emit('acceptUndoRequest', playerColor)
        })

        // Reject draw
        document.querySelector('button[action=rejectUndo]').addEventListener('click', () =>
        {
            socket.emit('rejectUndoRequest', playerColor)
        })
    }
})
socket.on('opponentUndoRequestAccepted', (color) => // Undo accepted
{
    $('.message').animate({ height: '0px' }, 100)
    message.innerHTML = "" 
    game.undo()
})
socket.on('opponentUndoRequestRejected', () => // Undo rejected
{
    $('.message').animate({ height: '0px' }, 100)
    message.innerHTML = ""
})


// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() 
{
    board.position(game.fen())
}

function updateStatus() 
{
    var status = ''

    var moveColor = 'Białe'
    if (game.turn() === 'b') 
    {
        moveColor = 'Czarne'
    }
    const localColor = (playerColor == "white") ? "Białe" : "Czarne"

    // checkmate?
    if (game.in_checkmate()) 
    {
        if (localColor != moveColor) 
        {
            displayWin("poprzez <b>mata<b>.") 
        }
        else 
        {
            displayLose("poprzez <b>mata<b>.")
        }
        
        status = 'Koniec gry, ' + moveColor + ', szach mat.'
    }

    // draw?
    else if (game.in_draw()) 
    {
        displayDraw()
        status = 'Koniec gry, remis.'
    }

    else if (gameOver) 
    {
        status = 'Koniec gry, przeciwnik wyszedł!'
        displayWin("przeciwnik porzucił partię.")
    }

    else if (!gameHasStarted) 
    {
        status = 'Oczekiwanie na dołączenie przeciwnika.'
    }

    // game still on
    else 
    {
        status = 'Ruch ' + ((moveColor == "Białe") ? 'białych' : 'czarnych')

        // check?
        if (game.in_check()) 
        {
            status += ', ' + moveColor + ' szach.'

            // Display check on king
            const getCheckedKing = document.querySelector('img[data-piece=' + game.turn() + 'K]')
            getCheckedKing.parentElement.classList.add('check')
        }
        else status += "."
    }


    let gamePgn = game.pgn().split(' ')
    let htmlPgn = "<tr><th></th><th>Białe</th><th>Czarne</th></tr>"

    let slicedPgn = []

    for (let i = 0; i < gamePgn.length; i += 3)
    {
        slicedPgn.push(gamePgn.slice(i, i + 3))
    }

    if (slicedPgn[0] != '')
    {
        slicedPgn.forEach(l => 
        {
            const number = l[0]
            const white = (l.length > 1) ? l[1] : ""
            const black = (l.length > 2) ? l[2] : ""
    
            htmlPgn += "<tr><td>" + number + "</td><td>" + white + "</td><td>" + black + "</td></tr>"
        })
    }
    

    // Update game status
    stat.forEach(s => 
    {
        s.innerHTML = status
    })

    // Update PGN
    pgn.forEach(p =>
    {
        p.innerHTML = htmlPgn
    })    
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
}
board = Chessboard('myBoard', config)
$(window).resize(board.resize)
if (playerColor == 'black') 
{
    board.flip();
}

updateStatus()

if (gameData.code) 
{
    socket.emit('joinGame', 
    {
        code: gameData.code,
        color: playerColor,
        user
    })
}

socket.on('startGame', function(data) 
{
    gameHasStarted = true;
    updateStatus()

    // Hide searching for game
    const searchingForOpponent = document.querySelector("div.layer.popup.center")
    if (searchingForOpponent !== null)
    {
        searchingForOpponent.classList.add("hide")
        setTimeout(() =>
        {
            searchingForOpponent.remove()
        }, 500) // 0.5s
    }

    function fillPlayerData(obj, dat)
    {
        // Avatar
        if (dat.user.avatar == '') obj.children[0].children[0].setAttribute('src', "/public/assets/icons/profile.png")
        else obj.children[0].children[0].setAttribute('src', dat.user.avatar)

        // Nick
        if (dat.user.username == '') obj.children[1].textContent = "Anonimowy"
        else obj.children[1].textContent = dat.user.username

        // Ranking
        if (dat.user.ranking == '') obj.children[2].children[1].textContent = "-"
        else obj.children[2].children[1].textContent = dat.user.ranking
    }

    // Fill players data
    const player1 = document.querySelectorAll('div[player=player1]') // bottom
    const player2 = document.querySelectorAll('div[player=player2]') // top

    if (playerColor == data.gameData.players[0].color) 
    {
        player1.forEach(pl => {
            fillPlayerData(pl, data.gameData.players[0])
        })
    }
    else 
    {
        player2.forEach(pl => {
            fillPlayerData(pl, data.gameData.players[0])
        })
    }

    if (playerColor == data.gameData.players[1].color)
    {
        player1.forEach(pl => {
            fillPlayerData(pl, data.gameData.players[1])
        })
    }
    else
    {
        player2.forEach(pl => {
            fillPlayerData(pl, data.gameData.players[1])
        })
    }

    // Fill popup data
    const youWin = document.getElementById('win')
    const youLose = document.getElementById('lose')
    const draw = document.getElementById('draw')

    if (playerColor == data.gameData.players[0].color)
    {
        // You
        fillPopupData(youWin.children[0].children[0].children[2].children[0].children[0],
            data.gameData.players[0], data.gameData.players[0].user.ranking + " + 6")
        fillPopupData(youLose.children[0].children[0].children[2].children[0].children[0],
            data.gameData.players[0], data.gameData.players[0].user.ranking + " - 6")
        fillPopupData(draw.children[0].children[0].children[2].children[0].children[0],
            data.gameData.players[0], data.gameData.players[0].user.ranking)

        // Oponnent
        fillPopupData(youWin.children[0].children[0].children[2].children[0].children[2],
            data.gameData.players[1], data.gameData.players[1].user.ranking + " - 6")
        fillPopupData(youLose.children[0].children[0].children[2].children[0].children[2],
            data.gameData.players[1], data.gameData.players[1].user.ranking + " + 6")
        fillPopupData(draw.children[0].children[0].children[2].children[0].children[2],
            data.gameData.players[1], data.gameData.players[1].user.ranking)
    }
    else
    {
        // You
        fillPopupData(youWin.children[0].children[0].children[2].children[0].children[2],
            data.gameData.players[0], data.gameData.players[0].user.ranking + " - 6")
        fillPopupData(youLose.children[0].children[0].children[2].children[0].children[2],
            data.gameData.players[0], data.gameData.players[0].user.ranking + " + 6")
        fillPopupData(draw.children[0].children[0].children[2].children[0].children[2],
            data.gameData.players[0], data.gameData.players[0].user.ranking)

        // Oponnent
        fillPopupData(youWin.children[0].children[0].children[2].children[0].children[0],
            data.gameData.players[1], data.gameData.players[1].user.ranking + " + 6")
        fillPopupData(youLose.children[0].children[0].children[2].children[0].children[0],
            data.gameData.players[1], data.gameData.players[1].user.ranking + " - 6")
        fillPopupData(draw.children[0].children[0].children[2].children[0].children[0],
            data.gameData.players[1], data.gameData.players[1].user.ranking)
    }

    function fillPopupData(obj, dat, rk)
    {
        // Avatar
        if (dat.user.avatar == '') obj.children[0].setAttribute('src', "/public/assets/icons/profile.png")
        else obj.children[0].setAttribute('src', dat.user.avatar)

        // Nick
        if (dat.user.username == '') obj.children[1].textContent = "Anonimowy"
        else obj.children[1].textContent = dat.user.username

        // Ranking
        if (dat.user.ranking == '') obj.children[2].textContent = "-"
        else obj.children[2].textContent = rk
    }
})

socket.on('gameOverDisconnect', function() 
{
    if (gameOver) return
    gameOver = true;
    updateStatus()
})

function displayWin(reason) 
{
    const win = document.getElementById('win')
    win.children[0].children[0].children[1].innerHTML = reason

    $('#win').fadeTo(100, 1);

    endGame(gameData.color)
}

function displayLose(reason)
{
    const lose = document.getElementById('lose')
    lose.children[0].children[0].children[1].innerHTML = reason

    $('#lose').fadeTo(100, 1);
}

function displayDraw() 
{
    $('#draw').fadeTo(100, 1);
}

const message = document.querySelector('.message')
// Controll buttons
const undo = document.querySelectorAll('i[action=undo]')
const draw = document.querySelectorAll('i[action=draw]')
const surrender = document.querySelectorAll('i[action=surrender]')

undo.forEach(el =>
{
    el.addEventListener('click', () =>
    {
        socket.emit('undoRequest', playerColor)

        message.innerHTML = "<h3>Wysłano prośbę o cofnięcie ruchu. Oczekiwanie na odpowiedź...</h3><button class='cancel' action='cancelUndoRequest'>Anuluj</button>"
        $('.message').animate({ height: '8vh' }, 100)

        document.querySelector('button[action=cancelUndoRequest]').addEventListener('click', () =>
        {
            message.innerHTML = ""
            $('.message').animate({ height: '0px' }, 100)
            socket.emit('rejectUndoRequest')
        })
    })
})

draw.forEach(el =>
{
    el.addEventListener('click', () =>
    {
        socket.emit('drawRequest', playerColor)

        message.innerHTML = "<h3>Wysłano propozycję remisu. Oczekiwanie na odpowiedź...</h3><button class='cancel' action='cancelDrawRequest'>Anuluj</button>"
        $('.message').animate({ height: '8vh' }, 100)
        
        document.querySelector('button[action=cancelDrawRequest]').addEventListener('click', () =>
        {
            message.innerHTML = ""
            $('.message').animate({ height: '0px' }, 100)
            socket.emit('rejectDrawRequest')
        })

    })
})

surrender.forEach(el =>
{
    el.addEventListener('click', () =>
    {
        displayLose("poddałeś się.")
        socket.emit('surrender', playerColor)
    })
})

function endGame(winColor)
{
    gameOver = true
    socket.emit('endGame', { 
        code: gameData.code,
        win: winColor
    })
}