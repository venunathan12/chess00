var PORT = 7000;
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: PORT});
console.log("Server running at Port : " + PORT);

var games = {};

wss.on('connection', function(connection) {
  
    console.log("User connected");
	 
    connection.on('message', function(message)
    {	 
        var data = JSON.parse(message);

        switch (data.type)
        {
            case "PING":
                send(connection, {"type": "PONG"});
                break;
            
            case "JOIN":
                if (games[data.gameId] == null)
                {
                    games[data.gameId] = {
                        "Board": [
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', '']
                        ],
                        "boardPieces": {
                            'wP0': [0, 6], 'wP1': [1, 6], 'wP2': [2, 6], 'wP3': [3, 6], 'wP4': [4, 6], 'wP5': [5, 6], 'wP6': [6, 6], 'wP7': [7, 6],
                            'wR0': [0, 7], 'wN1': [1, 7], 'wB2': [2, 7], 'wQ3': [3, 7], 'wK4': [4, 7], 'wB5': [5, 7], 'wN6': [6, 7], 'wR7': [7, 7],
                            'bP0': [0, 1], 'bP1': [1, 1], 'bP2': [2, 1], 'bP3': [3, 1], 'bP4': [4, 1], 'bP5': [5, 1], 'bP6': [6, 1], 'bP7': [7, 1],
                            'bR0': [0, 0], 'bN1': [1, 0], 'bB2': [2, 0], 'bQ3': [3, 0], 'bK4': [4, 0], 'bB5': [5, 0], 'bN6': [6, 0], 'bR7': [7, 0],
                        },
                        "players": [connection],
                        "specs": [],
                        "moves": []
                    }

                    send(connection, {"type": "JOINED", "order": 0});
                }
                else
                {
                    game = games[data.gameId];
                    if (game.players.length < 2)
                    {
                        game.players.push(connection);
                        send(connection, {"type": "JOINED", "order": game.players.length - 1});
                    }                        
                    else
                        send(connection, {"type": "JOIN_FAILED"});
                }
                break;
            
            case "JOIN_Spec":
                if (games[data.gameId] == null)
                {
                    games[data.gameId] = {
                        "Board": [
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', ''],
                            ['', '', '', '', '', '', '', '']
                        ],
                        "boardPieces": {
                            'wP0': [0, 6], 'wP1': [1, 6], 'wP2': [2, 6], 'wP3': [3, 6], 'wP4': [4, 6], 'wP5': [5, 6], 'wP6': [6, 6], 'wP7': [7, 6],
                            'wR0': [0, 7], 'wN1': [1, 7], 'wB2': [2, 7], 'wQ3': [3, 7], 'wK4': [4, 7], 'wB5': [5, 7], 'wN6': [6, 7], 'wR7': [7, 7],
                            'bP0': [0, 1], 'bP1': [1, 1], 'bP2': [2, 1], 'bP3': [3, 1], 'bP4': [4, 1], 'bP5': [5, 1], 'bP6': [6, 1], 'bP7': [7, 1],
                            'bR0': [0, 0], 'bN1': [1, 0], 'bB2': [2, 0], 'bQ3': [3, 0], 'bK4': [4, 0], 'bB5': [5, 0], 'bN6': [6, 0], 'bR7': [7, 0],
                        },
                        "players": [],
                        "specs": [connection],
                        "moves": []
                    }

                    send(connection, {"type": "JOINED_Spec"});
                }
                else
                {
                    game = games[data.gameId];

                    game.specs.push(connection);
                    send(connection, {"type": "JOINED_Spec"});
                }
                break;
            
            case "MOVE":
                if (games[data.gameId] != null)
                {
                    game = games[data.gameId];
                    game.moves.push(data);
                }
                break;
        }      
   });   
});
  
function send(connection, message) { 
    connection.send(JSON.stringify(message)); 
}

var maxTickTime = 0;
var mainClockInterval = 20;

var TICK = 0;

function getPieceWaitingTime(pk)
{
    if (pk[1] == 'N' || pk[1] == 'Q')
        return 25;
    else
        return 50;
}

