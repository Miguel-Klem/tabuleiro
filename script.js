let board = [];
let currentPlayer = 1; // 1: Brancas (jogador 1), 2: Vermelhas (jogador 2 / CPU)
let gameMode = 'cpu';  // 'cpu' ou 'local'
let selectedSquare = null;
let activeValidMoves = [];
let isGameOver = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    showModeModal();
});

function showModeModal() {
    document.getElementById('mode-modal').classList.remove('hidden');
}

function startGame(mode) {
    gameMode = mode;
    document.getElementById('mode-modal').classList.add('hidden');
    document.getElementById('p2-name').innerText = mode === 'cpu' ? '🤖 CPU' : '🔴 Vermelhas';
    resetGame();
}

function resetGame() {
    board = initBoard();
    currentPlayer = 1;
    selectedSquare = null;
    activeValidMoves = [];
    isGameOver = false;
    document.getElementById('winner-modal').classList.add('hidden');
    updateUI();
    renderBoard();
}

function initBoard() {
    let newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if ((r + c) % 2 === 1) {
                if (r < 3) {
                    newBoard[r][c] = { player: 2, isKing: false };
                } else if (r > 4) {
                    newBoard[r][c] = { player: 1, isKing: false };
                }
            }
        }
    }
    return newBoard;
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    const allCurrentMoves = getAllValidMoves(board, currentPlayer);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.row = r;
            square.dataset.col = c;

            if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
                square.classList.add('selected');
            }

            if (activeValidMoves.some(m => m.to.r === r && m.to.c === c)) {
                square.classList.add('valid-move');
            }

            const piece = board[r][c];
            if (piece) {
                const pieceEl = document.createElement('div');
                pieceEl.className = `piece player${piece.player} ${piece.isKing ? 'king' : ''}`;
                square.appendChild(pieceEl);
            }

            square.addEventListener('click', () => handleSquareClick(r, c, allCurrentMoves));
            boardEl.appendChild(square);
        }
    }
}

function handleSquareClick(r, c, allCurrentMoves) {
    if (isGameOver) return;
    if (gameMode === 'cpu' && currentPlayer === 2) return; // Vez da CPU

    const targetMove = activeValidMoves.find(m => m.to.r === r && m.to.c === c);

    if (targetMove) {
        // Executa movimento selecionado
        executeMove(targetMove);
        return;
    }

    const clickedPiece = board[r][c];
    if (clickedPiece && clickedPiece.player === currentPlayer) {
        // Seleciona a peça e filtra suas jogadas válidas
        selectedSquare = { r, c };
        activeValidMoves = allCurrentMoves.filter(m => m.from.r === r && m.from.c === c);
        renderBoard();
    } else {
        selectedSquare = null;
        activeValidMoves = [];
        renderBoard();
    }
}

function executeMove(move) {
    board = move.finalBoard;
    selectedSquare = null;
    activeValidMoves = [];

    // Troca de turno
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateUI();
    renderBoard();

    checkGameEnd();

    // Se for modo CPU e vez da CPU
    if (!isGameOver && gameMode === 'cpu' && currentPlayer === 2) {
        setTimeout(makeCPUMove, 500);
    }
}

function makeCPUMove() {
    const validMoves = getAllValidMoves(board, 2);
    if (validMoves.length === 0) {
        checkGameEnd();
        return;
    }

    // Algoritmo Minimax para escolha da melhor jogada da CPU
    let bestMove = getBestCPUMove(validMoves);
    executeMove(bestMove);
}

