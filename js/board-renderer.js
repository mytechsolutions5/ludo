/**
 * Ludo Board Renderer
 * Generates and updates an ultra-crisp luxury 3D-styled SVG 15x15 board
 * with gold-trimmed cruciform frame, glossy 3D yards, beveled tiles,
 * center crown, and 3D pawn tokens.
 */

class BoardRenderer {
  constructor(containerElement, onTokenSelected) {
    this.container = containerElement;
    this.onTokenSelected = onTokenSelected;
    this.cellSize = 100; // 1500x1500px logical coordinate system
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
    svg.setAttribute('viewBox', '-48 -48 1596 1596');
    svg.setAttribute('class', 'ludo-svg-board');

    // Defs for 3D gradients, metallic gold rim, dropshadows, and specular highlights
    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = `
      <linearGradient id="gold-rim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="28%" stop-color="#eab308" />
        <stop offset="55%" stop-color="#a16207" />
        <stop offset="80%" stop-color="#facc15" />
        <stop offset="100%" stop-color="#ca8a04" />
      </linearGradient>

      <linearGradient id="board-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#112b24" />
        <stop offset="100%" stop-color="#071814" />
      </linearGradient>

      <linearGradient id="tile-ivory" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="85%" stop-color="#f1f5f9" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>

      <!-- Yard & Track Color Gradients -->
      <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="100%" stop-color="#b91c1c" />
      </linearGradient>
      <linearGradient id="pad-red" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f87171" />
        <stop offset="100%" stop-color="#dc2626" />
      </linearGradient>

      <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1d4ed8" />
      </linearGradient>
      <linearGradient id="pad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa" />
        <stop offset="100%" stop-color="#2563eb" />
      </linearGradient>

      <linearGradient id="grad-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#facc15" />
        <stop offset="100%" stop-color="#ca8a04" />
      </linearGradient>
      <linearGradient id="pad-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fde047" />
        <stop offset="100%" stop-color="#eab308" />
      </linearGradient>

      <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22c55e" />
        <stop offset="100%" stop-color="#15803d" />
      </linearGradient>
      <linearGradient id="pad-green" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#4ade80" />
        <stop offset="100%" stop-color="#16a34a" />
      </linearGradient>

      <!-- 3D Pawn Radial Head Gradients -->
      <radialGradient id="pawn-head-red" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#fca5a5" />
        <stop offset="35%" stop-color="#ef4444" />
        <stop offset="100%" stop-color="#991b1b" />
      </radialGradient>
      <radialGradient id="pawn-head-blue" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#93c5fd" />
        <stop offset="35%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </radialGradient>
      <radialGradient id="pawn-head-yellow" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="35%" stop-color="#facc15" />
        <stop offset="100%" stop-color="#a16207" />
      </radialGradient>
      <radialGradient id="pawn-head-green" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#86efac" />
        <stop offset="35%" stop-color="#22c55e" />
        <stop offset="100%" stop-color="#14532d" />
      </radialGradient>

      <!-- 3D Pawn Body Horizontal Shading -->
      <linearGradient id="pawn-body-red" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#991b1b" />
        <stop offset="35%" stop-color="#f87171" />
        <stop offset="70%" stop-color="#dc2626" />
        <stop offset="100%" stop-color="#7f1d1d" />
      </linearGradient>
      <linearGradient id="pawn-body-blue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1e3a8a" />
        <stop offset="35%" stop-color="#60a5fa" />
        <stop offset="70%" stop-color="#2563eb" />
        <stop offset="100%" stop-color="#172554" />
      </linearGradient>
      <linearGradient id="pawn-body-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#a16207" />
        <stop offset="35%" stop-color="#fef08a" />
        <stop offset="70%" stop-color="#eab308" />
        <stop offset="100%" stop-color="#713f12" />
      </linearGradient>
      <linearGradient id="pawn-body-green" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#14532d" />
        <stop offset="35%" stop-color="#4ade80" />
        <stop offset="70%" stop-color="#16a34a" />
        <stop offset="100%" stop-color="#052e16" />
      </linearGradient>

      <linearGradient id="crown-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="60%" stop-color="#f1f5f9" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>

      <filter id="board-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000000" flood-opacity="0.7" />
      </filter>
      <filter id="pad-shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.4" />
      </filter>
      <filter id="token-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.55" />
      </filter>
    `;
    svg.appendChild(defs);

    // 1. Cruciform Gold-Trimmed Outer Board Silhouette
    this.drawCruciformFrame(svg, svgNS);

    // 2. Base Quadrants (Top-Left Red, Top-Right Blue, Bottom-Right Yellow, Bottom-Left Green)
    this.drawBases(svg, svgNS);

    // 3. Grid track cells
    this.drawTrackCells(svg, svgNS);

    // 4. Center Home Triangles + 3D Crown
    this.drawCenterHome(svg, svgNS);

    // 5. Token layer (overlay)
    this.tokenLayer = document.createElementNS(svgNS, 'g');
    this.tokenLayer.setAttribute('id', 'token-layer');
    svg.appendChild(this.tokenLayer);

    this.container.appendChild(svg);
    this.svg = svg;
  }

