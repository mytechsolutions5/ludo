/**
 * Ludo Game Engine
 * Implements standard international Ludo rules, 15x15 coordinate tracking,
 * path calculation, capture mechanics, safe zones, and AI heuristics.
 */

// 52 Common Track Coordinates [row, col] on a 15x15 board
const COMMON_TRACK = [
  [6, 0],  // 0
  [6, 1],  // 1  (RED START - Safe)
  [6, 2],  // 2
  [6, 3],  // 3
  [6, 4],  // 4
  [6, 5],  // 5
  [5, 6],  // 6
  [4, 6],  // 7
  [3, 6],  // 8
  [2, 6],  // 9  (SAFE STAR)
  [1, 6],  // 10
  [0, 6],  // 11
  [0, 7],  // 12
  [0, 8],  // 13
  [1, 8],  // 14 (GREEN START - Safe)
  [2, 8],  // 15
  [3, 8],  // 16
  [4, 8],  // 17
  [5, 8],  // 18
  [6, 9],  // 19
  [6, 10], // 20
  [6, 11], // 21
  [6, 12], // 22 (SAFE STAR)
  [6, 13], // 23
  [6, 14], // 24
  [7, 14], // 25
  [8, 14], // 26
  [8, 13], // 27 (YELLOW START - Safe)
  [8, 12], // 28
  [8, 11], // 29
  [8, 10], // 30
  [8, 9],  // 31
  [9, 8],  // 32
  [10, 8], // 33
  [11, 8], // 34
  [12, 8], // 35 (SAFE STAR)
  [13, 8], // 36
  [14, 8], // 37
  [14, 7], // 38
  [14, 6], // 39
  [13, 6], // 40 (BLUE START - Safe)
  [12, 6], // 41
  [11, 6], // 42
  [10, 6], // 43
  [9, 6],  // 44
  [8, 5],  // 45
  [8, 4],  // 46
  [8, 3],  // 47
  [8, 2],  // 48 (SAFE STAR)
  [8, 1],  // 49
  [8, 0],  // 50
  [7, 0]   // 51
];

// 8 Universal Safe Track Indices
const SAFE_TRACK_INDICES = [1, 9, 14, 22, 27, 35, 40, 48];

// Color configurations & Home stretches
const COLOR_CONFIG = {
  red: {
    id: 'red',
    name: 'Red',
    startIndex: 1,
    turnInIndex: 51,
    homeStretch: [
      [7, 1], [7, 2], [7, 3], [7, 4], [7, 5]
    ],
    homeCenter: [7, 6],
    yardSlots: [
      [2, 2], [2, 3], [3, 2], [3, 3]
    ],
    themeColor: '#ef4444',
    bgLight: '#fee2e2'
  },
  green: {
    id: 'green',
    name: 'Green',
    startIndex: 14,
    turnInIndex: 12,
    homeStretch: [
      [1, 7], [2, 7], [3, 7], [4, 7], [5, 7]
    ],
    homeCenter: [6, 7],
    yardSlots: [
      [2, 11], [2, 12], [3, 11], [3, 12]
    ],
    themeColor: '#10b981',
    bgLight: '#d1fae5'
  },
  yellow: {
    id: 'yellow',
    name: 'Yellow',
    startIndex: 27,
    turnInIndex: 25,
    homeStretch: [
      [7, 13], [7, 12], [7, 11], [7, 10], [7, 9]
    ],
    homeCenter: [7, 8],
    yardSlots: [
      [11, 11], [11, 12], [12, 11], [12, 12]
    ],
    themeColor: '#eab308',
    bgLight: '#fef9c3'
  },
  blue: {
    id: 'blue',
    name: 'Blue',
    startIndex: 40,
    turnInIndex: 38,
    homeStretch: [
      [13, 7], [12, 7], [11, 7], [10, 7], [9, 7]
    ],
    homeCenter: [8, 7],
    yardSlots: [
      [11, 2], [11, 3], [12, 2], [12, 3]
    ],
    themeColor: '#3b82f6',
    bgLight: '#dbeafe'
  }
};

/**
 * Precomputes the 57-step trajectory array for a player color.
 * Step -1: Yard
 * Step 0..50: Common track (51 steps)
 * Step 51..55: Home stretch (5 steps)
 * Step 56: Home center goal!
 */
