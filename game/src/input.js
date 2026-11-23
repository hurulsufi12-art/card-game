// HARBORBOUND — mouse + keyboard input. The game loop polls this once per
// frame: takeActions() for buttons, takeClicks() for canvas clicks in logical
// 1280x800 coordinates, takeDigits() for the 1-5 hand shortcuts.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

export function createInput(canvas) {
  let actions = 0;
  let clicks = [];
  let digits = [];

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 800,
    };
  }

  canvas.addEventListener('click', (event) => {
    clicks.push(toLogical(event));
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (key === 'p' || key === 'P') {
      actions |= ACTION_PAUSE;
    } else if (key === 'm' || key === 'M') {
      actions |= ACTION_MUTE;
    } else if (key >= '1' && key <= '5') {
      digits.push(Number(key) - 1);
    }
  });

  return {
    takeActions() {
      const out = actions;
      actions = 0;
      return out;
    },
    takeClicks() {
      const out = clicks;
      clicks = [];
      return out;
    },
    takeDigits() {
      const out = digits;
      digits = [];
      return out;
    },
  };
}