  drawCruciformFrame(svg, svgNS) {
    // Traces a rounded cross silhouette around the 4 arms (585..915, -20..1520)
    // and the 4 corner yards (20..585, 915..1480)
    const framePath = `
      M 640,-18
      L 860,-18
      Q 918,-18 918,40
      L 918,45
      Q 918,62 935,62
      L 1405,62
      Q 1438,62 1438,95
      L 1438,565
      Q 1438,582 1455,582
      L 1460,582
      Q 1518,582 1518,640
      L 1518,860
      Q 1518,918 1460,918
      L 1455,918
      Q 1438,918 1438,935
      L 1438,1405
      Q 1438,1438 1405,1438
      L 935,1438
      Q 918,1438 918,1455
      L 918,1460
      Q 918,1518 860,1518
      L 640,1518
      Q 582,1518 582,1460
      L 582,1455
      Q 582,1438 565,1438
      L 95,1438
      Q 62,1438 62,1405
      L 62,935
      Q 62,918 45,918
      L 40,918
      Q -18,918 -18,860
      L -18,640
      Q -18,582 40,582
      L 45,582
      Q 62,582 62,565
      L 62,95
      Q 62,62 95,62
      L 565,62
      Q 582,62 582,45
      L 582,40
      Q 582,-18 640,-18
      Z
    `;

    const outerFrame = document.createElementNS(svgNS, 'path');
    outerFrame.setAttribute('d', framePath);
    outerFrame.setAttribute('fill', 'url(#board-base-grad)');
    outerFrame.setAttribute('stroke', 'url(#gold-rim)');
    outerFrame.setAttribute('stroke-width', '14');
    outerFrame.setAttribute('stroke-linejoin', 'round');
    outerFrame.setAttribute('filter', 'url(#board-shadow)');
    svg.appendChild(outerFrame);

    // Subtle inner dark recessed bed for the track
    const trackBgH = document.createElementNS(svgNS, 'rect');
    trackBgH.setAttribute('x', '0');
    trackBgH.setAttribute('y', '594');
    trackBgH.setAttribute('width', '1500');
    trackBgH.setAttribute('height', '312');
    trackBgH.setAttribute('rx', '26');
    trackBgH.setAttribute('fill', '#0d1f1a');
    svg.appendChild(trackBgH);

    const trackBgV = document.createElementNS(svgNS, 'rect');
    trackBgV.setAttribute('x', '594');
    trackBgV.setAttribute('y', '0');
    trackBgV.setAttribute('width', '312');
    trackBgV.setAttribute('height', '1500');
    trackBgV.setAttribute('rx', '26');
    trackBgV.setAttribute('fill', '#0d1f1a');
    svg.appendChild(trackBgV);
  }

