// Shared window event names so the two independent audio systems (the
// generative SoundEngine and the real-track player) can duck out of each
// other's way without importing one another.
export const TRACK_PLAYER_START_EVENT = 'anahata:track-player-start';
export const SOUND_ENGINE_START_EVENT = 'anahata:sound-engine-start';
