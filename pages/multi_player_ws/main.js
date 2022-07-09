var ClickEvents = [];
var maxTickTime = 0;

var mainCanvas, mainCanvasCtx;
var cell_w, cell_b, cell_size = 50;

var mainClockInterval = 20;

var TICK = 0;

function getPieceWaitingTime(pk)
{
    if (pk[1] == 'N' || pk[1] == 'Q')
        return 25;
    else
        return 50;
}

var Board = [
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '']
];

var boardPieces = {
    'wP0': [0, 6], 'wP1': [1, 6], 'wP2': [2, 6], 'wP3': [3, 6], 'wP4': [4, 6], 'wP5': [5, 6], 'wP6': [6, 6], 'wP7': [7, 6],
    'wR0': [0, 7], 'wN1': [1, 7], 'wB2': [2, 7], 'wQ3': [3, 7], 'wK4': [4, 7], 'wB5': [5, 7], 'wN6': [6, 7], 'wR7': [7, 7],
    'bP0': [0, 1], 'bP1': [1, 1], 'bP2': [2, 1], 'bP3': [3, 1], 'bP4': [4, 1], 'bP5': [5, 1], 'bP6': [6, 1], 'bP7': [7, 1],
    'bR0': [0, 0], 'bN1': [1, 0], 'bB2': [2, 0], 'bQ3': [3, 0], 'bK4': [4, 0], 'bB5': [5, 0], 'bN6': [6, 0], 'bR7': [7, 0],
}

var mouseLastClick = undefined, mouseSelectedPiece = undefined;

function onBodyLoad()
{
    var currentUrl = document.URL.split('/');
    for (let i = 0; i < currentUrl.length; i++)
        if (currentUrl[i].includes(':'))
        {
            var hostPiece = currentUrl[i].split(':');
            if (hostPiece.length > 1 && hostPiece[1].length > 0)
                document.getElementById('ws_ip').value = hostPiece[0] + ':' + ws_DEFAULT_PORT;
        }

    mainCanvas = document.getElementById('canvas');
    mainCanvasCtx = mainCanvas.getContext('2d');
    mainCanvasCtx.font = "20px Arial";
    mainCanvasCtx.fillStyle = "black";
    mainCanvasCtx.textAlign = "center";

    cell_w = document.getElementById("cell_w");
    cell_b = document.getElementById("cell_b");
}

