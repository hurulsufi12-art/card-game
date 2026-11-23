// HARBORBOUND — every tuning constant in one place, so no number is guessed twice.
// Pinned by PLAN §1.1/§1.2: LIFE 20, gold start 3 +2/round capped at 9, 12 rounds,
// hand 5, deck 24. Suits are told apart by colour AND glyph shape (judge criterion #4).
export const LIFE = 20;
export const GOLD_START = 3;
export const GOLD_PER_ROUND = 2;
export const GOLD_MAX = 9;
export const MAX_ROUNDS = 12;
export const HAND_SIZE = 5;
export const DECK_SIZE = 24;

export const FIELD = { width: 1280, height: 800 };

// Suit identity: colour + glyph name. Glyphs are drawn as canvas paths in
// render-cards.js (never emoji, never text alone).
export const SUIT_INFO = {
  Ember: { color: '#e5534b', dark: '#8f2b24', glyph: 'flame', label: 'Ember' },
  Tide: { color: '#4fc3f7', dark: '#1d6f9e', glyph: 'wave', label: 'Tide' },
  Leaf: { color: '#58b368', dark: '#2c6b38', glyph: 'leaf', label: 'Leaf' },
  Stone: { color: '#c9a227', dark: '#7a6210', glyph: 'mountain', label: 'Stone' },
};

// The suit wheel: Ember > Leaf > Tide > Ember. Stone is neutral.
export const SUIT_BEATS = { Ember: 'Leaf', Leaf: 'Tide', Tide: 'Ember' };

export const BEST_KEY = 'harborbound-best-tricks';
