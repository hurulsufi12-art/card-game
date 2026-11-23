// HARBORBOUND — the table: harbour backdrop, HUD (life/gold/round/tricks),
// both hands, deck + discard piles, the trick in the middle, and Maro's tell.
// Layout is pinned to the 1280x800 logical field (PLAN §4).
import { SUIT_INFO } from './config.js';
import { cardEffectivePower } from './cards.js';
import { drawCardFace, drawCardBack, drawSuitGlyph, roundRectPath } from './render-cards.js';

const HAND_Y = 544;
const HAND_CARD = { w: 150, h: 210, pitch: 164 };
const RIVAL_CARD = { w: 120, h: 168, pitch: 132 };
const TRICK_Y = 284;
const TRICK_CARD = { w: 150, h: 196 };

function handXStart(count, pitch, w) {
  return (1280 - (count * w + (count - 1) * (pitch - w))) / 2;
}

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 800);
  g.addColorStop(0, '#0e2a3a');
  g.addColorStop(0.55, '#123a4d');
  g.addColorStop(1, '#0a1f2c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 800);
  // Faint harbour planks: horizontal bands on the table felt.
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let y = 90; y < 800; y += 86) ctx.fillRect(0, y, 1280, 3);
  // A soft glow behind the trick area.
  const glow = ctx.createRadialGradient(640, 390, 40, 640, 390, 320);
  glow.addColorStop(0, 'rgba(242,193,78,0.14)');
  glow.addColorStop(1, 'rgba(242,193,78,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(320, 90, 640, 600);
}

function drawLifeBar(ctx, x, y, label, life, color) {
  ctx.fillStyle = '#e8e2cf';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  const bx = x + 52;
  roundRectPath(ctx, bx, y - 9, 150, 18, 9);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  if (life > 0) {
    roundRectPath(ctx, bx, y - 9, Math.max(12, (150 * life) / 20), 18, 9);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(String(life), bx + 160, y);
}

function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(4,16,24,0.85)';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HARBORBOUND', 24, 33);
  drawLifeBar(ctx, 330, 32, 'YOU', state.life.you, '#58b368');
  drawLifeBar(ctx, 640, 32, 'MARO', state.life.rival, '#e5534b');
  // Gold, round, tricks — right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(`Gold ${state.gold.you} · ${state.gold.rival}`, 1090, 24);
  ctx.fillStyle = '#e8e2cf';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Round ${state.round}/12   Tricks ${state.tricksWon.you}–${state.tricksWon.rival}`, 1090, 46);
}

function drawPile(ctx, x, y, label, count, topCard, isDeck) {
  ctx.save();
  for (let i = 2; i >= 0; i -= 1) {
    roundRectPath(ctx, x + i * 3, y + i * 3, 90, 126, 10);
    ctx.fillStyle = i === 0 ? '#1d3a4d' : '#122636';
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,162,39,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (count > 0) {
    if (isDeck) drawCardBack(ctx, x, y, 90, 126);
    else if (topCard) drawCardFace(ctx, topCard, x, y, 90, 126);
  }
  ctx.fillStyle = '#e8e2cf';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${label} ${count}`, x + 45, y + 144);
  ctx.restore();
}

