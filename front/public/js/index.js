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
        const pos = square.match(/[a-h][1-8]/)

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

    const attack = document.querySelectorAll(".attack")
    attack.forEach(atc =>
    {
        atc.classList.remove('attack')
    })


    // illegal move
    if (move === null) return 'snapback'

    socket.emit('move', theMove);

    updateStatus()
}

socket.on('newMove', function(move) 
{
    game.move(move);
    board.position(game.fen());
    updateStatus();
});

socket.on('opponentSurrendered', (color) =>
{
    gameOver = true
    if (color != playerColor) displayWin("przeciwnik się poddał.")
})

socket.on('opponentDrawRequest', (color) =>
{
    const messages = document.querySelectorAll(".message")

    if (color != playerColor)
    {
        messages.forEach(msg =>
        {
            msg.innerHTML = "<h4>Przeciwnik proponuje remis</h4>"
        })
    }
    
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
        if (localColor != moveColor) displayWin("poprzez <b>mata<b>.") 
        else displayLose("poprzez <b>mata<b>.")
        
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

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('code')) 
{
    socket.emit('joinGame', 
    {
        code: urlParams.get('code')
    });
}

socket.on('startGame', function() 
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
});

socket.on('gameOverDisconnect', function() 
{
    gameOver = true;
    updateStatus()
})

function displayWin(reason) 
{
    const win = document.getElementById('win')
    win.children[0].children[0].children[1].innerHTML = reason

    $('#win').fadeTo(100, 1);
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

// Controll buttons
const undo = document.querySelectorAll('i[action=undo]')
const draw = document.querySelectorAll('i[action=draw]')
const surrender = document.querySelectorAll('i[action=surrender]')

undo.forEach(el =>
{
    el.addEventListener('click', () =>
    {
        socket.emit('undoRequest', playerColor)
    })
})

draw.forEach(el =>
{
    el.addEventListener('click', () =>
    {
        socket.emit('drawRequest', playerColor)

        const messages = document.querySelectorAll(".message")
        messages.forEach(msg =>
        {
            msg.innerHTML = "<h4>Wysłano propozycję remisu...</h4>"
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