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
}

function onDrop (source, target) 
{
    let theMove = {
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for simplicity
    };
    // see if the move is legal
    var move = game.move(theMove);


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

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() 
{
    board.position(game.fen())
}

function updateStatus () 
{
    var status = ''

    var moveColor = 'Białe'
    if (game.turn() === 'b') {
        moveColor = 'Czarne'
    }

    // checkmate?
    if (game.in_checkmate()) 
    {
        displayWin("poprzez <b>mata<b>.")
        status = 'Koniec gry, ' + moveColor + ', szach mat.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Koniec gry, remis.'
    }

    else if (gameOver) {
        status = 'Koniec gry, przeciwnik wyszedł!'
        displayWin("przeciwnik porzucił partię.")
    }

    else if (!gameHasStarted) {
        status = 'Oczekiwanie na dołączenie przeciwnika.'
    }

    // game still on
    else 
    {
        status = 'Ruch ' + (moveColor == "Białe") ? 'białych' : 'czarnych'

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
    const winElement = '<div class="layer popup center hide"><div class="you-win center"><div class="box column"><h2>Wygrałeś!</h2><p>' + reason + '</p><a class="cancel" href="/">Powrót</a></div></div></div>'

    const main = document.querySelector('main')
    main.innerHTML += winElement

    const popup = main.children[main.children.length - 1]
    popup.classList.remove("hide")
}

function displayLose(reason) 
{
    const loseElement = '<div class="layer popup center hide"><div class="you-lose center"><div class="box column"><h2>Przegrałeś!</h2><p>' + reason + '</p><a class="cancel" href="/">Powrót</a></div></div></div>'

    const main = document.querySelector('main')
    main.innerHTML += loseElement

    const popup = main.children[main.children.length - 1]
    popup.classList.remove("hide")
}