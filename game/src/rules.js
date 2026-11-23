// HARBORBOUND — the rules: game state (§1.5 contract), trick resolution,
// rounds, gold, life, and the end of the game. Pure functions: no DOM, no
// canvas, no random. The AI, the autopilot, the renderer and the tests all
// speak this exact state shape.
import {
  LIFE, GOLD_START, GOLD_PER_ROUND, GOLD_MAX, MAX_ROUNDS, HAND_SIZE,
} from './config.js';
import { buildDeck, drawCard, discardCard, reshuffleDiscardIntoDeck } from './deck.js';
import { cardEffectivePower } from './cards.js';
import { createRandom } from './random.js';

/**
 * A fresh game. The player's deck is shuffled with seed S, the rival's with
 * S+1000 — mirrored decks would leak the rival's hand order, so they are
 * deliberately different. Round 1 is the opening state: 5 cards, 3 gold,
 * no income, no extra draw.
 */
export function createGame(seed) {
  const youDeck = buildDeck(seed);
  const rivalDeck = buildDeck(seed + 1000);
  const state = {
    seed,
    round: 1,
    phase: 'choose', // 'choose' | 'reveal' | 'resolve' | 'over'
    life: { you: LIFE, rival: LIFE },
    gold: { you: GOLD_START, rival: GOLD_START },
    hands: { you: [], rival: [] },
    decks: { you: youDeck, rival: rivalDeck },
    discards: { you: [], rival: [] },
    chainSuit: { you: null, rival: null },
    tricksWon: { you: 0, rival: 0 },
    selectedCardId: null,
    currentTrick: null,
    lastTrick: null,
    predictedSuit: 'Ember',
    winner: null,
  };
  for (let i = 0; i < HAND_SIZE; i += 1) {
    drawCard(state.decks.you, state.hands.you);
    drawCard(state.decks.rival, state.hands.rival);
  }
  return state;
}

export function canAfford(state, card, who = 'you') {
  return card.cost <= state.gold[who];
}

/** Damage to the loser's life, floored at 0. */
export function applyTrickDamage(state, winner, damage) {
  const loser = winner === 'you' ? 'rival' : 'you';
  state.life[loser] = Math.max(0, state.life[loser] - damage);
}

/** Trick spoils: the winner gains 1 gold, capped at GOLD_MAX. */
export function awardSpoilsGold(state, winner) {
  state.gold[winner] = Math.min(GOLD_MAX, state.gold[winner] + 1);
}

/**
 * Who has won the game, if anyone: 'you' | 'rival' | 'draw' | null.
 * Life 0 ends it at once; otherwise round 12 is decided by remaining life.
 */
export function checkGameEnd(state) {
  if (state.life.you <= 0) return 'rival';
  if (state.life.rival <= 0) return 'you';
  if (state.round >= MAX_ROUNDS && state.phase === 'resolve') {
    if (state.life.you > state.life.rival) return 'you';
    if (state.life.rival > state.life.you) return 'rival';
    return 'draw';
  }
  return null;
}

function takeFromHand(hand, cardId) {
  const index = hand.findIndex((c) => c.id === cardId);
  if (index === -1) return null;
  return hand.splice(index, 1)[0];
}

/**
 * Resolve one trick. Both cards must be in their owner's hand, or the trick
 * is refused and the state is left untouched. On success the cards move to
 * their own discard piles, damage/spoils/chainSuit/tricksWon are applied,
 * lastTrick is recorded, and the phase becomes 'over' (game ended) or
 * 'resolve' (call startRound for the next round).
 */
export function resolveTrick(state, youCard, rivalCard) {
  if (state.phase === 'over') return { ok: false, reason: 'game-over' };
  if (!youCard || !rivalCard) return { ok: false, reason: 'missing-card' };
  const inYouHand = state.hands.you.some((c) => c.id === youCard.id);
  const inRivalHand = state.hands.rival.some((c) => c.id === rivalCard.id);
  if (!inYouHand || !inRivalHand) return { ok: false, reason: 'not-in-hand' };

  takeFromHand(state.hands.you, youCard.id);
  takeFromHand(state.hands.rival, rivalCard.id);
  const youEff = cardEffectivePower(youCard, rivalCard.suit, state.chainSuit.you);
  const rivalEff = cardEffectivePower(rivalCard, youCard.suit, state.chainSuit.rival);
  let winner = null;
  let damage = 0;
  if (youEff > rivalEff) {
    winner = 'you';
    damage = Math.max(1, youEff - rivalEff);
  } else if (rivalEff > youEff) {
    winner = 'rival';
    damage = Math.max(1, rivalEff - youEff);
  }
  if (winner) {
    applyTrickDamage(state, winner, damage);
    awardSpoilsGold(state, winner);
    state.tricksWon[winner] += 1;
    state.chainSuit[winner] = winner === 'you' ? youCard.suit : rivalCard.suit;
  }
  discardCard(youCard, state.discards.you);
  discardCard(rivalCard, state.discards.rival);
  state.lastTrick = {
    you: youCard, rival: rivalCard, youEff, rivalEff, winner, damage, round: state.round,
  };
  state.currentTrick = null;
  state.selectedCardId = null;
  state.phase = 'resolve';
  const end = checkGameEnd(state);
  if (end) {
    state.phase = 'over';
    state.winner = end;
  }
  return { ok: true, winner, damage, youEff, rivalEff, tie: winner === null };
}

/**
 * Open round 2..12: round +1, gold +2 (capped), draw 1 card each
 * (reshuffling that side's discard pile when its deck is empty).
 * A finished game or a game already at round 12 is left alone.
 */
export function startRound(state) {
  if (state.phase === 'over' || state.round >= MAX_ROUNDS) return state;
  state.round += 1;
  state.gold.you = Math.min(GOLD_MAX, state.gold.you + GOLD_PER_ROUND);
  state.gold.rival = Math.min(GOLD_MAX, state.gold.rival + GOLD_PER_ROUND);
  const random = createRandom(state.seed * 31 + state.round);
  reshuffleDiscardIntoDeck(state.decks.you, state.discards.you, random);
  reshuffleDiscardIntoDeck(state.decks.rival, state.discards.rival, random);
  drawCard(state.decks.you, state.hands.you);
  drawCard(state.decks.rival, state.hands.rival);
  state.phase = 'choose';
  return state;
}

export { MAX_ROUNDS, GOLD_MAX };