function fillBoardCell(x, y)
{
    mainCanvasCtx.drawImage(((x + y) % 2 == 0) ? cell_w : cell_b, x * cell_size, y * cell_size, cell_size, cell_size);
}
function fillBoardPiece(x, y)
{
    var boardCell = Board[y][x];
    mainCanvasCtx.fillStyle = (boardCell[0] == 'w') ? "green" : "black";
    mainCanvasCtx.fillText(boardCell[1], x * cell_size + cell_size * 0.5, y * cell_size + cell_size * 0.65);
}
function fillHighlightSquare(x, y)
{
    mainCanvasCtx.strokeStyle = "black";
    mainCanvasCtx.strokeRect(x * cell_size + 5, y * cell_size + 5, cell_size - 10, cell_size - 10)
}
function fillArrow(x1, y1, x2, y2)
{
    mainCanvasCtx.beginPath();
    mainCanvasCtx.moveTo(x1 * cell_size + cell_size * 0.5, y1 * cell_size + cell_size * 0.5);
    mainCanvasCtx.lineTo(x2 * cell_size + cell_size * 0.5, y2 * cell_size + cell_size * 0.5);
    mainCanvasCtx.strokeStyle = "red";
    mainCanvasCtx.stroke();
    mainCanvasCtx.closePath();
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

// function mainClock()
// {
//     var tickStart = performance.now();
//     TICK ++;

//     while (ClickEvents.length > 0)
//     {
//         ce = ClickEvents.pop();
//         if (mouseSelectedPiece == undefined)
//         {
//             if (Board[ce[1]][ce[0]] != '')
//                 mouseSelectedPiece = Board[ce[1]][ce[0]];
//         }
//         else
//         {
//             if (boardPieces[mouseSelectedPiece].length > 2)
//                 boardPieces[mouseSelectedPiece].pop();
//             if (ce[0] != boardPieces[mouseSelectedPiece][0] || ce[1] != boardPieces[mouseSelectedPiece][1])
//             if (checkValidMove(mouseSelectedPiece, [boardPieces[mouseSelectedPiece][0], boardPieces[mouseSelectedPiece][1]], [ce[0], ce[1]]))
//                 boardPieces[mouseSelectedPiece].push({'ticksStart': TICK, 's': [boardPieces[mouseSelectedPiece][0], boardPieces[mouseSelectedPiece][1]], 't': [ce[0], ce[1]]});

//             mouseSelectedPiece = undefined;
//         }
//         mouseLastClick = ce;
//     }

//     for (let x = 0; x < 8; x++)
//         for (let y = 0; y < 8; y++)
//         {
//             Board[y][x] = '';
//             fillBoardCell(x, y);
//         }
//     for ([pk, pv] of Object.entries(boardPieces))
//         {
//             if (pv != undefined)
//             {
//                 var x = pv[0], y = pv[1];
//                 Board[y][x] = pk;
//             }
//         }
//     for ([pk, pv] of Object.entries(boardPieces))
//     {
//         if (pv != undefined)
//         if (pv.length > 2)
//             {
//                 var cx = pv[0], cy = pv[1], movementData = pv[2];
//                 if (movementData.ticksStart + getPieceWaitingTime(pk) == TICK)
//                 {
//                     var n = getMovedPiecePosition(pk, movementData.s, movementData.t, [cx, cy]);

//                     if (n[0] == movementData.t[0] && n[1] == movementData.t[1])
//                         pv.pop();
//                     else
//                         movementData.ticksStart = TICK;                    

//                     if (Board[n[1]][n[0]] == '')
//                     {
//                         pv[0] = n[0]; pv[1] = n[1];
//                     }
//                     else
//                     {
//                         if (pv.length > 2)
//                             pv.pop();

//                         if (pk[0] != Board[n[1]][n[0]][0])
//                         {
//                             boardPieces[Board[n[1]][n[0]]] = undefined;
//                             pv[0] = n[0]; pv[1] = n[1];
//                         }                        
//                     }                    
//                 }
//                 else
//                 {
//                     fillArrow(movementData.s[0], movementData.s[1], movementData.t[0], movementData.t[1]);
//                 }
//             }
//     }
//     for (let x = 0; x < 8; x++)
//         for (let y = 0; y < 8; y++)
//             Board[y][x] = '';
//     for ([pk, pv] of Object.entries(boardPieces))
//     {
//         if (pv != undefined)
//         {
//             var x = pv[0], y = pv[1];
//             Board[y][x] = pk;
//             fillBoardPiece(x, y);
//         }
//     }
//     if (mouseSelectedPiece != undefined)
//         fillHighlightSquare(boardPieces[mouseSelectedPiece][0], boardPieces[mouseSelectedPiece][1])

//     var tickTime = performance.now() - tickStart;
//     maxTickTime = (tickTime > maxTickTime) ? tickTime : maxTickTime;
// }
// window.setInterval(mainClock, mainClockInterval);

function onBoardClick(e)
{
    if (self_type == null)
        return;

    var rect = canvas.getBoundingClientRect();
    var x = Math.floor(e.clientX - rect.left); x = Math.floor(x / cell_size);
    var y = Math.floor(e.clientY - rect.top); y = Math.floor(y / cell_size);

    ce = [x, y];
    if (mouseSelectedPiece == undefined)
    {
        if (Board[ce[1]][ce[0]] != '' && ((self_type == 'P0' && Board[ce[1]][ce[0]][0] == 'w') || (self_type == 'P1' && Board[ce[1]][ce[0]][0] == 'b')))
            mouseSelectedPiece = Board[ce[1]][ce[0]];
    }
    else
    {
        if (ce[0] != boardPieces[mouseSelectedPiece][0] || ce[1] != boardPieces[mouseSelectedPiece][1])
        {
            if (checkValidMove(mouseSelectedPiece, [boardPieces[mouseSelectedPiece][0], boardPieces[mouseSelectedPiece][1]], [ce[0], ce[1]]))
                ws_conn.send(JSON.stringify(
                    {
                        "type": "MOVE",
                        "gameId": document.getElementById('game_id').value,
                        "piece": mouseSelectedPiece,
                        "s": [boardPieces[mouseSelectedPiece][0], boardPieces[mouseSelectedPiece][1]],
                        "t": [ce[0], ce[1]]
                    }
                ));
        }
        else
        {
            ws_conn.send(JSON.stringify(
                {
                    "type": "MOVE",
                    "gameId": document.getElementById('game_id').value,
                    "piece": mouseSelectedPiece,
                    "s": [boardPieces[mouseSelectedPiece][0], boardPieces[mouseSelectedPiece][1]],
                    "t": [ce[0], ce[1]]
                }
            ));
        }        

        mouseSelectedPiece = undefined;
    }
    mouseLastClick = ce;
}

// Multi Player
var ws_DEFAULT_PORT = 7000;
var ws_ip = null;
var ws_conn = null;

var ws_ping_start = null;

var self_type = null;

function onWSConnectButton()
{
    var ws_ip_new = document.getElementById('ws_ip').value;
    document.getElementById('ping_btn').setAttribute('disabled', null); document.getElementById('ping').innerText = "";
    document.getElementById('join_btn').setAttribute('disabled', null); document.getElementById('spec_btn').setAttribute('disabled', null); document.getElementById('game_status').innerText = "";
    self_type = null;

    if (ws_conn != null)
    {
        ws_conn.close();
        ws_conn = null;
    }
    document.getElementById('conn_status').innerText = " Attempting to connect";
    ws_conn = new WebSocket("ws://" + ws_ip_new);    
    
    ws_conn.onopen = function ()
    {
        document.getElementById('conn_status').innerText = " Connection successful";
        document.getElementById('ping_btn').removeAttribute('disabled');
        document.getElementById('join_btn').removeAttribute('disabled');
        document.getElementById('spec_btn').removeAttribute('disabled');
        ws_ip = ws_ip_new;

        ws_conn.onmessage = function (e)
        {
            var data = JSON.parse(e.data);

            switch (data.type)
            {
                case "PONG":
                    var ws_ping_end = performance.now();
                    document.getElementById('ping').innerText = Math.ceil(ws_ping_end - ws_ping_start) + " ms";
                    break;
                
                case "JOINED_Spec":
                    self_type = "SPEC";
                    document.getElementById('game_status').innerText = "Spectating game.";
                    break;
                
                case "JOINED":
                    var playerOrder = data.order;
                    self_type = "P" + playerOrder;
                    document.getElementById('game_status').innerText = "Playing game as player " + (playerOrder + 1);
                    break;
                
                case "GAME_DATA":
                    boardPieces = data.boardPieces;
                    for (let x = 0; x < 8; x++)
                        for (let y = 0; y < 8; y++)
                        {
                            Board[y][x] = '';
                            fillBoardCell(x, y);
                        }
                    for ([pk, pv] of Object.entries(boardPieces))
                    {
                        if (pv != undefined)
                        {
                            var x = pv[0], y = pv[1];
                            Board[y][x] = pk;
                            fillBoardPiece(x, y);
                        }
                    }
                    for ([pk, pv] of Object.entries(boardPieces))
                    {
                        if (pv != undefined)
                        if (pv.length > 2)
                            fillArrow(pv[2].s[0], pv[2].s[1], pv[2].t[0], pv[2].t[1]);
                    }
                    if (mouseSelectedPiece != undefined)
                        fillHighlightSquare(boardPieces[mouseSelectedPiece][0], boardPieces[mouseSelectedPiece][1])
                    break;
            }
        }
    }
    ws_conn.onerror = function ()
    {
        document.getElementById('conn_status').innerText = " Connection failed";
        ws_ip = null; ws_conn.close(); ws_conn = null;
    }
}

function onWSPingButton()
{
    ws_ping_start = performance.now();
    ws_conn.send(JSON.stringify(
        {"type": "PING"}
    ));
}

function onJoinGame()
{
    if (ws_conn == null)
        return;
    
    game_id = document.getElementById('game_id').value;
    ws_conn.send(JSON.stringify(
        {"type": "JOIN", "gameId": game_id}
    ));
}

function onSpectateGame()
{
    if (ws_conn == null)
        return;
    
    game_id = document.getElementById('game_id').value;
    ws_conn.send(JSON.stringify(
        {"type": "JOIN_Spec", "gameId": game_id}
    ));
}