/**
 * 3D Animated Dice Controller
 * Provides realistic 3D tumble physics, pip layouts, tactile tap feedback,
 * and audio synchronization.
 */

class DiceController {
  constructor(diceContainerElement, onRollTriggered) {
    this.container = diceContainerElement;
    this.onRollTriggered = onRollTriggered;
    this.isRolling = false;
    this.currentValue = 1;
    this.enabled = true;
    this.initDice();
  }

  initDice() {
    this.container.innerHTML = `
      <div class="dice-scene" id="dice-scene">
        <div class="dice-cube" id="dice-cube">
          <div class="dice-face face-1">
            <span class="pip pip-center"></span>
          </div>
          <div class="dice-face face-2">
            <span class="pip pip-top-left"></span>
            <span class="pip pip-bottom-right"></span>
          </div>
          <div class="dice-face face-3">
            <span class="pip pip-top-left"></span>
            <span class="pip pip-center"></span>
            <span class="pip pip-bottom-right"></span>
          </div>
          <div class="dice-face face-4">
            <span class="pip pip-top-left"></span>
            <span class="pip pip-top-right"></span>
            <span class="pip pip-bottom-left"></span>
            <span class="pip pip-bottom-right"></span>
          </div>
          <div class="dice-face face-5">
            <span class="pip pip-top-left"></span>
            <span class="pip pip-top-right"></span>
            <span class="pip pip-center"></span>
            <span class="pip pip-bottom-left"></span>
            <span class="pip pip-bottom-right"></span>
          </div>
          <div class="dice-face face-6">
            <span class="pip pip-top-left"></span>
            <span class="pip pip-top-right"></span>
            <span class="pip pip-middle-left"></span>
            <span class="pip pip-middle-right"></span>
            <span class="pip pip-bottom-left"></span>
            <span class="pip pip-bottom-right"></span>
          </div>
        </div>
      </div>
      <button class="roll-btn" id="roll-btn">
        <span class="btn-dice-icon">🎲</span>
        <span class="btn-text">TAP TO ROLL</span>
      </button>
    `;

    this.cube = this.container.querySelector('#dice-cube');
    this.scene = this.container.querySelector('#dice-scene');
    this.rollBtn = this.container.querySelector('#roll-btn');

    const handleTap = (e) => {
      e.preventDefault();
      if (!this.enabled || this.isRolling) return;
      if (this.onRollTriggered) {
        this.onRollTriggered();
      }
    };

    this.scene.addEventListener('click', handleTap);
    this.scene.addEventListener('touchstart', handleTap, { passive: false });
    this.rollBtn.addEventListener('click', handleTap);
    this.rollBtn.addEventListener('touchstart', handleTap, { passive: false });
  }

  setEnabled(enabled, playerColor = 'red') {
    this.enabled = enabled;
    if (enabled) {
      this.rollBtn.classList.remove('disabled');
      this.rollBtn.style.background = COLOR_CONFIG[playerColor] ? COLOR_CONFIG[playerColor].themeColor : '#3b82f6';
      this.rollBtn.querySelector('.btn-text').textContent = 'TAP TO ROLL';
      this.scene.classList.add('can-roll');
    } else {
      this.rollBtn.classList.add('disabled');
      this.rollBtn.querySelector('.btn-text').textContent = 'WAITING';
      this.scene.classList.remove('can-roll');
    }
  }

  /**
   * Animates the 3D dice cube and sets it to targetValue (1..6).
   */
  async roll(targetValue, playerColor = 'red') {
    if (this.isRolling) return;
    this.isRolling = true;
    this.currentValue = targetValue;

    if (window.soundEngine) {
      window.soundEngine.playRoll();
    }

    // Target rotations for each face:
    // Face 1: front [0, 0]
    // Face 2: bottom [90, 0]
    // Face 3: right [0, -90]
    // Face 4: left [0, 90]
    // Face 5: top [-90, 0]
    // Face 6: back [180, 0]
    const rotations = {
      1: { x: 0, y: 0 },
      2: { x: 90, y: 0 },
      3: { x: 0, y: -90 },
      4: { x: 0, y: 90 },
      5: { x: -90, y: 0 },
      6: { x: 180, y: 0 }
    };

    const targetRot = rotations[targetValue] || { x: 0, y: 0 };
    // Add random extra full 360-degree spins for realistic tumble effect
    const spinMultipliers = [2, 3, 4];
    const extraX = 360 * spinMultipliers[Math.floor(Math.random() * spinMultipliers.length)];
    const extraY = 360 * spinMultipliers[Math.floor(Math.random() * spinMultipliers.length)];

    this.cube.classList.add('is-tumbling');
    this.cube.style.transform = `rotateX(${targetRot.x + extraX}deg) rotateY(${targetRot.y + extraY}deg) rotateZ(360deg)`;

    await new Promise(r => setTimeout(r, 650));

    this.cube.classList.remove('is-tumbling');
    this.cube.style.transform = `rotateX(${targetRot.x}deg) rotateY(${targetRot.y}deg) rotateZ(0deg)`;

    if (window.soundEngine) {
      window.soundEngine.playLand();
      if (targetValue === 6) {
        setTimeout(() => window.soundEngine.playSix(), 120);
      }
    }

    this.isRolling = false;
  }
}

window.DiceController = DiceController;
