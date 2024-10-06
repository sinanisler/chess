const game = document.getElementById('game');

let board = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
];

const pieces = {
  'wK': '♔',
  'wQ': '♕',
  'wR': '♖',
  'wB': '♗',
  'wN': '♘',
  'wP': '♙',
  'bK': '♚',
  'bQ': '♛',
  'bR': '♜',
  'bB': '♝',
  'bN': '♞',
  'bP': '♟'
};

// Assigned values to each piece type
const pieceValues = {
  'P': 1,
  'N': 3,
  'B': 3,
  'R': 5,
  'Q': 9,
  'K': 1000
};

let selectedPiece = null;
let turn = 'w'; // 'w' for white's turn, 'b' for black's turn

// Set AI color to black
let aiColor = 'b';
let opponentColor = aiColor === 'w' ? 'b' : 'w';

// Keep track of whether the game is over
let gameOver = false;

// Keep track of whether kings and rooks have moved (for castling)
let kingMoved = { 'w': false, 'b': false };
let rookMoved = {
  'w0': false, // white rook on a1
  'w1': false, // white rook on h1
  'b0': false, // black rook on a8
  'b1': false  // black rook on h8
};

// Keep track of en passant target square
let enPassantSquare = null;

// Draw the board
function drawBoard() {
  game.innerHTML = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      if ((row + col) % 2 == 0) {
        square.classList.add('light');
      } else {
        square.classList.add('dark');
      }
      square.dataset.row = row;
      square.dataset.col = col;
      const piece = board[row][col];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.classList.add('piece');
        pieceEl.textContent = pieces[piece];
        pieceEl.dataset.piece = piece;
        pieceEl.dataset.row = row;
        pieceEl.dataset.col = col;
        square.appendChild(pieceEl);
      }
      game.appendChild(square);
    }
  }
}

drawBoard();

game.addEventListener('click', function (e) {
  if (gameOver) {
    return; // Do nothing if the game is over
  }
  const target = e.target;
  if (turn === aiColor) {
    return; // It's AI's turn
  }
  if (target.classList.contains('piece')) {
    const piece = target.dataset.piece;
    const color = piece[0];
    if (selectedPiece) {
      if (color === turn && color !== aiColor) {
        // Change selection to the new piece
        selectPiece(target);
        // Clear any messages
        document.getElementById('message').innerText = '';
      } else {
        // Try to move to this square (could be a capture)
        movePiece(target.parentElement);
      }
    } else {
      // Select the piece if it's the player's own piece
      if (color === turn && color !== aiColor) {
        selectPiece(target);
        // Clear any messages
        document.getElementById('message').innerText = '';
      }
    }
  } else if (target.classList.contains('square')) {
    movePiece(target);
  }
});

function selectPiece(pieceEl) {
  const piece = pieceEl.dataset.piece;
  const color = piece[0];
  if (color !== turn || color === aiColor) {
    return; // Not this player's turn or AI's piece
  }
  if (selectedPiece) {
    // Deselect previous piece
    selectedPiece.classList.remove('selected');
  }
  selectedPiece = pieceEl;
  selectedPiece.classList.add('selected');
}

