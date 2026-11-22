/**
 * Ludo Board Renderer
 * Generates and updates an ultra-crisp SVG 15x15 board with dynamic
 * token placement, stacking, smooth hop animations, and touch highlights.
 */

class BoardRenderer {
  constructor(containerElement, onTokenSelected) {
    this.container = containerElement;
    this.onTokenSelected = onTokenSelected;
    this.cellSize = 100; // 1500x1500px coordinate system
    this.svg = null;
    this.tokenLayer = null;
    this.animationQueue = [];
    this.isAnimating = false;
    this.initBoard();
  }

  initBoard() {
    this.container.innerHTML = '';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1500 1500');
    svg.setAttribute('class', 'ludo-svg-board');

    // Defs for gradients, dropshadows, filters
    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = `
      <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff5252" />
        <stop offset="100%" stop-color="#dc2626" />
      </linearGradient>
      <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34d399" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
      <linearGradient id="grad-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fde047" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa" />
        <stop offset="100%" stop-color="#2563eb" />
      </linearGradient>
      <filter id="token-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.45" />
      </filter>
      <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
    svg.appendChild(defs);

    // 1. Board background
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('width', '1500');
    bg.setAttribute('height', '1500');
    bg.setAttribute('rx', '40');
    bg.setAttribute('fill', '#f8fafc');
    bg.setAttribute('stroke', '#0f172a');
    bg.setAttribute('stroke-width', '12');
    svg.appendChild(bg);

    // 2. Base Quadrants
    this.drawBases(svg, svgNS);

    // 3. Grid track cells
    this.drawTrackCells(svg, svgNS);

    // 4. Center Home Triangles
    this.drawCenterHome(svg, svgNS);

    // 5. Token layer (overlay)
    this.tokenLayer = document.createElementNS(svgNS, 'g');
    this.tokenLayer.setAttribute('id', 'token-layer');
    svg.appendChild(this.tokenLayer);

    this.container.appendChild(svg);
    this.svg = svg;
  }

  drawBases(svg, svgNS) {
    const bases = [
      { color: 'red', x: 0, y: 0, fill: 'url(#grad-red)', slots: COLOR_CONFIG.red.yardSlots },
      { color: 'green', x: 900, y: 0, fill: 'url(#grad-green)', slots: COLOR_CONFIG.green.yardSlots },
      { color: 'yellow', x: 900, y: 900, fill: 'url(#grad-yellow)', slots: COLOR_CONFIG.yellow.yardSlots },
      { color: 'blue', x: 0, y: 900, fill: 'url(#grad-blue)', slots: COLOR_CONFIG.blue.yardSlots }
    ];

    bases.forEach(b => {
      // Big quadrant
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', b.x);
      rect.setAttribute('y', b.y);
      rect.setAttribute('width', '600');
      rect.setAttribute('height', '600');
      rect.setAttribute('fill', b.fill);
      rect.setAttribute('stroke', '#0f172a');
      rect.setAttribute('stroke-width', '6');
      svg.appendChild(rect);

      // Inner white rounded card
      const inner = document.createElementNS(svgNS, 'rect');
      inner.setAttribute('x', b.x + 80);
      inner.setAttribute('y', b.y + 80);
      inner.setAttribute('width', '440');
      inner.setAttribute('height', '440');
      inner.setAttribute('rx', '40');
      inner.setAttribute('fill', '#ffffff');
      inner.setAttribute('stroke', '#e2e8f0');
      inner.setAttribute('stroke-width', '4');
      svg.appendChild(inner);

      // 4 token base circle slots
      b.slots.forEach(([r, c]) => {
        const cx = c * 100 + 50;
        const cy = r * 100 + 50;

        const slotOuter = document.createElementNS(svgNS, 'circle');
        slotOuter.setAttribute('cx', cx);
        slotOuter.setAttribute('cy', cy);
        slotOuter.setAttribute('r', '42');
        slotOuter.setAttribute('fill', b.fill);
        slotOuter.setAttribute('opacity', '0.2');
        svg.appendChild(slotOuter);

        const slotInner = document.createElementNS(svgNS, 'circle');
        slotInner.setAttribute('cx', cx);
        slotInner.setAttribute('cy', cy);
        slotInner.setAttribute('r', '32');
        slotInner.setAttribute('fill', b.fill);
        slotInner.setAttribute('stroke', '#ffffff');
        slotInner.setAttribute('stroke-width', '3');
        svg.appendChild(slotInner);
      });
    });
  }

  drawTrackCells(svg, svgNS) {
    const starCoords = [
      [2, 6], [6, 12], [12, 8], [8, 2]
    ];
    const startSquares = {
      '6,1': { color: 'red', arrow: '→' },
      '1,8': { color: 'green', arrow: '↓' },
      '8,13': { color: 'yellow', arrow: '←' },
      '13,6': { color: 'blue', arrow: '↑' }
    };

    // Draw all 15x15 cells that are part of the track
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip base squares (0..5, 0..5), (0..5, 9..14), (9..14, 0..5), (9..14, 9..14)
        if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) {
          continue;
        }
        // Skip 3x3 center
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
          continue;
        }

        const x = c * 100;
        const y = r * 100;

        let fill = '#ffffff';
        let isStart = startSquares[`${r},${c}`];
        let isStar = starCoords.some(([sr, sc]) => sr === r && sc === c);

        // Check if home stretch
        if (r === 7 && c >= 1 && c <= 5) fill = 'url(#grad-red)';
        else if (c === 7 && r >= 1 && r <= 5) fill = 'url(#grad-green)';
        else if (r === 7 && c >= 9 && c <= 13) fill = 'url(#grad-yellow)';
        else if (c === 7 && r >= 9 && r <= 13) fill = 'url(#grad-blue)';
        else if (isStart) fill = `url(#grad-${isStart.color})`;

        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', '100');
        rect.setAttribute('height', '100');
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', '#cbd5e1');
        rect.setAttribute('stroke-width', '2');
        svg.appendChild(rect);

        // Draw start arrow
        if (isStart) {
          const text = document.createElementNS(svgNS, 'text');
          text.setAttribute('x', x + 50);
          text.setAttribute('y', y + 62);
          text.setAttribute('font-size', '38');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('fill', '#ffffff');
          text.setAttribute('text-anchor', 'middle');
          text.textContent = isStart.arrow;
          svg.appendChild(text);
        }

        // Draw Safe Star icon
        if (isStar) {
          this.drawStar(svg, svgNS, x + 50, y + 50, 26, '#eab308');
        }
      }
    }
  }

  drawStar(svg, svgNS, cx, cy, radius, color) {
    const points = [];
    const spikes = 5;
    const innerRadius = radius * 0.45;

    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? radius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
    }

    const star = document.createElementNS(svgNS, 'polygon');
    star.setAttribute('points', points.join(' '));
    star.setAttribute('fill', color);
    star.setAttribute('stroke', '#0f172a');
    star.setAttribute('stroke-width', '2');
    star.setAttribute('filter', 'url(#token-shadow)');
    svg.appendChild(star);
  }

  drawCenterHome(svg, svgNS) {
    // 3x3 center: (600, 600) to (900, 900). Center point is (750, 750)
    const triangles = [
      { fill: 'url(#grad-red)', points: '600,600 750,750 600,900' },
      { fill: 'url(#grad-green)', points: '600,600 900,600 750,750' },
      { fill: 'url(#grad-yellow)', points: '900,600 900,900 750,750' },
      { fill: 'url(#grad-blue)', points: '600,900 750,750 900,900' }
    ];

    triangles.forEach(t => {
      const poly = document.createElementNS(svgNS, 'polygon');
      poly.setAttribute('points', t.points);
      poly.setAttribute('fill', t.fill);
      poly.setAttribute('stroke', '#0f172a');
      poly.setAttribute('stroke-width', '3');
      svg.appendChild(poly);
    });

    // Golden center trophy/crown circle
    const centerCircle = document.createElementNS(svgNS, 'circle');
    centerCircle.setAttribute('cx', '750');
    centerCircle.setAttribute('cy', '750');
    centerCircle.setAttribute('r', '40');
    centerCircle.setAttribute('fill', '#ffffff');
    centerCircle.setAttribute('stroke', '#eab308');
    centerCircle.setAttribute('stroke-width', '6');
    svg.appendChild(centerCircle);

    const trophy = document.createElementNS(svgNS, 'text');
    trophy.setAttribute('x', '750');
    trophy.setAttribute('y', '762');
    trophy.setAttribute('font-size', '34');
    trophy.setAttribute('text-anchor', 'middle');
    trophy.textContent = '🏆';
    svg.appendChild(trophy);
  }

  /**
   * Refreshes token rendering on the board.
   * Handles multiple tokens sharing the same cell with neat clustering.
   */
  renderTokens(gameState, validMoves = []) {
    this.tokenLayer.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';

    // Map board cells to token lists: 'r,c' -> [ { player, token } ]
    const cellTokenMap = new Map();

    gameState.players.forEach(player => {
      player.tokens.forEach(token => {
        let coord;
        if (token.step === -1) {
          coord = COLOR_CONFIG[player.color].yardSlots[token.id];
        } else if (token.finished) {
          coord = COLOR_CONFIG[player.color].homeCenter;
        } else {
          coord = PLAYER_PATHS[player.color][token.step].coord;
        }
        const key = `${coord[0]},${coord[1]}`;
        if (!cellTokenMap.has(key)) {
          cellTokenMap.set(key, []);
        }
        cellTokenMap.get(key).push({ player, token, coord });
      });
    });

    // Render each cell's tokens
    cellTokenMap.forEach((tokenList, cellKey) => {
      const [row, col] = cellKey.split(',').map(Number);
      const cellCenterX = col * 100 + 50;
      const cellCenterY = row * 100 + 50;
      const count = tokenList.length;

      tokenList.forEach((item, index) => {
        const { player, token } = item;
        const isPlayable = validMoves.some(
          m => m.tokenId === token.id && player.color === gameState.getActivePlayer().color
        );

        // Position offsets when multiple tokens occupy one cell
        let offsetX = 0;
        let offsetY = 0;
        let radius = 34;

        if (count === 2) {
          radius = 26;
          offsetX = (index === 0 ? -18 : 18);
        } else if (count === 3) {
          radius = 22;
          const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
          offsetX = Math.cos(angles[index]) * 20;
          offsetY = Math.sin(angles[index]) * 20;
        } else if (count >= 4) {
          radius = 20;
          offsetX = (index % 2 === 0 ? -20 : 20);
          offsetY = (index < 2 ? -20 : 20);
        }

        const cx = cellCenterX + offsetX;
        const cy = cellCenterY + offsetY;

        const tokenGroup = document.createElementNS(svgNS, 'g');
        tokenGroup.setAttribute('class', `ludo-token token-${player.color} ${isPlayable ? 'playable-token' : ''}`);
        tokenGroup.setAttribute('data-color', player.color);
        tokenGroup.setAttribute('data-token-id', token.id);
        tokenGroup.style.cursor = isPlayable ? 'pointer' : 'default';

        // Playable pulsating halo
        if (isPlayable) {
          const halo = document.createElementNS(svgNS, 'circle');
          halo.setAttribute('cx', cx);
          halo.setAttribute('cy', cy);
          halo.setAttribute('r', radius + 12);
          halo.setAttribute('fill', 'none');
          halo.setAttribute('stroke', '#ffffff');
          halo.setAttribute('stroke-width', '6');
          halo.setAttribute('class', 'token-halo-pulse');
          tokenGroup.appendChild(halo);
        }

        // Token outer body with drop shadow
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', `url(#grad-${player.color})`);
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '4');
        circle.setAttribute('filter', 'url(#token-shadow)');
        tokenGroup.appendChild(circle);

        // Inner rim shine
        const innerShine = document.createElementNS(svgNS, 'circle');
        innerShine.setAttribute('cx', cx);
        innerShine.setAttribute('cy', cy);
        innerShine.setAttribute('r', radius * 0.65);
        innerShine.setAttribute('fill', '#ffffff');
        innerShine.setAttribute('opacity', '0.35');
        tokenGroup.appendChild(innerShine);

        // Core dot or crown
        if (token.finished) {
          const crown = document.createElementNS(svgNS, 'text');
          crown.setAttribute('x', cx);
          crown.setAttribute('y', cy + 7);
          crown.setAttribute('font-size', '20');
          crown.setAttribute('text-anchor', 'middle');
          crown.textContent = '👑';
          tokenGroup.appendChild(crown);
        } else {
          const core = document.createElementNS(svgNS, 'circle');
          core.setAttribute('cx', cx);
          core.setAttribute('cy', cy);
          core.setAttribute('r', radius * 0.3);
          core.setAttribute('fill', '#ffffff');
          tokenGroup.appendChild(core);
        }

        // Click / touch event handling
        if (isPlayable) {
          const clickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.onTokenSelected) {
              this.onTokenSelected(player.color, token.id);
            }
          };
          tokenGroup.addEventListener('click', clickHandler);
          tokenGroup.addEventListener('touchstart', clickHandler, { passive: false });
        }

        this.tokenLayer.appendChild(tokenGroup);
      });
    });
  }

  /**
   * Animates a token hopping step-by-step to its destination.
   */
  async animateTokenMovement(playerColor, tokenId, fromStep, toStep, onStepCallback) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const path = PLAYER_PATHS[playerColor];
    const steps = [];

    if (fromStep === -1) {
      // Release from yard: instant step to start
      steps.push(0);
    } else {
      for (let s = fromStep + 1; s <= toStep; s++) {
        steps.push(s);
      }
    }

    for (let i = 0; i < steps.length; i++) {
      const stepIdx = steps[i];
      if (onStepCallback) {
        onStepCallback(stepIdx, i + 1, steps.length);
      }
      // Speed up animation slightly if long travel
      const stepDuration = steps.length > 5 ? 75 : 120;
      await new Promise(r => setTimeout(r, stepDuration));
    }

    this.isAnimating = false;
  }
}

window.BoardRenderer = BoardRenderer;
