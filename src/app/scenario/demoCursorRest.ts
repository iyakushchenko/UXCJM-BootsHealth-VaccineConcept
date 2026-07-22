/** Pure resting-position sampler for the shared robo-cursor engine. */

const REST_RIGHT_INSET_RATIO = 0.08;
const REST_Y_RATIO = 0.54;
const REST_DRIFT_PX = 20;

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function sampleDemoCursorRestPosition(
  viewportWidth: number,
  viewportHeight: number,
): { left: number; top: number } {
  const baseLeft = Math.round(viewportWidth * (1 - REST_RIGHT_INSET_RATIO) - 37);
  const baseTop = Math.round(viewportHeight * REST_Y_RATIO);
  const margin = 16;
  return {
    left: Math.round(Math.max(margin, Math.min(viewportWidth - 37 - margin, baseLeft + randomInRange(-REST_DRIFT_PX, REST_DRIFT_PX)))),
    top: Math.round(Math.max(margin, Math.min(viewportHeight - 40 - margin, baseTop + randomInRange(-REST_DRIFT_PX, REST_DRIFT_PX)))),
  };
}
