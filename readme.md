# Chess Game

Simple Chess game 

Minimax algorithm with alpha-beta pruning

- Minimax Algorithm: The AI uses the minimax algorithm to simulate possible moves up to a certain depth (in your code, the depth is set to 4). The algorithm assumes that both players play optimally and tries to minimize the possible loss in a worst-case scenario.

- Alpha-Beta Pruning: To optimize the minimax algorithm, alpha-beta pruning is implemented. This technique reduces the number of nodes evaluated in the game tree by pruning branches that won't affect the final decision, thus improving efficiency.

- Evaluation Function: The AI evaluates board positions using a simple evaluation function that sums up the material value of the pieces. Each piece is assigned a value (e.g., Pawn=1, Knight=3, Bishop=3, Rook=5, Queen=9, King=1000), and the function calculates the difference between the AI's and the opponent's total piece values.

- Move Generation: The AI generates all possible moves for the current board state using the generateAllMoves function. It then recursively evaluates these moves using the minimax algorithm to choose the best one.

- Move Execution: After determining the best move, the AI executes it, updating the board state and redrawing the board.




# Difficult Setting

change  **const depth = 3** for to have more fun

depth 3, the algorithm evaluates approximately 27.000 positions - Game Fast

depth 4, the algorithm evaluates approximately 810.000 positions - Game gets a bit slower

depth 5, the algorithm evaluates approximately 24.000.000 positions - Game gets really slow
