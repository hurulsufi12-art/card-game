// HARBORBOUND — Captain Maro, the rival AI. A pure function of (state + seed):
// no Math.random, no clock. Readable and beatable on purpose — Maro has a
// tell: he predicts you will play the suit that beat his last card, and the
// table shows that prediction, so a player who watches him can break the cycle.
import { cardEffectivePower, suitBeats } from './cards.js';

/** The suit that beats `suit` on the wheel (Stone has none). */
const BEATEN_BY = { Ember: 'Tide', Leaf: 'Ember', Tide: 'Leaf' };

/**
 * Maro's prediction of the player's next suit: the suit that beat his own
 * last card ("revenge"). No history yet, or his last card was Stone (nothing
 * beats Stone) -> Ember, the deterministic default.
 */
export function predictPlayerSuit(state) {
  const last = state.lastTrick;
  if (!last || !last.rival) return 'Ember';
  return BEATEN_BY[last.rival.suit] ?? 'Ember';
}

/**
 * Maro's score for one card against the predicted player suit (§1.3):
 *   eff = effective power vs the predicted suit (Sigil +3/+5 already inside)
 *   assumed opponent power = 4, +2 when the predicted suit beats this card
 *   score = (eff - assumed) * 10 + (power - cost)
 *   -15 when Maro saves a big card early (round < 4, ahead on life, power >= 7)
 */
export function scoreRivalCard(card, predictedSuit, chainSuit, round, lifeRival, lifeYou) {
  const eff = cardEffectivePower(card, predictedSuit, chainSuit);
  const assumed = 4 + (suitBeats(predictedSuit, card.suit) ? 2 : 0);
  let score = (eff - assumed) * 10 + (card.power - card.cost);
  if (round < 4 && lifeRival > lifeYou && card.power >= 7) score -= 15;
  return score;
}

/**
 * Choose Maro's card. Only affordable cards are candidates; at life <= 6 he
 * falls back to Stone (high base power, neutral — nothing counters it).
 * Highest score wins; ties go to the first card in hand (deterministic).
 * Also records the prediction on the state, so the table can show the tell.
 */
export function chooseCardForRival(state, random) {
  const predicted = predictPlayerSuit(state);
  state.predictedSuit = predicted;
  const hand = state.hands.rival;
  if (hand.length === 0) return null;
  let candidates = hand.filter((c) => c.cost <= state.gold.rival);
  if (candidates.length === 0) {
    // No affordable card: play the cheapest one so the game never stalls.
    const cheapest = hand.slice().sort((a, b) => a.cost - b.cost || a.power - b.power)[0];
    return cheapest;
  }
  if (state.life.rival <= 6) {
    const stones = candidates.filter((c) => c.suit === 'Stone');
    if (stones.length > 0) candidates = stones;
  }
  let best = candidates[0];
  let bestScore = scoreRivalCard(best, predicted, state.chainSuit.rival, state.round, state.life.rival, state.life.you);
  for (let i = 1; i < candidates.length; i += 1) {
    const score = scoreRivalCard(candidates[i], predicted, state.chainSuit.rival, state.round, state.life.rival, state.life.you);
    if (score > bestScore) {
      best = candidates[i];
      bestScore = score;
    }
  }
  return best;
}