function buildPathForColor(colorKey) {
  const cfg = COLOR_CONFIG[colorKey];
  const path = [];
  // 51 common steps
  for (let i = 0; i < 51; i++) {
    const trackIdx = (cfg.startIndex + i) % 52;
    path.push({
      step: i,
      trackIndex: trackIdx,
      coord: COMMON_TRACK[trackIdx],
      isSafe: SAFE_TRACK_INDICES.includes(trackIdx)
    });
  }
  // 5 home stretch steps
  for (let i = 0; i < 5; i++) {
    path.push({
      step: 51 + i,
      trackIndex: -1,
      coord: cfg.homeStretch[i],
      isSafe: true
    });
  }
  // Step 56: Home center
  path.push({
    step: 56,
    trackIndex: -1,
    coord: cfg.homeCenter,
    isSafe: true,
    isHome: true
  });
  return path;
}

const PLAYER_PATHS = {
  red: buildPathForColor('red'),
  green: buildPathForColor('green'),
  yellow: buildPathForColor('yellow'),
  blue: buildPathForColor('blue')
};

class LudoEngine {
  constructor(options = {}) {
    this.playerCount = options.playerCount || 4; // 2, 3, or 4
    this.mode = options.mode || 'vs_bot'; // 'vs_bot', 'pass_n_play', 'all_bots'
    this.players = [];
    this.activePlayerIndex = 0;
    this.currentDiceRoll = null;
    this.consecutiveSixes = 0;
    this.turnState = 'WAITING_ROLL'; // 'WAITING_ROLL', 'WAITING_MOVE', 'GAME_OVER'
    this.winners = [];
    this.stats = {
      totalRolls: 0,
      totalCaptures: 0,
      sixesRolled: 0,
      startTime: Date.now()
    };
    this.initPlayers(options);
  }

  initPlayers(options = {}) {
    // Determine player color assignment
    // 2 players: Red vs Yellow (opposite) or Red vs Green
    let activeColors = ['red', 'green', 'yellow', 'blue'];
    if (this.playerCount === 2) {
      activeColors = ['red', 'yellow']; // Classical opposite diagonal
    } else if (this.playerCount === 3) {
      activeColors = ['red', 'green', 'yellow'];
    }

    this.players = activeColors.map((colorKey, index) => {
      const cfg = COLOR_CONFIG[colorKey];
      let isAI = false;
      if (this.mode === 'vs_bot') {
        isAI = index > 0; // Player 1 is human, others are AI bots
      } else if (this.mode === 'all_bots') {
        isAI = true;
      }

      const defaultNames = {
        red: 'Red Chief',
        green: 'Green Star',
        yellow: 'Yellow Champ',
        blue: 'Blue Knight'
      };

      return {
        id: colorKey,
        name: (options.names && options.names[colorKey]) || defaultNames[colorKey],
        color: colorKey,
        isAI: isAI,
        avatar: options.avatars ? options.avatars[colorKey] : (isAI ? '🤖' : '👑'),
        tokens: [
          { id: 0, step: -1, finished: false },
          { id: 1, step: -1, finished: false },
          { id: 2, step: -1, finished: false },
          { id: 3, step: -1, finished: false }
        ],
        hasFinished: false,
        rank: null
      };
    });

    this.activePlayerIndex = 0;
    this.turnState = 'WAITING_ROLL';
    this.currentDiceRoll = null;
    this.consecutiveSixes = 0;
  }

  getActivePlayer() {
    return this.players[this.activePlayerIndex];
  }

  /**
   * Translates a token's step into [row, col] on the 15x15 board.
   */
  getTokenCoordinate(playerColor, tokenId) {
    const player = this.players.find(p => p.color === playerColor);
    if (!player) return null;
    const token = player.tokens[tokenId];
    if (token.step === -1) {
      return COLOR_CONFIG[playerColor].yardSlots[tokenId];
    }
    const path = PLAYER_PATHS[playerColor];
    if (token.step >= 0 && token.step < path.length) {
      return path[token.step].coord;
    }
    return COLOR_CONFIG[playerColor].homeCenter;
  }

  /**
   * Executes a dice roll.
   * Returns: { roll, consecutiveSixes, forfeited, validMoves }
   */
  rollDice(overrideValue) {
    if (this.turnState !== 'WAITING_ROLL') {
      return null;
    }

    const roll = overrideValue || Math.floor(Math.random() * 6) + 1;
    this.currentDiceRoll = roll;
    this.stats.totalRolls++;

    if (roll === 6) {
      this.consecutiveSixes++;
      this.stats.sixesRolled++;
    } else {
      this.consecutiveSixes = 0;
    }

    // Three consecutive 6s rule: forfeits turn!
    if (this.consecutiveSixes >= 3) {
      this.turnState = 'WAITING_ROLL';
      this.consecutiveSixes = 0;
      const res = {
        roll,
        consecutiveSixes: 3,
        forfeited: true,
        validMoves: []
      };
      this.nextTurn();
      return res;
    }

    const validMoves = this.getValidMoves(this.getActivePlayer(), roll);
    if (validMoves.length === 0) {
      this.turnState = 'WAITING_ROLL';
      return {
        roll,
        consecutiveSixes: this.consecutiveSixes,
        forfeited: false,
        validMoves: []
      };
    }

    this.turnState = 'WAITING_MOVE';
    return {
      roll,
      consecutiveSixes: this.consecutiveSixes,
      forfeited: false,
      validMoves
    };
  }

