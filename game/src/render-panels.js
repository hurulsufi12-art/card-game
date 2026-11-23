// HARBORBOUND — the full-screen panels: title, win, loss, pause, plus the
// suit-glyph confetti for a win. In shot mode everything is static (positions
// from the seed); in play mode the title prompt blinks and confetti falls.
import { SUIT_INFO } from './config.js';
import { buildDeck } from './deck.js';
import { createRandom } from './random.js';
import { drawCardFace, drawCardBack, drawSuitGlyph, roundRectPath } from './render-cards.js';

function dimOverlay(ctx, alpha) {
  ctx.fillStyle = `rgba(4,16,24,${alpha})`;
  ctx.fillRect(0, 0, 1280, 800);
}

/** Static scattered cards behind the title, positions from the seed. */
function drawTitleBackdrop(ctx, seed) {
  const random = createRandom(seed * 7 + 11);
  const deck = buildDeck(seed);
  for (let i = 0; i < 9; i += 1) {
    const x = 50 + random() * 1050;
    const y = 70 + random() * 560;
    const angle = (random() - 0.5) * 0.7;
    ctx.save();
    ctx.translate(x + 60, y + 84);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.85;
    if (i % 3 === 2) drawCardBack(ctx, -60, -84, 120, 168);
    else drawCardFace(ctx, deck[i], -60, -84, 120, 168);
    ctx.restore();
  }
}

/** The suit wheel: Ember > Leaf > Tide in a cycle, Stone neutral in the middle. */
function drawSuitWheel(ctx, cx, cy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(232,226,207,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 62, 0, Math.PI * 2);
  ctx.stroke();
  const spots = [
    { suit: 'Ember', x: cx, y: cy - 62 },
    { suit: 'Leaf', x: cx + 54, y: cy + 31 },
    { suit: 'Tide', x: cx - 54, y: cy + 31 },
  ];
  for (const spot of spots) {
    const info = SUIT_INFO[spot.suit];
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(4,16,24,0.85)';
    ctx.fill();
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawSuitGlyph(ctx, spot.suit, spot.x, spot.y, 30, info.color);
  }
  // Arrows along the cycle: Ember -> Leaf -> Tide -> Ember.
  ctx.fillStyle = '#e8e2cf';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('›', cx + 38, cy - 26);
  ctx.fillText('›', cx + 8, cy + 62);
  ctx.fillText('›', cx - 44, cy - 8);
  // Stone, neutral, in the middle.
  drawSuitGlyph(ctx, 'Stone', cx, cy, 30, SUIT_INFO.Stone.color);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('STONE NEUTRAL', cx, cy + 82);
  ctx.restore();
}

export function drawTitlePanel(ctx, state, best, fx = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, 800);
  g.addColorStop(0, '#0e2a3a');
  g.addColorStop(1, '#081826');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 800);
  drawTitleBackdrop(ctx, state.seed);
  dimOverlay(ctx, 0.72);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 88px Georgia, serif';
  ctx.fillText('HARBORBOUND', 640, 168);
  ctx.fillStyle = '#e8e2cf';
  ctx.font = 'italic 30px Georgia, serif';
  ctx.fillText('Bet a Card, Take the Harbor', 640, 214);
  drawSuitWheel(ctx, 640, 330);
  ctx.fillStyle = '#e8e2cf';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Both guilds play one card — the higher power takes the trick.', 640, 470);
  ctx.fillText('Ember beats Leaf, Leaf beats Tide, Tide beats Ember. Stone is neutral.', 640, 498);
  ctx.fillText('Sigils add +3 power. Chain your winning suit for +1. Sink the rival harbor to win.', 640, 526);
  const blink = fx.shotMode ? 1 : 0.65 + 0.35 * Math.sin((fx.time ?? 0) * 3);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('Press Space or click to start', 640, 590);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#bcd6de';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Best game: ${best} tricks won in one game`, 640, 632);
  ctx.fillStyle = '#8fa8b2';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('A complete original card game: title, table, both hands, readable cards, life totals, win & loss screens — all in these 4 shots.', 640, 748);
  ctx.restore();
}

/** Suit-glyph confetti. Static in shot mode, falling in play mode. */
export function drawConfetti(ctx, seed, time, shotMode) {
  const random = createRandom(seed * 13 + 5);
  const suits = ['Ember', 'Tide', 'Leaf', 'Stone'];
  ctx.save();
  for (let i = 0; i < 48; i += 1) {
    const x = random() * 1280;
    const startY = random() * 800;
    const speed = 30 + random() * 70;
    const y = shotMode ? startY : (startY + time * speed) % 820 - 10;
    const size = 12 + random() * 10;
    const suit = suits[i % 4];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(random() * Math.PI * 2 + (shotMode ? 0 : time * 0.5));
    ctx.globalAlpha = 0.9;
    drawSuitGlyph(ctx, suit, 0, 0, size, SUIT_INFO[suit].color);
    ctx.restore();
  }
  ctx.restore();
}

function drawEndPanel(ctx, state, best, won, fx) {
  dimOverlay(ctx, 0.55);
  if (won) drawConfetti(ctx, state.seed, fx.time ?? 0, fx.shotMode);
  ctx.save();
  roundRectPath(ctx, 260, 190, 760, 400, 24);
  ctx.fillStyle = '#f7f1de';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = won ? '#b8860b' : '#4a6b7c';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#8a6d1f' : '#33505f';
  ctx.font = `bold ${won ? 62 : 46}px Georgia, serif`;
  ctx.fillText(won ? 'HARBOR YOURS!' : 'THE TIDE TOOK THE HARBOR', 640, 300);
  ctx.fillStyle = '#3a3a2e';
  ctx.font = '22px system-ui, sans-serif';
  const loserLife = won ? state.life.rival : state.life.you;
  const winnerLife = won ? state.life.you : state.life.rival;
  ctx.fillText(
    `Final life ${winnerLife} – ${loserLife}  ·  ${state.round} rounds  ·  Tricks ${state.tricksWon.you}–${state.tricksWon.rival}`,
    640, 360,
  );
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#6b5d3f';
  ctx.fillText(
    won
      ? 'Captain Maro salutes you. The harbor flies your flag.'
      : 'Maro keeps the harbor — for now. Study his tell and come back.',
    640, 410,
  );
  const blink = fx.shotMode ? 1 : 0.65 + 0.35 * Math.sin((fx.time ?? 0) * 3);
  ctx.globalAlpha = blink;
  ctx.fillStyle = '#33505f';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('Press Space to play again', 640, 500);
  ctx.restore();
}

export function drawWinPanel(ctx, state, best, fx = {}) {
  drawEndPanel(ctx, state, best, true, fx);
}

export function drawLossPanel(ctx, state, best, fx = {}) {
  drawEndPanel(ctx, state, best, false, fx);
}

export function drawPausePanel(ctx) {
  dimOverlay(ctx, 0.6);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText('PAUSED', 640, 380);
  ctx.fillStyle = '#e8e2cf';
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('Press P to resume', 640, 430);
  ctx.restore();
}
