/**
 * Main Application Controller for Ludo Mobile
 * Coordinates game engine, SVG board renderer, 3D dice, audio, modals,
 * AI automation, and mobile touch interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  let engine = null;
  let boardRenderer = null;
  let diceController = null;
  let currentValidMoves = [];
  let isProcessingMove = false;
  let fastAnimation = false;

  // Cache UI elements
  const boardContainer = document.getElementById('board-container');
  const diceContainer = document.getElementById('dice-container');
  const turnBanner = document.getElementById('turn-banner');
  const turnIndicatorText = document.getElementById('turn-indicator-text');
  const messageToast = document.getElementById('message-toast');
  const playersBarTop = document.getElementById('players-bar-top');
  const playersBarBottom = document.getElementById('players-bar-bottom');

  // Modals
  const newGameModal = document.getElementById('new-game-modal');
  const rulesModal = document.getElementById('rules-modal');
  const qrModal = document.getElementById('qr-modal');
  const settingsModal = document.getElementById('settings-modal');
  const victoryModal = document.getElementById('victory-modal');

  // Control Buttons
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const rulesBtn = document.getElementById('rules-btn');
  const qrBtn = document.getElementById('qr-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const newGameBtn = document.getElementById('new-game-btn');
  const installAppBtn = document.getElementById('install-app-btn');

  // PWA deferred prompt
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installAppBtn) {
      installAppBtn.style.display = 'inline-flex';
    }
  });

  if (installAppBtn) {
    installAppBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          installAppBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      }
    });
  }

  // Initialize Audio & Haptics toggle
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      const isEnabled = window.soundEngine.toggleSound();
      soundToggleBtn.innerHTML = isEnabled ? '🔊' : '🔇';
      soundToggleBtn.classList.toggle('muted', !isEnabled);
    });
  }

  // Show Toast Message
  function showToast(text, duration = 1800, type = 'info') {
    if (!messageToast) return;
    messageToast.textContent = text;
    messageToast.className = `message-toast show ${type}`;
    clearTimeout(messageToast._timer);
    messageToast._timer = setTimeout(() => {
      messageToast.className = 'message-toast';
    }, duration);
  }

  // Setup Modals
  function initModals() {
    rulesBtn.addEventListener('click', () => {
      window.soundEngine.playClick();
      rulesModal.classList.add('active');
    });

    settingsBtn.addEventListener('click', () => {
      window.soundEngine.playClick();
      settingsModal.classList.add('active');
    });

    newGameBtn.addEventListener('click', () => {
      window.soundEngine.playClick();
      newGameModal.classList.add('active');
    });

    // QR Code modal elements
    const qrContainer = document.getElementById('qr-code-container');
    const qrLinkInput = document.getElementById('qr-link-input');
    const qrCopyBtn = document.getElementById('qr-copy-btn');
    const qrDownloadBtn = document.getElementById('qr-download-btn');
    const qrNativeShareBtn = document.getElementById('qr-native-share-btn');

    const shareUrl = (window.location.origin && window.location.origin.includes('workers.dev'))
      ? window.location.href.split('?')[0].split('#')[0]
      : 'https://ludo-mobile.arpitkanotra.workers.dev';

    if (qrLinkInput) {
      qrLinkInput.value = shareUrl;
    }

    // Function to ensure QR Code SVG is generated & rendered
    function ensureQRCode() {
      if (!qrContainer) return;
      if (!qrContainer.querySelector('svg')) {
        if (window.QRCode && window.QRCode.generateSVG) {
          try {
            qrContainer.innerHTML = window.QRCode.generateSVG(shareUrl, {
              size: 240,
              margin: 3,
              colorDark: '#090d16',
              colorLight: '#ffffff'
            });
          } catch (err) {
            console.error('QR code generation failed:', err);
          }
        }
      }
    }

    // Pre-render QR on load
    ensureQRCode();

    // Function to download the QR code as a high-resolution PNG
    function downloadQRCode(size = 600) {
      const qrSvg = qrContainer ? qrContainer.querySelector('svg') : null;
      if (!qrSvg) {
        showToast('QR Code not ready', 1500, 'warning');
        return;
      }
      try {
        const svgString = new XMLSerializer().serializeToString(qrSvg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const blobUrl = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          URL.revokeObjectURL(blobUrl);

          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              showToast('Download failed', 1500, 'warning');
              return;
            }
            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.download = 'ludo-mobile-qr.png';
            a.href = pngUrl;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
            showToast('✅ QR Code downloaded!', 2000, 'success');
          }, 'image/png');
        };
        img.onerror = () => {
          showToast('Failed to render QR for download', 2000, 'warning');
        };
        img.src = blobUrl;
      } catch (err) {
        console.error('Download error:', err);
        showToast('Download failed', 2000, 'warning');
      }
    }

    if (qrBtn && qrModal) {
      qrBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        ensureQRCode();
        qrModal.classList.add('active');
      });
    }

    if (qrDownloadBtn) {
      qrDownloadBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        downloadQRCode(600);
      });
    }

    if (qrCopyBtn && qrLinkInput) {
      qrCopyBtn.addEventListener('click', async () => {
        window.soundEngine.playClick();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
          } else {
            qrLinkInput.select();
            document.execCommand('copy');
          }
          qrCopyBtn.textContent = '✅ Copied!';
          showToast('Link copied to clipboard!', 2000, 'success');
          setTimeout(() => {
            qrCopyBtn.textContent = '📋 Copy';
          }, 2000);
        } catch (err) {
          qrLinkInput.select();
          document.execCommand('copy');
          qrCopyBtn.textContent = '✅ Copied!';
          showToast('Link copied to clipboard!', 2000, 'success');
          setTimeout(() => {
            qrCopyBtn.textContent = '📋 Copy';
          }, 2000);
        }
      });
    }

    if (qrNativeShareBtn && navigator.share) {
      qrNativeShareBtn.style.display = 'flex';
      qrNativeShareBtn.addEventListener('click', async () => {
        window.soundEngine.playClick();
        try {
          await navigator.share({
            title: 'Ludo Mobile Ultimate',
            text: 'Play Ludo board game with me on mobile!',
            url: shareUrl
          });
        } catch (e) {}
      });
    }

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundEngine.playClick();
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Start Game from Modal
    const startGameFormBtn = document.getElementById('start-game-btn');
    if (startGameFormBtn) {
      startGameFormBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        const playerCount = parseInt(document.querySelector('input[name="player-count"]:checked').value, 10);
        const gameMode = document.querySelector('input[name="game-mode"]:checked').value;
        startNewGame({ playerCount, mode: gameMode });
        newGameModal.classList.remove('active');
      });
    }

    // Play Again button
    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        victoryModal.classList.remove('active');
        newGameModal.classList.add('active');
      });
    }

    // Settings checkboxes
    const soundCheck = document.getElementById('setting-sound');
    if (soundCheck) {
      soundCheck.addEventListener('change', (e) => {
        window.soundEngine.toggleSound(e.target.checked);
        soundToggleBtn.innerHTML = e.target.checked ? '🔊' : '🔇';
      });
    }

    const hapticsCheck = document.getElementById('setting-haptics');
    if (hapticsCheck) {
      hapticsCheck.addEventListener('change', (e) => {
        window.soundEngine.toggleHaptics(e.target.checked);
      });
    }

    const fastAnimCheck = document.getElementById('setting-fast-anim');
    if (fastAnimCheck) {
      fastAnimCheck.addEventListener('change', (e) => {
        fastAnimation = e.target.checked;
      });
    }
  }

  // Start / Restart Game
  function startNewGame(options = {}) {
    isProcessingMove = false;
    currentValidMoves = [];

    engine = new LudoEngine(options);

    // Initialize board renderer
    if (!boardRenderer) {
      boardRenderer = new BoardRenderer(boardContainer, (color, tokenId) => {
        handleUserTokenClick(color, tokenId);
      });
    }

    // Initialize dice controller
    if (!diceController) {
      diceController = new DiceController(diceContainer, () => {
        handleDiceRollTrigger();
      });
    }

    renderPlayerCards();
    updateUIForTurn();
    boardRenderer.renderTokens(engine, []);
    showToast(`Game Started! ${engine.getActivePlayer().name}'s turn`, 2000, 'success');

    // If first player is AI, trigger turn
    if (engine.getActivePlayer().isAI) {
      setTimeout(() => processAITurn(), 800);
    }
  }

  // Render top and bottom player status cards
  function renderPlayerCards() {
    playersBarTop.innerHTML = '';
    playersBarBottom.innerHTML = '';

    const activePlayer = engine.getActivePlayer();

    engine.players.forEach(p => {
      const card = document.createElement('div');
      card.className = `player-card card-${p.color} ${p.color === activePlayer.color ? 'active' : ''} ${p.hasFinished ? 'finished' : ''}`;
      card.id = `player-card-${p.color}`;

      const homeCount = p.tokens.filter(t => t.finished).length;

      card.innerHTML = `
        <div class="card-avatar">${p.avatar}</div>
        <div class="card-info">
          <div class="card-name">${p.name}</div>
          <div class="card-progress">
            <span class="tokens-home-badge">🎯 ${homeCount}/4</span>
            ${p.rank ? `<span class="rank-badge">🏆 #${p.rank}</span>` : ''}
          </div>
        </div>
      `;

      // Top bar gets Red & Blue; Bottom bar gets Green & Yellow
      if (p.color === 'red' || p.color === 'blue') {
        playersBarTop.appendChild(card);
      } else {
        playersBarBottom.appendChild(card);
      }
    });
  }

  // Refresh active states and banners
  function updateUIForTurn() {
    const activePlayer = engine.getActivePlayer();

    // Update player cards
    document.querySelectorAll('.player-card').forEach(card => {
      card.classList.remove('active');
    });
    const activeCard = document.getElementById(`player-card-${activePlayer.color}`);
    if (activeCard) {
      activeCard.classList.add('active');
    }

    // Update banner
    turnBanner.style.borderColor = COLOR_CONFIG[activePlayer.color].themeColor;
    turnIndicatorText.innerHTML = `
      <span class="color-dot" style="background:${COLOR_CONFIG[activePlayer.color].themeColor}"></span>
      <strong>${activePlayer.name}</strong>'s Turn
    `;

    // Update dice button
    if (activePlayer.isAI) {
      diceController.setEnabled(false, activePlayer.color);
    } else {
      diceController.setEnabled(true, activePlayer.color);
    }
  }

  // User taps the dice / roll button
  async function handleDiceRollTrigger() {
    if (isProcessingMove) return;
    const activePlayer = engine.getActivePlayer();
    if (activePlayer.isAI) return;

    isProcessingMove = true;
    diceController.setEnabled(false, activePlayer.color);

    const rollResult = engine.rollDice();
    if (!rollResult) {
      isProcessingMove = false;
      return;
    }

    await diceController.roll(rollResult.roll, activePlayer.color);

    // Three consecutive sixes penalty
    if (rollResult.forfeited) {
      showToast('⚠️ 3 Sixes in a row! Turn forfeited!', 2200, 'warning');
      setTimeout(() => {
        isProcessingMove = false;
        renderPlayerCards();
        updateUIForTurn();
        boardRenderer.renderTokens(engine, []);
        if (engine.getActivePlayer().isAI) {
          processAITurn();
        }
      }, 1200);
      return;
    }

    currentValidMoves = rollResult.validMoves;

    // No valid moves
    if (currentValidMoves.length === 0) {
      boardRenderer.renderTokens(engine, []);
      showToast(`Rolled ${rollResult.roll} - No moves possible!`, 1600, 'info');
      setTimeout(() => {
        engine.nextTurn();
        isProcessingMove = false;
        renderPlayerCards();
        updateUIForTurn();
        boardRenderer.renderTokens(engine, []);
        if (engine.getActivePlayer().isAI) {
          processAITurn();
        }
      }, 1100);
      return;
    }

    // Auto-move if exactly 1 move is possible
    if (currentValidMoves.length === 1) {
      boardRenderer.renderTokens(engine, currentValidMoves);
      setTimeout(() => {
        executeMove(currentValidMoves[0].tokenId);
      }, 350);
      return;
    }

    // Multiple valid moves: highlight tokens and let player pick
    boardRenderer.renderTokens(engine, currentValidMoves);
    showToast(`Rolled ${rollResult.roll}! Tap a glowing token to move`, 2000, 'success');
    isProcessingMove = false;
  }

  // User taps a playable token
  function handleUserTokenClick(color, tokenId) {
    if (isProcessingMove) return;
    const activePlayer = engine.getActivePlayer();
    if (activePlayer.isAI || activePlayer.color !== color) return;

    const move = currentValidMoves.find(m => m.tokenId === tokenId);
    if (!move) return;

    isProcessingMove = true;
    executeMove(tokenId);
  }

  // Executes a chosen move (for human or bot)
  async function executeMove(tokenId) {
    const activePlayer = engine.getActivePlayer();
    const token = activePlayer.tokens[tokenId];
    const fromStep = token.step;

    const moveResult = engine.moveToken(tokenId);
    if (!moveResult.success) {
      isProcessingMove = false;
      return;
    }

    // Clear playable highlights during animation
    currentValidMoves = [];
    boardRenderer.renderTokens(engine, []);

    // Animate token hop
    await boardRenderer.animateTokenMovement(
      activePlayer.color,
      tokenId,
      fromStep,
      moveResult.toStep,
      (currentStep, stepNum, totalSteps) => {
        if (window.soundEngine) {
          window.soundEngine.playStep(1 + (stepNum / totalSteps) * 0.4);
        }
      }
    );

    // Re-render board with updated token coordinates
    boardRenderer.renderTokens(engine, []);

    // Check Capture
    if (moveResult.captured) {
      if (window.soundEngine) {
        window.soundEngine.playCapture();
      }
      showToast(`💥 ${activePlayer.name} captured an opponent! Bonus Turn!`, 2200, 'warning');
    }

    // Check Home
    if (moveResult.reachedHome) {
      if (window.soundEngine) {
        window.soundEngine.playHome();
      }
      showToast(`🌟 Piece reached Home! Bonus Turn!`, 2200, 'success');
    }

    renderPlayerCards();

    // Check Game Over
    if (moveResult.gameOver) {
      isProcessingMove = false;
      triggerGameOver(moveResult.winners);
      return;
    }

    // Bonus roll or Next player
    if (moveResult.bonusTurn) {
      showToast(`${activePlayer.name} gets a BONUS ROLL! 🎲`, 1600, 'success');
      setTimeout(() => {
        isProcessingMove = false;
        updateUIForTurn();
        if (activePlayer.isAI) {
          processAITurn();
        }
      }, 800);
    } else {
      setTimeout(() => {
        isProcessingMove = false;
        updateUIForTurn();
        if (engine.getActivePlayer().isAI) {
          processAITurn();
        }
      }, 500);
    }
  }

  // AI Turn Execution
  async function processAITurn() {
    if (isProcessingMove) return;
    const aiPlayer = engine.getActivePlayer();
    if (!aiPlayer.isAI || aiPlayer.hasFinished) return;

    isProcessingMove = true;
    updateUIForTurn();

    // Natural delay before bot rolls
    await new Promise(r => setTimeout(r, fastAnimation ? 350 : 700));

    const rollResult = engine.rollDice();
    if (!rollResult) {
      isProcessingMove = false;
      return;
    }

    await diceController.roll(rollResult.roll, aiPlayer.color);

    if (rollResult.forfeited) {
      showToast(`⚠️ ${aiPlayer.name} rolled three 6s - Turn forfeited!`, 2000, 'warning');
      setTimeout(() => {
        isProcessingMove = false;
        renderPlayerCards();
        updateUIForTurn();
        boardRenderer.renderTokens(engine, []);
        if (engine.getActivePlayer().isAI) {
          processAITurn();
        }
      }, 1000);
      return;
    }

    const validMoves = rollResult.validMoves;

    if (validMoves.length === 0) {
      showToast(`${aiPlayer.name} rolled ${rollResult.roll} - No moves`, 1400, 'info');
      setTimeout(() => {
        engine.nextTurn();
        isProcessingMove = false;
        renderPlayerCards();
        updateUIForTurn();
        boardRenderer.renderTokens(engine, []);
        if (engine.getActivePlayer().isAI) {
          processAITurn();
        }
      }, fastAnimation ? 400 : 850);
      return;
    }

    // AI selects best move
    const bestMove = engine.getBestAIMove(validMoves);

    // Show AI's intention briefly
    boardRenderer.renderTokens(engine, [bestMove]);
    await new Promise(r => setTimeout(r, fastAnimation ? 200 : 500));

    await executeMove(bestMove.tokenId);
  }

  // Victory Celebration
  function triggerGameOver(winners) {
    if (window.soundEngine) {
      window.soundEngine.playVictory();
    }

    const podium = document.getElementById('victory-podium');
    if (podium) {
      podium.innerHTML = '';
      winners.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = `podium-row rank-${item.rank}`;
        const medals = ['🥇', '🥈', '🥉', '🎖️'];
        row.innerHTML = `
          <div class="podium-medal">${medals[idx] || '🎖️'}</div>
          <div class="podium-avatar">${item.player.avatar}</div>
          <div class="podium-name" style="color:${COLOR_CONFIG[item.player.color].themeColor}">${item.player.name}</div>
        `;
        podium.appendChild(row);
      });
    }

    const victoryStats = document.getElementById('victory-stats');
    if (victoryStats) {
      victoryStats.innerHTML = `
        <div class="stat-item"><span>Total Rolls:</span> <strong>${engine.stats.totalRolls}</strong></div>
        <div class="stat-item"><span>Captures:</span> <strong>${engine.stats.totalCaptures}</strong></div>
        <div class="stat-item"><span>Sixes Rolled:</span> <strong>${engine.stats.sixesRolled}</strong></div>
      `;
    }

    // Trigger visual confetti
    launchConfetti();

    victoryModal.classList.add('active');
  }

  // Lightweight CSS / Canvas Confetti Generator
  function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#ef4444', '#10b981', '#eab308', '#3b82f6', '#f43f5e', '#a855f7'];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 6,
        h: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        velX: Math.random() * 4 - 2,
        velY: Math.random() * 4 + 3,
        rot: Math.random() * 360,
        rotSpeed: Math.random() * 6 - 3
      });
    }

    let animationFrame;
    let frames = 0;

    function renderConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.velY;
        p.x += p.velX;
        p.rot += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      frames++;
      if (frames < 240) {
        animationFrame = requestAnimationFrame(renderConfetti);
      } else {
        cancelAnimationFrame(animationFrame);
        canvas.remove();
      }
    }

    renderConfetti();
  }

  // Boot the game!
  initModals();
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode') === 'pass_n_play' ? 'pass_n_play' : 'vs_bot';
  const initialPlayers = parseInt(urlParams.get('players'), 10) || 4;
  startNewGame({ playerCount: initialPlayers, mode: initialMode });

  // Register service worker if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW registration error:', err);
    });
  }
});
