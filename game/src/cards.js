// HARBORBOUND — cards: suits, the wheel, and the ONE effective-power formula.
// Sigil is a bonus to effective power (+3, +2 more on chain), NOT damage:
// a Sigil can flip a trick that would otherwise be lost (§1.2).
import { SUIT_BEATS, SUIT_INFO } from './config.js';

export const CARD_SUITS = ['Ember', 'Tide', 'Leaf', 'Stone'];

/** True when suit `a` beats suit `b` on the wheel. Stone never beats, never loses. */
export function suitBeats(a, b) {
  return SUIT_BEATS[a] === b;
}

/**
 * Effective power — the single formula, no bonus anywhere else:
 *   power
 *   + 2 when your suit beats the opponent's suit
 *   + 1 when your suit equals your chainSuit
 *   + 3 when the card is a Sigil
 *   + 2 more when the card is a Sigil and its suit equals your chainSuit
 */
export function cardEffectivePower(card, opponentSuit, chainSuit) {
  let eff = card.power;
  if (opponentSuit && suitBeats(card.suit, opponentSuit)) eff += 2;
  if (chainSuit && card.suit === chainSuit) eff += 1;
  if (card.sigil) {
    eff += 3;
    if (chainSuit && card.suit === chainSuit) eff += 2;
  }
  return eff;
}

export function isSigil(card) {
  return card.sigil === true;
}

export function describeCard(card) {
  const kind = card.sigil ? `Sigil of ${card.suit}` : `${card.suit} ${card.power}`;
  return `${kind} · power ${card.power} · cost ${card.cost}`;
}

export { SUIT_INFO };