function checkValidMove(k, s, t)
{
    var pp = k[0], pt = k[1];
    var result = false;
    switch (pt)
    {
        case 'R':            
            if (t[0] == s[0] || t[1] == s[1])
                result = true;
            break;
        case 'B':            
            if (Math.abs(t[0]-s[0]) == Math.abs(t[1]-s[1]))
                result = true;
            break;
        case 'Q':
            if (t[0] == s[0] || t[1] == s[1])
                result = true;
            else if (Math.abs(t[0]-s[0]) == Math.abs(t[1]-s[1]))
                result = true;
            break;
        case 'P':            
            if (Math.abs(t[0]-s[0]) <= 1 && (t[1] - s[1]) * (pp == 'b' ? 1 : -1) > 0 && Math.abs(t[0]-s[0]) + Math.abs(t[1]-s[1]) <= 2)
                result = true;
            break;
        case 'N':
            if (Math.abs(t[0]-s[0]) + Math.abs(t[1]-s[1]) == 3 && Math.abs(t[0]-s[0]) <= 2 && Math.abs(t[1]-s[1]) <= 2)
                result = true;
            break;
        case 'K':
            if (Math.abs(t[0]-s[0]) <= 1 && Math.abs(t[1]-s[1]) <= 1)
                result = true;            
            break;
    
        default:
            break;
    }
    return result;
}
function getMovedPiecePosition(k, s, t, c)
{
    k = k[1];

    if (k == 'K')
        return t;
    if (k == 'N')
    {
        var md = Math.abs(t[0] - c[0]) + Math.abs(t[1] - c[1]);
        var sd = [t[0] - s[0], t[1] - s[1]];
        var longleg = (Math.abs(sd[0]) == 2) ? [Math.sign(sd[0]), 0] : [0, Math.sign(sd[1])];
        var shrtleg = (Math.abs(sd[0]) == 1) ? [Math.sign(sd[0]), 0] : [0, Math.sign(sd[1])];
        if (md != 2)
            return [c[0] + longleg[0], c[1] + longleg[1]];
        else
            return [c[0] + shrtleg[0], c[1] + shrtleg[1]];
    }
    if (k == 'R' || k == 'B' || k == 'Q' || k == 'P')
    {
        var d = [Math.sign(t[0] - s[0]), Math.sign(t[1] - s[1])];
        return [c[0] + d[0], c[1] + d[1]];
    }
}

function mainClock()
{
    var tickStart = performance.now();
    TICK ++;

    for (var [gameId, game] of Object.entries(games))
    {
        var Board = game.Board;
        var boardPieces = game.boardPieces;

        while (game.moves.length > 0)
        {
            move = game.moves.pop();
            
            if (boardPieces[move.piece] != undefined)
            if (boardPieces[move.piece][0] == move.s[0] && boardPieces[move.piece][1] == move.s[1])
            {
                while (boardPieces[move.piece].length > 2)
                    boardPieces[move.piece].pop();
                if (move.s[0] != move.t[0] || move.s[1] != move.t[1])
                    boardPieces[move.piece].push({'ticksStart': TICK, 's': move.s, 't': move.t});
            }
        }

        for (let x = 0; x < 8; x++)
            for (let y = 0; y < 8; y++)
            {
                Board[y][x] = '';
            }
        for ([pk, pv] of Object.entries(boardPieces))
            {
                if (pv != undefined)
                {
                    var x = pv[0], y = pv[1];
                    Board[y][x] = pk;
                }
            }
        for ([pk, pv] of Object.entries(boardPieces))
        {
            if (pv != undefined)
            if (pv.length > 2)
            {
                var cx = pv[0], cy = pv[1], movementData = pv[2];
                if (movementData.ticksStart + getPieceWaitingTime(pk) == TICK)
                {
                    var n = getMovedPiecePosition(pk, movementData.s, movementData.t, [cx, cy]);

                    if (n[0] == movementData.t[0] && n[1] == movementData.t[1])
                        pv.pop();
                    else
                        movementData.ticksStart = TICK;                    

                    if (Board[n[1]][n[0]] == '')
                    {
                        pv[0] = n[0]; pv[1] = n[1];
                    }
                    else
                    {
                        if (pv.length > 2)
                            pv.pop();

                        if (pk[0] != Board[n[1]][n[0]][0])
                        {
                            boardPieces[Board[n[1]][n[0]]] = undefined;
                            pv[0] = n[0]; pv[1] = n[1];
                        }                        
                    }                    
                }
            }
        }
        for (let x = 0; x < 8; x++)
            for (let y = 0; y < 8; y++)
                Board[y][x] = '';
        for ([pk, pv] of Object.entries(boardPieces))
        {
            if (pv != undefined)
            {
                var x = pv[0], y = pv[1];
                Board[y][x] = pk;
            }
        }

        var players = game.players;
        if (TICK % 2 == 0)
            players = players.reverse();
        for (var player of players)
        {
            send(player, {"type": "GAME_DATA", "boardPieces": game.boardPieces});
        }
        for (var spec of game.specs)
        {
            send(spec, {"type": "GAME_DATA", "boardPieces": game.boardPieces});
        }
    }

    var tickTime = performance.now() - tickStart;
    maxTickTime = (tickTime > maxTickTime) ? tickTime : maxTickTime;
}
setInterval(mainClock, mainClockInterval);

function periodicStats()
{
    var statsStr = 'periodicStats\n';
    statsStr += 'maxTickTime : ' + maxTickTime + '\n';
    console.log(statsStr);
}
setInterval(periodicStats, 5000);
