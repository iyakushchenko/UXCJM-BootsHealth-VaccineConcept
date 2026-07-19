/** One-shot control-room press flash — synced with studio step diode (300ms). */
export const CONTROL_ROOM_TAP_MS = 300;

export function flashControlRoomButton(
  button: HTMLButtonElement,
  tapClass: string
): void {
  button.blur();
  button.classList.add(tapClass);
  window.setTimeout(() => {
    button.classList.remove(tapClass);
  }, CONTROL_ROOM_TAP_MS);
}