  drawBases(svg, svgNS) {
    const bases = [
      { color: 'red', x: 16, y: 16, w: 564, padX: 112, padY: 112, slots: COLOR_CONFIG.red.yardSlots },
      { color: 'blue', x: 920, y: 16, w: 564, padX: 988, padY: 112, slots: COLOR_CONFIG.blue.yardSlots },
      { color: 'yellow', x: 920, y: 920, w: 564, padX: 988, padY: 988, slots: COLOR_CONFIG.yellow.yardSlots },
      { color: 'green', x: 16, y: 920, w: 564, padX: 112, padY: 988, slots: COLOR_CONFIG.green.yardSlots }
    ];

    bases.forEach(b => {
      // Big glossy colored quadrant
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', b.x);
      rect.setAttribute('y', b.y);
      rect.setAttribute('width', b.w);
      rect.setAttribute('height', b.w);
      rect.setAttribute('rx', '62');
      rect.setAttribute('fill', `url(#grad-${b.color})`);
      rect.setAttribute('stroke', 'rgba(255,255,255,0.22)');
      rect.setAttribute('stroke-width', '4');
      rect.setAttribute('filter', 'url(#pad-shadow)');
      svg.appendChild(rect);

      // Raised 3D same-color inner square platform (matching the image)
      const inner = document.createElementNS(svgNS, 'rect');
      inner.setAttribute('x', b.padX);
      inner.setAttribute('y', b.padY);
      inner.setAttribute('width', '400');
      inner.setAttribute('height', '400');
      inner.setAttribute('rx', '48');
      inner.setAttribute('fill', `url(#pad-${b.color})`);
      inner.setAttribute('stroke', 'rgba(255,255,255,0.35)');
      inner.setAttribute('stroke-width', '4');
      inner.setAttribute('filter', 'url(#pad-shadow)');
      svg.appendChild(inner);

      // 4 subtle recessed circular token slots
      b.slots.forEach(([r, c]) => {
        const cx = c * 100 + 50;
        const cy = r * 100 + 50;

        const slotOuter = document.createElementNS(svgNS, 'circle');
        slotOuter.setAttribute('cx', cx);
        slotOuter.setAttribute('cy', cy + 6);
        slotOuter.setAttribute('r', '42');
        slotOuter.setAttribute('fill', 'rgba(0,0,0,0.28)');
        svg.appendChild(slotOuter);

        const slotInner = document.createElementNS(svgNS, 'circle');
        slotInner.setAttribute('cx', cx);
        slotInner.setAttribute('cy', cy + 6);
        slotInner.setAttribute('r', '34');
        slotInner.setAttribute('fill', `url(#grad-${b.color})`);
        slotInner.setAttribute('stroke', 'rgba(255,255,255,0.25)');
        slotInner.setAttribute('stroke-width', '2');
        svg.appendChild(slotInner);
      });
    });
  }