function getBestCPUMove(validMoves) {
    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (let move of validMoves) {
        let score = minimax(move.finalBoard, 3, -Infinity, Infinity, false);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

function minimax(boardState, depth, alpha, beta, isMaximizing) {
    if (depth === 0 || isTerminalState(boardState)) {
        return evaluateBoard(boardState);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        const moves = getAllValidMoves(boardState, 2);
        if (moves.length === 0) return -10000;
        for (let move of moves) {
            let evalVal = minimax(move.finalBoard, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, evalVal);
            alpha = Math.max(alpha, evalVal);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const moves = getAllValidMoves(boardState, 1);
        if (moves.length === 0) return 10000;
        for (let move of moves) {
            let evalVal = minimax(move.finalBoard, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, evalVal);
            beta = Math.min(beta, evalVal);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(boardState) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = boardState[r][c];
            if (piece) {
                let val = piece.isKing ? 35 : 10;
                if (!piece.isKing) {
                    val += (piece.player === 2) ? r : (7 - r);
                }
                if (r >= 2 && r <= 5 && c >= 2 && c <= 5) val += 2; // Controle de centro
                
                score += (piece.player === 2) ? val : -val;
            }
        }
    }
    return score;
}

function isTerminalState(boardState) {
    return countPieces(boardState, 1) === 0 || countPieces(boardState, 2) === 0;
}

function countPieces(boardState, player) {
    let count = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (boardState[r][c] && boardState[r][c].player === player) count++;
        }
    }
    return count;
}

function checkGameEnd() {
    const p1Pieces = countPieces(board, 1);
    const p2Pieces = countPieces(board, 2);
    const currentMoves = getAllValidMoves(board, currentPlayer);

    let winner = null;

    if (p1Pieces === 0) winner = gameMode === 'cpu' ? '🤖 CPU Venceu!' : '🔴 Vermelhas Venceram!';
    else if (p2Pieces === 0) winner = '⚪ Brancas Venceram!';
    else if (currentMoves.length === 0) {
        winner = currentPlayer === 1 ? (gameMode === 'cpu' ? '🤖 CPU Venceu! (Sem movimentos)' : '🔴 Vermelhas Venceram!') : '⚪ Brancas Venceram!';
    }

    if (winner) {
        isGameOver = true;
        document.getElementById('winner-title').innerText = winner;
        document.getElementById('winner-message').innerText = 'Fim da partida!';
        document.getElementById('winner-modal').classList.remove('hidden');
    }
}

function updateUI() {
    const p1Count = countPieces(board, 1);
    const p2Count = countPieces(board, 2);

    document.getElementById('p1-score').innerText = `Peças: ${p1Count}`;
    document.getElementById('p2-score').innerText = `Peças: ${p2Count}`;

    const statusText = document.getElementById('status-text');
    const p1Card = document.getElementById('p1-card');
    const p2Card = document.getElementById('p2-card');

    if (currentPlayer === 1) {
        statusText.innerText = 'Vez das Brancas';
        p1Card.classList.add('active');
        p2Card.classList.remove('active');
    } else {
        statusText.innerText = gameMode === 'cpu' ? 'Vez da CPU...' : 'Vez das Vermelhas';
        p2Card.classList.add('active');
        p1Card.classList.remove('active');
    }
}

// LÓGICA DE MOVIMENTAÇÃO DA DAMA (Regras Brasileiras)
function getAllValidMoves(boardState, player) {
    let allMoves = [];
    let hasCapture = false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = boardState[r][c];
            if (piece && piece.player === player) {
                const jumps = getPieceJumps(boardState, r, c, new Set());
                if (jumps.length > 0) {
                    hasCapture = true;
                    jumps.forEach(j => {
                        allMoves.push({
                            from: { r, c },
                            to: j.path[j.path.length - 1],
                            path: j.path,
                            captured: j.captured,
                            isCapture: true,
                            finalBoard: j.finalBoard
                        });
                    });
                }
            }
        }
    }

    if (hasCapture) {
        // Regra da Maioria: Obriga a captura com o maior número de peças
        let maxCap = Math.max(...allMoves.map(m => m.captured.length));
        return allMoves.filter(m => m.captured.length === maxCap);
    }

    // Se não há captura, gera movimentos normais
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = boardState[r][c];
            if (piece && piece.player === player) {
                const simpleMoves = getPieceSimpleMoves(boardState, r, c);
                simpleMoves.forEach(m => allMoves.push(m));
            }
        }
    }

    return allMoves;
}