function movePiece(targetEl) {
  if (gameOver) {
    return; // Do nothing if the game is over
  }
  if (!selectedPiece) {
    return;
  }
  let toRow, toCol;
  if (targetEl.classList.contains('square')) {
    toRow = parseInt(targetEl.dataset.row);
    toCol = parseInt(targetEl.dataset.col);
  } else if (targetEl.classList.contains('piece')) {
    toRow = parseInt(targetEl.dataset.row);
    toCol = parseInt(targetEl.dataset.col);
  } else {
    return;
  }

  const fromRow = parseInt(selectedPiece.dataset.row);
  const fromCol = parseInt(selectedPiece.dataset.col);

  // Implement move validation here
  const piece = selectedPiece.dataset.piece;
  let castling = false;
  let enPassantCapture = false;
  const valid = isValidMove(piece, fromRow, fromCol, toRow, toCol, castling, enPassantCapture);

  if (valid) {
    // Move the piece
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = "";

    const pieceType = piece[1];
    const color = piece[0];
    const dir = color === 'w' ? -1 : 1;

    // Handle en passant capture
    if (enPassantCapture) {
      board[fromRow][toCol] = ""; // Remove the captured pawn
    }

    // Handle castling move
    if (castling) {
      // Move the rook accordingly
      let rookFromCol = toCol > fromCol ? 7 : 0;
      let rookToCol = toCol > fromCol ? 5 : 3;
      let rookPiece = board[fromRow][rookFromCol];
      board[fromRow][rookToCol] = rookPiece;
      board[fromRow][rookFromCol] = "";

      // Update rookMoved
      rookMoved[color + (rookFromCol === 0 ? '0' : '1')] = true;
    }

    // Update moved flags
    if (pieceType === 'K') {
      kingMoved[color] = true;
    }
    if (pieceType === 'R') {
      let rookId = (fromCol === 0) ? '0' : (fromCol === 7) ? '1' : null;
      if (rookId !== null) {
        rookMoved[color + rookId] = true;
      }
    }

    // Check for pawn promotion
    if (piece[1] === 'P' && (toRow === 0 || toRow === 7)) {
      // Promote pawn to queen
      board[toRow][toCol] = piece[0] + 'Q';
    }

    // Handle en passant target square
    if (pieceType === 'P' && Math.abs(toRow - fromRow) === 2) {
      enPassantSquare = {
        row: fromRow + dir,
        col: fromCol,
        color: color
      };
    } else {
      enPassantSquare = null;
    }

    selectedPiece.classList.remove('selected');
    selectedPiece = null;
    drawBoard();

    // Clear any messages
    document.getElementById('message').innerText = '';

    // Switch turn
    turn = turn === 'w' ? 'b' : 'w';

    // Check for checkmate or stalemate
    if (isGameOver()) {
      let message = isKingInCheck(turn) ? 'Checkmate! ' : 'Stalemate! ';
      message += turn === aiColor ? 'You win!' : 'You lost!';
      document.getElementById('message').innerText = message;
      gameOver = true;
    } else {
      // Check if it's AI's turn
      if (turn === aiColor) {
        setTimeout(makeAIMove, 500); // Slight delay for realism
      }
    }
  } else {
    // Invalid move
    document.getElementById('message').innerText = 'Invalid move';
  }
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol, castling, enPassantCapture) {
  const pieceType = piece[1];
  const color = piece[0];
  const dir = color === 'w' ? -1 : 1; // Direction for pawns

  // Check if the destination square has a friendly piece
  const destinationPiece = board[toRow][toCol];
  if (destinationPiece && destinationPiece[0] === color) {
    return false;
  }

  let valid = false;

  switch (pieceType) {
    case 'P':
      // Pawn move
      if (fromCol === toCol) {
        // Move forward
        if (board[toRow][toCol] === "") {
          if (toRow - fromRow === dir) {
            valid = true;
          }
          // Initial double move
          else if ((color === 'w' && fromRow === 6 && toRow === 4 && board[5][fromCol] === "") ||
                   (color === 'b' && fromRow === 1 && toRow === 3 && board[2][fromCol] === "")) {
            valid = true;
          }
        }
      } else if (Math.abs(fromCol - toCol) === 1 && toRow - fromRow === dir) {
        // Capture
        if (board[toRow][toCol] && board[toRow][toCol][0] !== color) {
          valid = true;
        }
        // En passant
        else if (enPassantSquare &&
                 enPassantSquare.row === toRow &&
                 enPassantSquare.col === toCol &&
                 enPassantSquare.color !== color) {
          valid = true;
          enPassantCapture = true; // Indicate en passant capture
        }
      }
      break;
    case 'R':
      // Rook move
      if (fromRow === toRow || fromCol === toCol) {
        if (isPathClear(fromRow, fromCol, toRow, toCol)) {
          valid = true;
        }
      }
      break;
    case 'N':
      // Knight move
      if ((Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 1) ||
          (Math.abs(fromRow - toRow) === 1 && Math.abs(fromCol - toCol) === 2)) {
        valid = true;
      }
      break;
    case 'B':
      // Bishop move
      if (Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
        if (isPathClear(fromRow, fromCol, toRow, toCol)) {
          valid = true;
        }
      }
      break;
    case 'Q':
      // Queen move (rook + bishop)
      if ((fromRow === toRow || fromCol === toCol ||
          Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) &&
          isPathClear(fromRow, fromCol, toRow, toCol)) {
        valid = true;
      }
      break;
    case 'K':
      // King move
      if (Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1) {
        valid = true;
      }
      // Castling
      else if (!kingMoved[color] && fromRow === toRow && Math.abs(fromCol - toCol) === 2) {
        if (canCastle(color, fromRow, fromCol, toRow, toCol)) {
          valid = true;
          castling = true; // Indicate castling move
        }
      }
      break;
  }

  if (valid) {
    // Temporarily make the move
    const originalFromPiece = board[fromRow][fromCol];
    const originalToPiece = board[toRow][toCol];
    const capturedEnPassantPiece = enPassantCapture ? board[fromRow][toCol] : null;

    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = "";
    if (enPassantCapture) {
      board[fromRow][toCol] = ""; // Remove the captured pawn
    }

    // Check if own king is in check
    const inCheck = isKingInCheck(color);

    // Undo the move
    board[fromRow][fromCol] = originalFromPiece;
    board[toRow][toCol] = originalToPiece;
    if (enPassantCapture) {
      board[fromRow][toCol] = capturedEnPassantPiece;
    }

    if (inCheck) {
      return false;
    } else {
      return true;
    }
  }

  return false;
}

