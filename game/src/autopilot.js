// HARBORBOUND — autopilots for the ?shot= scenes (and the full-game
// simulation test). These steer a side through the real rules; they are NOT
// the rival AI — that lives in ai-opponent.js.
import { cardEffectivePower } from './cards.js';

function affordable(state, who) {
  const hand = state.hands[who];
  const ok = hand.filter((c) => c.cost <= state.gold[who]);
  if (ok.length > 0) return ok;
  // Nothing affordable: fall back to the cheapest card so staging never stalls.
  return hand.slice().sort((a, b) => a.cost - b.cost || a.power - b.power).slice(0, 1);
}

function pickBy(cards, scoreFn) {
  let best = cards[0];
  let bestScore = scoreFn(best);
  for (let i = 1; i < cards.length; i += 1) {
    const score = scoreFn(cards[i]);
    if (score > bestScore) {
      best = cards[i];
      bestScore = score;
    }
  }
  return best;
}

/** Strongest play: raw power, Sigil bonus included. */
export function playStrongestCard(state, who) {
  const cards = affordable(state, who);
  if (cards.length === 0) return null;
  return pickBy(cards, (c) => c.power + (c.sigil ? 3 : 0));
}

/** Weakest play: lowest power first. */
export function playWeakestCard(state, who) {
  const cards = affordable(state, who);
  if (cards.length === 0) return null;
  return pickBy(cards, (c) => -c.power);
}

/**
 * Balanced play: best power-per-gold. Used for the cover table scene, where
 * both sides should look like reasonable players.
 */
export function playBalancedCard(state, who) {
  const cards = affordable(state, who);
  if (cards.length === 0) return null;
  return pickBy(cards, (c) => c.power - c.cost);
}

export { cardEffectivePower };
