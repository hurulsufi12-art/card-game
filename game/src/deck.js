// HARBORBOUND — the 24-card deck: composition, shuffle, draw, discard, reshuffle.
// Pinned composition (§1.1): 4 plain + 2 Sigil per suit. Plain Ember/Tide/Leaf
// powers 1,3,5,7; plain Stone 5,6,8,9. Cost 0 (power <= 3), 1 (power 5-7),
// 2 (power 8-9); Sigils cost 2, power 3. No card costs 3.
import { DECK_SIZE } from './config.js';
import { createRandom } from './random.js';

const PLAIN_POWERS = {
  Ember: [1, 3, 5, 7],
  Tide: [1, 3, 5, 7],
  Leaf: [1, 3, 5, 7],
  Stone: [5, 6, 8, 9],
};

export function costForPower(power) {
  if (power <= 3) return 0;
  if (power <= 7) return 1;
  return 2;
}

function makeCard(id, suit, power, cost, sigil) {
  return { id, suit, power, cost, sigil };
}

/** Build one player's 24-card deck and shuffle it with `seed`. */
export function buildDeck(seed) {
  const cards = [];
  for (const suit of ['Ember', 'Tide', 'Leaf', 'Stone']) {
    const lower = suit.toLowerCase();
    for (const power of PLAIN_POWERS[suit]) {
      cards.push(makeCard(`${lower}-${power}`, suit, power, costForPower(power), false));
    }
    for (let n = 1; n <= 2; n += 1) {
      cards.push(makeCard(`${lower}-sigil-${n}`, suit, 3, 2, true));
    }
  }
  return shuffleDeck(cards, createRandom(seed));
}

/** Fisher-Yates with the given RNG; returns a NEW array, input untouched. */
export function shuffleDeck(cards, random) {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Move the top card of `deck` into `hand`. Empty deck -> null, no crash. */
export function drawCard(deck, hand) {
  if (deck.length === 0) return null;
  const card = deck.pop();
  hand.push(card);
  return card;
}

/** Move `card` into `discardPile`. */
export function discardCard(card, discardPile) {
  discardPile.push(card);
}

/**
 * When the deck is empty, shuffle the discard pile back into it.
 * An empty discard too leaves the deck empty (no crash, no infinite loop).
 */
export function reshuffleDiscardIntoDeck(deck, discardPile, random) {
  if (deck.length > 0 || discardPile.length === 0) return deck;
  const refilled = shuffleDeck(discardPile, random);
  discardPile.length = 0;
  deck.push(...refilled);
  return deck;
}

export { DECK_SIZE };