function getPieceSimpleMoves(boardState, r, c) {
    const piece = boardState[r][c];
    if (!piece) return [];
    const moves = [];
    const player = piece.player;

    if (!piece.isKing) {
        const dirs = player === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
        for (let [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && boardState[nr][nc] === null) {
                let tempBoard = cloneBoard(boardState);
                tempBoard[nr][nc] = tempBoard[r][c];
                tempBoard[r][c] = null;
                if ((player === 1 && nr === 0) || (player === 2 && nr === 7)) {
                    tempBoard[nr][nc].isKing = true;
                }
                moves.push({
                    from: { r, c },
                    to: { r: nr, c: nc },
                    path: [{ r: nr, c: nc }],
                    captured: [],
                    isCapture: false,
                    finalBoard: tempBoard
                });
            }
        }
    } else {
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (let [dr, dc] of dirs) {
            let step = 1;
            while (true) {
                let nr = r + dr * step, nc = c + dc * step;
                if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                if (boardState[nr][nc] !== null) break;

                let tempBoard = cloneBoard(boardState);
                tempBoard[nr][nc] = tempBoard[r][c];
                tempBoard[r][c] = null;

                moves.push({
                    from: { r, c },
                    to: { r: nr, c: nc },
                    path: [{ r: nr, c: nc }],
                    captured: [],
                    isCapture: false,
                    finalBoard: tempBoard
                });
                step++;
            }
        }
    }
    return moves;
}

function getPieceJumps(boardState, r, c, capturedSet = new Set()) {
    const piece = boardState[r][c];
    if (!piece) return [];
    const jumps = [];
    const player = piece.player;
    const opponent = player === 1 ? 2 : 1;
    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    if (!piece.isKing) {
        for (let [dr, dc] of dirs) {
            let mr = r + dr, mc = c + dc;
            let lr = r + 2 * dr, lc = c + 2 * dc;

            if (
                lr >= 0 && lr < 8 && lc >= 0 && lc < 8 &&
                boardState[mr][mc] && boardState[mr][mc].player === opponent &&
                !capturedSet.has(`${mr},${mc}`) &&
                boardState[lr][lc] === null
            ) {
                let newCaptured = new Set(capturedSet);
                newCaptured.add(`${mr},${mc}`);

                let tempBoard = cloneBoard(boardState);
                tempBoard[lr][lc] = tempBoard[r][c];
                tempBoard[r][c] = null;

                if ((player === 1 && lr === 0) || (player === 2 && lr === 7)) {
                    tempBoard[lr][lc].isKing = true;
                }

                let nextJumps = getPieceJumps(tempBoard, lr, lc, newCaptured);

                if (nextJumps.length > 0) {
                    for (let nj of nextJumps) {
                        jumps.push({
                            path: [{ r: lr, c: lc }, ...nj.path],
                            captured: [{ r: mr, c: mc }, ...nj.captured],
                            finalBoard: nj.finalBoard
                        });
                    }
                } else {
                    jumps.push({
                        path: [{ r: lr, c: lc }],
                        captured: [{ r: mr, c: mc }],
                        finalBoard: tempBoard
                    });
                }
            }
        }
    } else {
        for (let [dr, dc] of dirs) {
            let step = 1;
            let foundOpponent = null;

            while (true) {
                let nr = r + dr * step, nc = c + dc * step;
                if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

                let cell = boardState[nr][nc];
                if (cell !== null) {
                    if (cell.player === opponent && !capturedSet.has(`${nr},${nc}`)) {
                        if (foundOpponent === null) foundOpponent = { r: nr, c: nc };
                        else break;
                    } else break;
                } else {
                    if (foundOpponent !== null) {
                        let lr = nr, lc = nc;
                        let newCaptured = new Set(capturedSet);
                        newCaptured.add(`${foundOpponent.r},${foundOpponent.c}`);

                        let tempBoard = cloneBoard(boardState);
                        tempBoard[lr][lc] = tempBoard[r][c];
                        tempBoard[r][c] = null;

                        let nextJumps = getPieceJumps(tempBoard, lr, lc, newCaptured);

                        if (nextJumps.length > 0) {
                            for (let nj of nextJumps) {
                                jumps.push({
                                    path: [{ r: lr, c: lc }, ...nj.path],
                                    captured: [{ r: foundOpponent.r, c: foundOpponent.c }, ...nj.captured],
                                    finalBoard: nj.finalBoard
                                });
                            }
                        } else {
                            jumps.push({
                                path: [{ r: lr, c: lc }],
                                captured: [{ r: foundOpponent.r, c: foundOpponent.c }],
                                finalBoard: tempBoard
                            });
                        }
                    }
                }
                step++;
            }
        }
    }

    return jumps;
}

function cloneBoard(boardState) {
    return boardState.map(row => row.map(cell => cell ? { ...cell } : null));
}