function drawTrick(ctx, state, fx) {
  const trick = state.currentTrick;
  if (!trick) return;
  const progress = fx.shotMode ? 1 : (fx.revealProgress ?? 1);
  const leftX = 470;
  const rightX = 660;
  const y = TRICK_Y + (1 - progress) * 60;
  const youEff = cardEffectivePower(trick.you, trick.rival.suit, state.chainSuit.you);
  const rivalEff = cardEffectivePower(trick.rival, trick.you.suit, state.chainSuit.rival);
  ctx.save();
  if (progress < 1) ctx.globalAlpha = 0.4 + 0.6 * progress;
  drawCardFace(ctx, trick.you, leftX, y, TRICK_CARD.w, TRICK_CARD.h, { eff: youEff });
  drawCardFace(ctx, trick.rival, rightX, y, TRICK_CARD.w, TRICK_CARD.h, { eff: rivalEff });
  ctx.restore();
  // VS badge between the cards.
  ctx.save();
  ctx.beginPath();
  ctx.arc(640, TRICK_Y + 98, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#1d2b33';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f2c14e';
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', 640, TRICK_Y + 99);
  ctx.restore();
  // Labels beside the trick cards (the band above is the result banner's row).
  ctx.fillStyle = '#e8e2cf';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillText('YOU', leftX - 14, TRICK_Y + 98);
  ctx.textAlign = 'left';
  ctx.fillText('MARO', rightX + TRICK_CARD.w + 14, TRICK_Y + 98);
}

function drawResultBanner(ctx, state) {
  const last = state.lastTrick;
  if (!last || state.phase === 'reveal') return;
  let text;
  if (last.winner === 'you') {
    text = `You take the trick! ${last.you.suit} ${last.you.power} beats ${last.rival.suit} ${last.rival.power} — ${last.damage} damage to Maro`;
  } else if (last.winner === 'rival') {
    text = `Maro takes the trick! ${last.rival.suit} ${last.rival.power} beats ${last.you.suit} ${last.you.power} — ${last.damage} damage to you`;
  } else {
    text = `Tied trick — no damage, no spoils. The chain holds.`;
  }
  ctx.save();
  ctx.font = 'bold 19px system-ui, sans-serif';
  const tw = ctx.measureText(text).width + 36;
  roundRectPath(ctx, 640 - tw / 2, 248, tw, 36, 18);
  ctx.fillStyle = 'rgba(4,16,24,0.8)';
  ctx.fill();
  ctx.fillStyle = last.winner === 'you' ? '#9be15d' : last.winner === 'rival' ? '#ff9a8a' : '#e8e2cf';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 640, 267);
  ctx.restore();
}

function drawTell(ctx, state) {
  ctx.save();
  ctx.font = '15px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#bcd6de';
  ctx.fillText("Rival's tell: Maro favors the suit that beat his last card.", 60, 520);
  const label = 'Maro expects: ';
  const lw = ctx.measureText(label).width;
  ctx.textAlign = 'right';
  ctx.fillText(label, 1220 - 90, 520);
  const info = SUIT_INFO[state.predictedSuit];
  drawSuitGlyph(ctx, state.predictedSuit, 1220 - 72, 520, 22, info.color);
  ctx.fillStyle = info.color;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.predictedSuit, 1220 - 56, 520);
  void lw;
  ctx.restore();
}

function drawHands(ctx, state, fx) {
  // Rival hand: face-down backs.
  const rx = handXStart(state.hands.rival.length, RIVAL_CARD.pitch, RIVAL_CARD.w);
  state.hands.rival.forEach((_, i) => {
    drawCardBack(ctx, rx + i * RIVAL_CARD.pitch, 76, RIVAL_CARD.w, RIVAL_CARD.h);
  });
  ctx.fillStyle = '#bcd6de';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("MARO'S HAND", 640, 66);
  // Player hand: face-up, selected card raised, unaffordable dimmed.
  const px = handXStart(state.hands.you.length, HAND_CARD.pitch, HAND_CARD.w);
  const deal = fx.shotMode ? 1 : (fx.dealProgress ?? 1);
  state.hands.you.forEach((card, i) => {
    const selected = state.selectedCardId === card.id;
    const y = HAND_Y - (selected ? 16 : 0) + (1 - deal) * (40 + i * 14);
    drawCardFace(ctx, card, px + i * HAND_CARD.pitch, y, HAND_CARD.w, HAND_CARD.h, {
      dimmed: card.cost > state.gold.you,
    });
    if (selected) {
      ctx.save();
      roundRectPath(ctx, px + i * HAND_CARD.pitch - 4, y - 4, HAND_CARD.w + 8, HAND_CARD.h + 8, 14);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.fillStyle = '#bcd6de';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR HAND — click a card, then Enter to play', 640, HAND_Y + HAND_CARD.h + 22);
}

/** Paint the whole table for the current state. `fx` carries animation progress. */
export function drawTable(ctx, state, screen, best, fx = {}) {
  drawBackground(ctx);
  drawHud(ctx, state);
  drawPile(ctx, 36, 76, 'DISCARD', state.discards.rival.length, state.discards.rival[state.discards.rival.length - 1], false);
  drawPile(ctx, 1154, 76, 'DECK', state.decks.rival.length, null, true);
  drawPile(ctx, 36, 542, 'DECK', state.decks.you.length, null, true);
  drawPile(ctx, 1154, 542, 'DISCARD', state.discards.you.length, state.discards.you[state.discards.you.length - 1], false);
  drawResultBanner(ctx, state);
  drawTrick(ctx, state, fx);
  drawTell(ctx, state);
  drawHands(ctx, state, fx);
}