  drawTrackCells(svg, svgNS) {
    const starCoords = [
      [2, 6], [6, 12], [12, 8], [8, 2]
    ];
    const startSquares = {
      '6,1': { color: 'red' },
      '1,8': { color: 'blue' },
      '8,13': { color: 'yellow' },
      '13,6': { color: 'green' }
    };
    const entryArrows = {
      '7,0': { color: 'red', points: '35,28 72,50 35,72' },     // ▶
      '0,7': { color: 'blue', points: '28,35 72,35 50,72' },    // ▼
      '7,14': { color: 'yellow', points: '65,28 28,50 65,72' }, // ◀
      '14,7': { color: 'green', points: '28,65 72,65 50,28' }   // ▲
    };

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip base corners and 3x3 center
        if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) {
          continue;
        }
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
          continue;
        }

        const x = c * 100;
        const y = r * 100;

        let fill = 'url(#tile-ivory)';
        let stroke = 'rgba(15, 23, 42, 0.45)';
        const isStart = startSquares[`${r},${c}`];
        const isStar = starCoords.some(([sr, sc]) => sr === r && sc === c);
        const entryArrow = entryArrows[`${r},${c}`];

        // Home stretches
        if (r === 7 && c >= 1 && c <= 5) fill = 'url(#grad-red)';
        else if (c === 7 && r >= 1 && r <= 5) fill = 'url(#grad-blue)';
        else if (r === 7 && c >= 9 && c <= 13) fill = 'url(#grad-yellow)';
        else if (c === 7 && r >= 9 && r <= 13) fill = 'url(#grad-green)';

        // Rounded 3D tile
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', x + 3);
        rect.setAttribute('y', y + 3);
        rect.setAttribute('width', '94');
        rect.setAttribute('height', '94');
        rect.setAttribute('rx', '12');
        rect.setAttribute('fill', fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', '2');
        svg.appendChild(rect);

        // Subtle colored ring/star indicator on start squares so entry point is clear
        if (isStart) {
          this.drawStar(svg, svgNS, x + 50, y + 50, 22, `url(#grad-${isStart.color})`, 'rgba(0,0,0,0.2)');
        }

        // Entry directional triangles on the 4 outer middle arm tips (matching image)
        if (entryArrow) {
          const pts = entryArrow.points.split(' ').map(p => {
            const [px, py] = p.split(',').map(Number);
            return `${x + px},${y + py}`;
          }).join(' ');
          const tri = document.createElementNS(svgNS, 'polygon');
          tri.setAttribute('points', pts);
          tri.setAttribute('fill', `url(#grad-${entryArrow.color})`);
          svg.appendChild(tri);
        }

        // Safe Star icon (metallic grey matching the image)
        if (isStar) {
          this.drawStar(svg, svgNS, x + 50, y + 50, 25, '#94a3b8', '#64748b');
        }
      }
    }
  }

  drawStar(svg, svgNS, cx, cy, radius, fill, stroke = '#475569') {
    const points = [];
    const spikes = 5;
    const innerRadius = radius * 0.44;

    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? radius : innerRadius;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
    }

    const star = document.createElementNS(svgNS, 'polygon');
    star.setAttribute('points', points.join(' '));
    star.setAttribute('fill', fill);
    star.setAttribute('stroke', stroke);
    star.setAttribute('stroke-width', '2');
    star.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(star);
  }

  drawCenterHome(svg, svgNS) {
    // 3x3 center: (600, 600) to (900, 900). Center point is (750, 750)
    const triangles = [
      { fill: 'url(#grad-red)', points: '600,600 750,750 600,900' },    // Left = Red
      { fill: 'url(#grad-blue)', points: '600,600 900,600 750,750' },   // Top = Blue
      { fill: 'url(#grad-yellow)', points: '900,600 900,900 750,750' }, // Right = Yellow
      { fill: 'url(#grad-green)', points: '600,900 750,750 900,900' }   // Bottom = Green
    ];

    triangles.forEach(t => {
      const poly = document.createElementNS(svgNS, 'polygon');
      poly.setAttribute('points', t.points);
      poly.setAttribute('fill', t.fill);
      poly.setAttribute('stroke', '#0f172a');
      poly.setAttribute('stroke-width', '3');
      poly.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(poly);
    });

    // Crisp 3D White Crown in the center (matching reference image)
    const crownGroup = document.createElementNS(svgNS, 'g');
    crownGroup.setAttribute('filter', 'url(#token-shadow)');
    crownGroup.innerHTML = `
      <path d="M 692,782 L 682,718 L 720,746 L 750,698 L 780,746 L 818,718 L 808,782 Z"
            fill="url(#crown-grad)" stroke="#64748b" stroke-width="3" stroke-linejoin="round" />
      <rect x="692" y="784" width="116" height="14" rx="5" fill="#e2e8f0" stroke="#64748b" stroke-width="2" />
      <circle cx="682" cy="716" r="6" fill="#ffffff" />
      <circle cx="750" cy="696" r="8" fill="#ffffff" />
      <circle cx="818" cy="716" r="6" fill="#ffffff" />
    `;
    svg.appendChild(crownGroup);
  }

  /**
   * Refreshes token rendering on the board using 3D pawn silhouettes.
   * Handles multiple tokens sharing the same cell with neat clustering.
   */
  renderTokens(gameState, validMoves = []) {
    this.tokenLayer.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';

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

        let offsetX = 0;
        let offsetY = 0;
        let scale = 1.0;

        if (count === 2) {
          scale = 0.78;
          offsetX = (index === 0 ? -18 : 18);
        } else if (count === 3) {
          scale = 0.68;
          const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
          offsetX = Math.cos(angles[index]) * 20;
          offsetY = Math.sin(angles[index]) * 18;
        } else if (count >= 4) {
          scale = 0.62;
          offsetX = (index % 2 === 0 ? -19 : 19);
          offsetY = (index < 2 ? -18 : 18);
        }

        const cx = cellCenterX + offsetX;
        const cy = cellCenterY + offsetY;

        const tokenGroup = document.createElementNS(svgNS, 'g');
        tokenGroup.setAttribute('class', `ludo-token token-${player.color} ${isPlayable ? 'playable-token' : ''}`);
        tokenGroup.setAttribute('data-color', player.color);
        tokenGroup.setAttribute('data-token-id', token.id);
        tokenGroup.style.cursor = isPlayable ? 'pointer' : 'default';

        // Playable pulsating halo around base
        if (isPlayable) {
          const halo = document.createElementNS(svgNS, 'ellipse');
          halo.setAttribute('cx', cx);
          halo.setAttribute('cy', cy + 16 * scale);
          halo.setAttribute('rx', 34 * scale);
          halo.setAttribute('ry', 16 * scale);
          halo.setAttribute('fill', 'none');
          halo.setAttribute('stroke', '#fef08a');
          halo.setAttribute('stroke-width', '6');
          halo.setAttribute('class', 'token-halo-pulse');
          tokenGroup.appendChild(halo);
        }

        // 3D Pawn Group scaled around (cx, cy)
        const pawn = document.createElementNS(svgNS, 'g');
        pawn.setAttribute('transform', `translate(${cx}, ${cy}) scale(${scale})`);
        pawn.setAttribute('filter', 'url(#token-shadow)');

        // Contact shadow
        const contactShadow = document.createElementNS(svgNS, 'ellipse');
        contactShadow.setAttribute('cx', '0');
        contactShadow.setAttribute('cy', '24');
        contactShadow.setAttribute('rx', '26');
        contactShadow.setAttribute('ry', '10');
        contactShadow.setAttribute('fill', 'rgba(0,0,0,0.45)');
        pawn.appendChild(contactShadow);

        // Flared 3D pawn base + tapered body
        const body = document.createElementNS(svgNS, 'path');
        body.setAttribute('d', 'M -25,18 C -25,10 -14,2 -10,-10 L 10,-10 C 14,2 25,10 25,18 C 25,26 -25,26 -25,18 Z');
        body.setAttribute('fill', `url(#pawn-body-${player.color})`);
        body.setAttribute('stroke', 'rgba(255,255,255,0.35)');
        body.setAttribute('stroke-width', '2');
        pawn.appendChild(body);

        // Neck collar
        const collar = document.createElementNS(svgNS, 'ellipse');
        collar.setAttribute('cx', '0');
        collar.setAttribute('cy', '-9');
        collar.setAttribute('rx', '12');
        collar.setAttribute('ry', '4.5');
        collar.setAttribute('fill', `url(#pawn-body-${player.color})`);
        collar.setAttribute('stroke', 'rgba(255,255,255,0.3)');
        collar.setAttribute('stroke-width', '1.5');
        pawn.appendChild(collar);

        // Glossy spherical head
        const head = document.createElementNS(svgNS, 'circle');
        head.setAttribute('cx', '0');
        head.setAttribute('cy', '-24');
        head.setAttribute('r', '17');
        head.setAttribute('fill', `url(#pawn-head-${player.color})`);
        head.setAttribute('stroke', 'rgba(255,255,255,0.4)');
        head.setAttribute('stroke-width', '1.5');
        pawn.appendChild(head);

        // Crisp specular highlight on upper-left of head
        const shine = document.createElementNS(svgNS, 'ellipse');
        shine.setAttribute('cx', '-5.5');
        shine.setAttribute('cy', '-30');
        shine.setAttribute('rx', '5');
        shine.setAttribute('ry', '3');
        shine.setAttribute('transform', 'rotate(-30, -5.5, -30)');
        shine.setAttribute('fill', '#ffffff');
        shine.setAttribute('opacity', '0.75');
        pawn.appendChild(shine);

        if (token.finished) {
          const crown = document.createElementNS(svgNS, 'text');
          crown.setAttribute('x', '0');
          crown.setAttribute('y', '12');
          crown.setAttribute('font-size', '18');
          crown.setAttribute('text-anchor', 'middle');
          crown.textContent = '👑';
          pawn.appendChild(crown);
        }

        tokenGroup.appendChild(pawn);

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
      const stepDuration = steps.length > 5 ? 75 : 120;
      await new Promise(r => setTimeout(r, stepDuration));
    }

    this.isAnimating = false;
  }
}

window.BoardRenderer = BoardRenderer;