  /**
   * Finds all tokens for a player that can legally move given the roll.
   */
  getValidMoves(player, roll) {
    if (player.hasFinished) return [];
    const validMoves = [];

    player.tokens.forEach(token => {
      if (token.finished) return;

      // In yard: requires 6 to come out to step 0
      if (token.step === -1) {
        if (roll === 6) {
          validMoves.push({
            tokenId: token.id,
            fromStep: -1,
            toStep: 0,
            isRelease: true,
            isHome: false,
            canCapture: this.checkCaptureAt(player.color, 0)
          });
        }
      } else {
        const nextStep = token.step + roll;
        // Exact count required to reach 56 (Home)
        if (nextStep <= 56) {
          validMoves.push({
            tokenId: token.id,
            fromStep: token.step,
            toStep: nextStep,
            isRelease: false,
            isHome: nextStep === 56,
            canCapture: nextStep < 51 ? this.checkCaptureAt(player.color, nextStep) : null
          });
        }
      }
    });

    return validMoves;
  }

  /**
   * Checks if landing on step `targetStep` captures any opponent's token.
   */
  checkCaptureAt(playerColor, targetStep) {
    if (targetStep >= 51) return null; // Safe in home stretch
    const targetPath = PLAYER_PATHS[playerColor][targetStep];
    if (targetPath.isSafe) return null; // Safe star or start cell

    const [row, col] = targetPath.coord;

    for (const opponent of this.players) {
      if (opponent.color === playerColor || opponent.hasFinished) continue;
      for (const oppToken of opponent.tokens) {
        if (oppToken.step >= 0 && oppToken.step < 51) {
          const oppPath = PLAYER_PATHS[opponent.color][oppToken.step];
          if (oppPath.coord[0] === row && oppPath.coord[1] === col) {
            return {
              opponentColor: opponent.color,
              opponentTokenId: oppToken.id
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Executes a chosen move for the active player.
   * Returns: { success, captured, reachedHome, bonusTurn, gameOver, winners }
   */
  moveToken(tokenId) {
    if (this.turnState !== 'WAITING_MOVE') {
      return { success: false, reason: 'Not waiting for move' };
    }

    const activePlayer = this.getActivePlayer();
    const token = activePlayer.tokens[tokenId];
    const roll = this.currentDiceRoll;
    const validMoves = this.getValidMoves(activePlayer, roll);
    const chosenMove = validMoves.find(m => m.tokenId === tokenId);

    if (!chosenMove) {
      return { success: false, reason: 'Invalid move for this token' };
    }

    const fromStep = token.step;
    const toStep = chosenMove.toStep;
    token.step = toStep;

    let reachedHome = false;
    let captured = null;
    let bonusTurn = false;

    // Check if reached home
    if (toStep === 56) {
      token.finished = true;
      reachedHome = true;
      bonusTurn = true; // Bonus roll for getting piece home!
    }

    // Check capture on common track
    if (toStep >= 0 && toStep < 51) {
      captured = this.checkCaptureAt(activePlayer.color, toStep);
      if (captured) {
        const victimPlayer = this.players.find(p => p.color === captured.opponentColor);
        const victimToken = victimPlayer.tokens[captured.opponentTokenId];
        victimToken.step = -1; // Send back to yard
        this.stats.totalCaptures++;
        bonusTurn = true; // Bonus roll for capture!
      }
    }

    // Rolling a 6 also gives a bonus turn
    if (roll === 6 && this.consecutiveSixes < 3) {
      bonusTurn = true;
    }

    // Check if this player finished all 4 tokens
    const allFinished = activePlayer.tokens.every(t => t.finished);
    if (allFinished && !activePlayer.hasFinished) {
      activePlayer.hasFinished = true;
      this.winners.push({
        rank: this.winners.length + 1,
        player: activePlayer
      });
      activePlayer.rank = this.winners.length;
    }

    // Check game over
    // Game is over if all human players finished, or only 1 player remains unfinished
    const unfinishedCount = this.players.filter(p => !p.hasFinished).length;
    const gameOver = unfinishedCount <= 1 || (this.mode === 'vs_bot' && this.players[0].hasFinished);

    if (gameOver) {
      this.turnState = 'GAME_OVER';
      // Fill remaining ranks
      this.players.filter(p => !p.hasFinished).forEach(p => {
        this.winners.push({ rank: this.winners.length + 1, player: p });
      });
      return {
        success: true,
        fromStep,
        toStep,
        captured,
        reachedHome,
        bonusTurn: false,
        gameOver: true,
        winners: this.winners
      };
    }

    // Setup next state
    if (bonusTurn && !activePlayer.hasFinished) {
      this.turnState = 'WAITING_ROLL';
      this.currentDiceRoll = null;
    } else {
      this.nextTurn();
    }

    return {
      success: true,
      fromStep,
      toStep,
      captured,
      reachedHome,
      bonusTurn,
      gameOver: false,
      winners: this.winners
    };
  }

  /**
   * Advances turn to the next active player who hasn't finished yet.
   */
  nextTurn() {
    this.consecutiveSixes = 0;
    this.currentDiceRoll = null;
    this.turnState = 'WAITING_ROLL';

    if (this.players.every(p => p.hasFinished)) {
      this.turnState = 'GAME_OVER';
      return;
    }

    let nextIdx = (this.activePlayerIndex + 1) % this.players.length;
    let loops = 0;
    while (this.players[nextIdx].hasFinished && loops < this.players.length) {
      nextIdx = (nextIdx + 1) % this.players.length;
      loops++;
    }

    this.activePlayerIndex = nextIdx;
  }

  /**
   * AI Decision Engine: Evaluates candidate moves and selects the optimal one.
   */
  getBestAIMove(validMoves) {
    if (!validMoves || validMoves.length === 0) return null;
    if (validMoves.length === 1) return validMoves[0];

    const activePlayer = this.getActivePlayer();

    const scoredMoves = validMoves.map(move => {
      let score = 0;

      // 1. Can capture an opponent? Massive priority (+1000)
      if (move.canCapture) {
        score += 1000;
      }

      // 2. Can enter home (step 56)? Very high priority (+800)
      if (move.isHome) {
        score += 800;
      }

      // 3. Releasing from yard on 6? (+450)
      if (move.isRelease) {
        score += 450;
        // If other tokens are already out and moving fine, slightly lower
        const tokensOut = activePlayer.tokens.filter(t => t.step >= 0 && !t.finished).length;
        if (tokensOut >= 2) score -= 100;
      }

      // 4. Entering safe spot (star or start)? (+300)
      if (move.toStep < 51) {
        const pathObj = PLAYER_PATHS[activePlayer.color][move.toStep];
        if (pathObj.isSafe) {
          score += 300;
        }
      } else if (move.toStep >= 51 && move.fromStep < 51) {
        // Entering home stretch (immune to captures)
        score += 350;
      }

      // 5. Escaping danger: Was current square under threat from opponent within 1-6 squares behind?
      if (move.fromStep >= 0 && move.fromStep < 51) {
        const isThreatened = this.isSquareThreatened(activePlayer.color, move.fromStep);
        if (isThreatened) {
          score += 260;
        }
      }

      // 6. Risk assessment: Does toStep land on an unsafe square with threat behind?
      if (move.toStep < 51) {
        const willBeThreatened = this.isSquareThreatened(activePlayer.color, move.toStep);
        if (willBeThreatened) {
          score -= 150;
        }
      }

      // 7. General forward progress (+10 per step advanced)
      score += move.toStep * 10;

      return { move, score };
    });

    // Sort descending by score
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  /**
   * Helper to evaluate if any opponent can hit a given step index within a 1..6 roll.
   */
  isSquareThreatened(playerColor, stepIdx) {
    if (stepIdx >= 51) return false;
    const targetCoord = PLAYER_PATHS[playerColor][stepIdx].coord;

    for (const opp of this.players) {
      if (opp.color === playerColor || opp.hasFinished) continue;
      for (const oppToken of opp.tokens) {
        if (oppToken.step >= 0 && oppToken.step < 51) {
          for (let roll = 1; roll <= 6; roll++) {
            const potentialStep = oppToken.step + roll;
            if (potentialStep < 51) {
              const checkCoord = PLAYER_PATHS[opp.color][potentialStep].coord;
              if (checkCoord[0] === targetCoord[0] && checkCoord[1] === targetCoord[1]) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }
}

window.LudoEngine = LudoEngine;
window.COMMON_TRACK = COMMON_TRACK;
window.SAFE_TRACK_INDICES = SAFE_TRACK_INDICES;
window.COLOR_CONFIG = COLOR_CONFIG;
window.PLAYER_PATHS = PLAYER_PATHS;
