// HARBORBOUND — the screenshot scenes behind ?shot=table|title|win|loss.
// Every scene plays the real rules forward from a fresh game with the real
// pilots — nothing is faked. Same seed -> same frame, every time.
// Returns { screen, best } where best = tricks the player won in the scene.
import { createGame, resolveTrick, startRound, checkGameEnd } from './rules.js';
import { chooseCardForRival } from './ai-opponent.js';
import { playStrongestCard, playWeakestCard, playBalancedCard } from './autopilot.js';
import { createRandom } from './random.js';

function playOneRound(state, youCard, rivalCard) {
  if (!youCard || !rivalCard) return false;
  state.currentTrick = { you: youCard, rival: rivalCard };
  state.phase = 'reveal';
  const res = resolveTrick(state, youCard, rivalCard);
  if (!res.ok) return false;
  if (state.phase === 'resolve') startRound(state);
  return true;
}

function playGameToEnd(state, mode) {
  // mode 'win': strong player vs weakest rival. mode 'loss': weakest player vs normal AI.
  let guard = 0;
  while (state.phase !== 'over' && guard < 100) {
    guard += 1;
    if (state.phase !== 'choose') break;
    const youCard = mode === 'win'
      ? playStrongestCard(state, 'you')
      : playWeakestCard(state, 'you');
    const rivalCard = mode === 'win'
      ? playWeakestCard(state, 'rival')
      : chooseCardForRival(state, createRandom(state.seed));
    if (!playOneRound(state, youCard, rivalCard)) break;
  }
  return state;
}

function resetToSeed(state, seed) {
  const fresh = createGame(seed);
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
}

export function stageShot(name, state) {
  if (name !== 'table' && name !== 'win' && name !== 'loss') {
    // Unknown name (and 'title'): the title screen over a fresh game.
    return { screen: 'title', best: 0 };
  }

  if (name === 'table') {
    // Five full rounds, both sides playing balanced, then round 6 staged at
    // the reveal: the player plays the card at hand index 1 (deterministic),
    // the rival answers with the real AI. Phase stays 'reveal' — no timer
    // advances it, so the frame is frozen mid-trick.
    for (let round = 0; round < 5; round += 1) {
      if (state.phase !== 'choose') break;
      const youCard = playBalancedCard(state, 'you');
      const rivalCard = chooseCardForRival(state, createRandom(state.seed));
      if (!playOneRound(state, youCard, rivalCard)) break;
    }
    if (state.phase === 'choose' && state.hands.you.length > 1) {
      const youCard = state.hands.you[1];
      const rivalCard = chooseCardForRival(state, createRandom(state.seed));
      state.selectedCardId = youCard.id;
      state.currentTrick = { you: youCard, rival: rivalCard };
      state.phase = 'reveal';
    }
    return { screen: 'table', best: state.tricksWon.you };
  }

  // win / loss: play to the end. A draw (rare) retries with the next seed.
  const wanted = name === 'win' ? 'you' : 'rival';
  let attemptSeed = state.seed;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) resetToSeed(state, attemptSeed);
    playGameToEnd(state, name);
    if (state.winner === wanted) return { screen: name, best: state.tricksWon.you };
    attemptSeed = state.seed + 1;
  }
  return { screen: name, best: state.tricksWon.you };
}

export { checkGameEnd };