function canCastle(color, fromRow, fromCol, toRow, toCol) {
  // Determine which side the king is castling to
  let kingSide = toCol > fromCol;
  let rookCol = kingSide ? 7 : 0;
  let rookKey = color + (rookCol === 0 ? '0' : '1');

  if (kingMoved[color] || rookMoved[rookKey]) {
    return false;
  }

  // Check if squares between king and rook are empty
  let colStep = kingSide ? 1 : -1;
  for (let col = fromCol + colStep; col !== rookCol; col += colStep) {
    if (board[fromRow][col] !== '') {
      return false;
    }
  }

  // Check that the king is not in check, and does not pass through or end in check
  let tempFromCol = fromCol;
  for (let i = 0; i <= 2; i++) {
    tempFromCol += colStep;
    if (i > 0) { // We already know the king is not in check at fromCol
      // Temporarily move the king
      let originalPiece = board[fromRow][tempFromCol];
      board[fromRow][tempFromCol] = color + 'K';
      board[fromRow][fromCol] = '';

      if (isKingInCheck(color)) {
        // Undo the move
        board[fromRow][fromCol] = color + 'K';
        board[fromRow][tempFromCol] = originalPiece;
        return false;
      }

      // Undo the move
      board[fromRow][fromCol] = color + 'K';
      board[fromRow][tempFromCol] = originalPiece;
    }
    if (tempFromCol === toCol) break;
  }

  return true;
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
  const rowStep = toRow - fromRow === 0 ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
  const colStep = toCol - fromCol === 0 ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);

  let currentRow = fromRow + rowStep;
  let currentCol = fromCol + colStep;

  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow][currentCol] !== "") {
      return false;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  return true;
}

function isSquareAttacked(row, col, byColor) {
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece[0] === byColor) {
        if (isValidMoveForAttack(piece, fromRow, fromCol, row, col)) {
          return true;
        }
      }
    }
  }
  return false;
}

function isValidMoveForAttack(piece, fromRow, fromCol, toRow, toCol) {
  const pieceType = piece[1];
  const color = piece[0];
  const dir = color === 'w' ? -1 : 1; // Direction for pawns

  switch (pieceType) {
    case 'P':
      // Pawn attack move (diagonal capture)
      if (Math.abs(fromCol - toCol) === 1 && toRow - fromRow === dir) {
        return true;
      }
      break;
    case 'R':
      // Rook move
      if (fromRow === toRow || fromCol === toCol) {
        if (isPathClear(fromRow, fromCol, toRow, toCol)) {
          return true;
        }
      }
      break;
    case 'N':
      // Knight move
      if ((Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 1) ||
          (Math.abs(fromRow - toRow) === 1 && Math.abs(fromCol - toCol) === 2)) {
        return true;
      }
      break;
    case 'B':
      // Bishop move
      if (Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
        if (isPathClear(fromRow, fromCol, toRow, toCol)) {
          return true;
        }
      }
      break;
    case 'Q':
      // Queen move (rook + bishop)
      if ((fromRow === toRow || fromCol === toCol ||
           Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) &&
          isPathClear(fromRow, fromCol, toRow, toCol)) {
        return true;
      }
      break;
    case 'K':
      // King move
      if (Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1) {
        return true;
      }
      break;
  }

  return false;
}

