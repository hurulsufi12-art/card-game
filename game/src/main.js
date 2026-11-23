// HARBORBOUND — boot, the one loop, and the ?shot= scenes.
// ?seed=N fixes the shuffle (invalid seed -> 1, never random). ?shot=table|
// title|win|loss stages that scene, paints it twice with animations frozen,
// and sets window.__shotReady for the screenshot.
// Screens: title -> table -> over, plus paused. The game state itself never
// depends on animation timing: fx only moves pixels.
import { BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { createGame, resolveTrick, startRound, canAfford } from './rules.js';
import { chooseCardForRival } from './ai-opponent.js';
import { stageShot } from './shots.js';
import { drawTable } from './render-table.js';
import { drawTitlePanel, drawWinPanel, drawLossPanel, drawPausePanel } from './render-panels.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_MUTE, createInput } from './input.js';
import { createSound } from './sound.js';

/** Parse ?seed=: a non-negative integer, or the deterministic default 1. */
export function parseSeed(value) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(n) && n >= 0 ? n : 1;
}

const HAND = { y: 544, w: 150, h: 210, pitch: 164 };

function handXStart(count) {
  return (1280 - (count * HAND.w + (count - 1) * (HAND.pitch - HAND.w))) / 2;
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = parseSeed(params.get('seed'));
  const canvas = document.getElementById('game');
  const status = document.getElementById('status');
  const ctx = canvas.getContext('2d');
  const state = createGame(seed);
  const sound = createSound();

  let best = 0;
  try {
    best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    best = 0;
  }
  function saveBest(value) {
    try {
      window.localStorage.setItem(BEST_KEY, String(value));
    } catch {
      // Storage can be off: the best score then lasts this visit only.
    }
  }
  function announce(message) {
    status.textContent = message;
  }

  // ---- ?shot= scenes: stage, paint twice, signal ready. No loop, no timers.
  if (shot) {
    const scene = stageShot(shot, state);
    if (scene.best > best) best = scene.best;
    const fx = { time: 0, shotMode: true, dealProgress: 1, revealProgress: 1 };
    let painted = 0;
    function paint() {
      if (scene.screen === 'title') {
        drawTitlePanel(ctx, state, best, fx);
      } else {
        drawTable(ctx, state, 'table', best, fx);
        if (scene.screen === 'win') drawWinPanel(ctx, state, best, fx);
        else if (scene.screen === 'loss') drawLossPanel(ctx, state, best, fx);
      }
      painted += 1;
      if (painted < 2) requestAnimationFrame(paint);
      else window.__shotReady = true;
    }
    requestAnimationFrame(paint);
    return;
  }

  // ---- Interactive game.
  const input = createInput(canvas);
  let screen = 'title';
  let revealTimer = 0;
  let resultTimer = 0;
  const fx = { time: 0, shotMode: false, dealProgress: 1, revealProgress: 1 };

  function startGame() {
    const fresh = createGame(seed);
    for (const key of Object.keys(fresh)) state[key] = fresh[key];
    screen = 'table';
    fx.dealProgress = 0;
    announce('Playing. Pick a card, then press Enter to play it.');
  }

  function endGame() {
    screen = 'over';
    if (state.tricksWon.you > best) {
      best = state.tricksWon.you;
      saveBest(best);
    }
    if (state.winner === 'you') {
      sound.playWin();
      announce(`You win the harbor! Life ${state.life.you} to ${state.life.rival}.`);
    } else if (state.winner === 'rival') {
      sound.playLose();
      announce(`Maro takes the harbor. Life ${state.life.you} to ${state.life.rival}.`);
    } else {
      announce(`A draw. Life ${state.life.you} to ${state.life.rival}.`);
    }
  }

  function confirmPlay() {
    if (state.phase !== 'choose' || !state.selectedCardId) return;
    const youCard = state.hands.you.find((c) => c.id === state.selectedCardId);
    if (!youCard || !canAfford(state, youCard, 'you')) return;
    const rivalCard = chooseCardForRival(state, createRandom(seed));
    if (!rivalCard) return;
    state.currentTrick = { you: youCard, rival: rivalCard };
    state.phase = 'reveal';
    revealTimer = 0;
    fx.revealProgress = 0;
    sound.playFlip();
    announce(`${youCard.suit} ${youCard.power} against Maro's card…`);
  }

  function cardAt(x, y) {
    if (y < HAND.y - 20 || y > HAND.y + HAND.h) return null;
    const start = handXStart(state.hands.you.length);
    for (let i = 0; i < state.hands.you.length; i += 1) {
      const cx = start + i * HAND.pitch;
      if (x >= cx && x < cx + HAND.w) return state.hands.you[i];
    }
    return null;
  }

  function handleClicks() {
    for (const click of input.takeClicks()) {
      if (screen === 'title' || screen === 'over') {
        startGame();
        return;
      }
      if (screen !== 'table' || state.phase !== 'choose') continue;
      const card = cardAt(click.x, click.y);
      if (!card) continue;
      if (!canAfford(state, card, 'you')) {
        announce(`That card costs ${card.cost} gold — you have ${state.gold.you}.`);
        continue;
      }
      if (state.selectedCardId === card.id) confirmPlay();
      else {
        state.selectedCardId = card.id;
        sound.playCard();
      }
    }
  }

  function handleKeys() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_PAUSE) {
      if (screen === 'table') {
        screen = 'paused';
        announce('Paused.');
      } else if (screen === 'paused') {
        screen = 'table';
        announce('Playing.');
      }
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === 'title' || screen === 'over') startGame();
      else if (screen === 'table') confirmPlay();
    }
    for (const digit of input.takeDigits()) {
      if (screen !== 'table' || state.phase !== 'choose') continue;
      const card = state.hands.you[digit];
      if (card && canAfford(state, card, 'you')) state.selectedCardId = card.id;
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (fx.last ?? now)) / 1000 || 0);
    fx.last = now;
    fx.time += dt;
    if (fx.dealProgress < 1) fx.dealProgress = Math.min(1, fx.dealProgress + dt * 2);
    handleKeys();
    handleClicks();

    if (screen === 'table') {
      if (state.phase === 'reveal') {
        revealTimer += dt;
        fx.revealProgress = Math.min(1, revealTimer / 0.6);
        if (revealTimer >= 0.7) {
          const trick = state.currentTrick;
          if (trick) resolveTrick(state, trick.you, trick.rival);
          resultTimer = 0;
        }
      } else if (state.phase === 'resolve' || state.phase === 'over') {
        // Let the result banner sit for a beat before the next round / panel.
        resultTimer += dt;
        if (resultTimer >= 1.4) {
          if (state.phase === 'over') endGame();
          else {
            startRound(state);
            fx.dealProgress = 0;
          }
        }
      }
    }

    if (screen === 'title') drawTitlePanel(ctx, state, best, fx);
    else {
      drawTable(ctx, state, 'table', best, fx);
      if (screen === 'over') {
        if (state.winner === 'you') drawWinPanel(ctx, state, best, fx);
        else drawLossPanel(ctx, state, best, fx);
      } else if (screen === 'paused') drawPausePanel(ctx);
    }
  }

  announce('HARBORBOUND. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (typeof window !== 'undefined') boot();