function isKingInCheck(color) {
  let kingRow, kingCol;

  // Find the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece === color + 'K') {
        kingRow = row;
        kingCol = col;
        break;
      }
    }
  }

  if (kingRow === undefined) {
    // King not found (should not happen in normal play)
    return true;
  }

  const opponentColor = color === 'w' ? 'b' : 'w';

  // Check if any opponent piece can attack the king
  return isSquareAttacked(kingRow, kingCol, opponentColor);
}

// New function to evaluate the board
function evaluateBoard() {
  let score = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const color = piece[0];
        const pieceType = piece[1];
        const value = pieceValues[pieceType];
        if (color === aiColor) {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  return score;
}

// Function to generate all possible moves for a given color
function generateAllMoves(color) {
  const moves = [];
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece[0] === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            let castling = false;
            let enPassantCapture = false;
            if (isValidMove(piece, fromRow, fromCol, toRow, toCol, castling, enPassantCapture)) {
              moves.push({
                piece: piece,
                fromRow: fromRow,
                fromCol: fromCol,
                toRow: toRow,
                toCol: toCol,
                castling: castling,
                enPassantCapture: enPassantCapture
              });
            }
          }
        }
      }
    }
  }
  return moves;
}

// Function to make a temporary move
function makeTemporaryMove(move) {
  move.capturedPiece = board[move.toRow][move.toCol];
  board[move.toRow][move.toCol] = move.piece;
  board[move.fromRow][move.fromCol] = "";

  // Handle special moves if needed (e.g., en passant, castling)
}

// Function to undo a temporary move
function undoTemporaryMove(move) {
  board[move.fromRow][move.fromCol] = move.piece;
  board[move.toRow][move.toCol] = move.capturedPiece;

  // Handle special moves if needed (e.g., en passant, castling)
}

// Updated AI move function with minimax algorithm
function makeAIMove() {
  // AI depth for minimax
  //  depth 3, the algorithm evaluates approximately 27.000 positions
  //  depth 4, the algorithm evaluates approximately 810.000 positions
  //  depth 5, the algorithm evaluates approximately 24.000.000 positions
  
  const depth = 3;

  const bestMove = minimaxRoot(depth, aiColor);
  if (!bestMove) {
    document.getElementById('message').innerText = 'AI has no valid moves. Game over.';
    gameOver = true;
    return;
  }

  // Move the piece
  const move = bestMove;
  board[move.toRow][move.toCol] = move.piece;
  board[move.fromRow][move.fromCol] = "";

  // Check for pawn promotion
  if (move.piece[1] === 'P' && (move.toRow === 0 || move.toRow === 7)) {
    // Promote pawn to queen
    board[move.toRow][move.toCol] = move.piece[0] + 'Q';
  }

  drawBoard();

  // Switch turn back to human
  turn = turn === 'w' ? 'b' : 'w';

  // Check if the game should continue
  if (isGameOver()) {
    let message = isKingInCheck(turn) ? 'Checkmate! ' : 'Stalemate! ';
    message += turn === aiColor ? 'You win!' : 'You lost!';
    document.getElementById('message').innerText = message;
    gameOver = true;
  } else {
    if (turn === aiColor) {
      setTimeout(makeAIMove, 500); // Continue AI moves if applicable
    }
  }
}

function minimaxRoot(depth, color) {
  const moves = generateAllMoves(color);
  let bestMove = null;
  let bestValue = -Infinity;

  for (let move of moves) {
    makeTemporaryMove(move);
    let value = minimax(depth - 1, false, -Infinity, Infinity);
    undoTemporaryMove(move);
    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(depth, isMaximizingPlayer, alpha, beta) {
  if (depth === 0 || isGameOver()) {
    return evaluateBoard();
  }

  const color = isMaximizingPlayer ? aiColor : opponentColor;
  const moves = generateAllMoves(color);

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (let move of moves) {
      makeTemporaryMove(move);
      let eval = minimax(depth - 1, false, alpha, beta);
      undoTemporaryMove(move);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      makeTemporaryMove(move);
      let eval = minimax(depth - 1, true, alpha, beta);
      undoTemporaryMove(move);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) {
        break;
      }
    }
    return minEval;
  }
}

// Function to check if the game is over (checkmate or stalemate)
function isGameOver() {
  // Check if current player has any valid moves
  const moves = generateAllMoves(turn);
  if (moves.length > 0) {
    return false;
  }
  return true; // No valid moves, game is over
}

// If AI is black and it's black's turn, make AI's move
if (turn === aiColor) {
  setTimeout(makeAIMove, 500);
}