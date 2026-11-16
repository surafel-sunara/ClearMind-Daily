let audio: AudioContext | undefined;

export function playChime(kind: "tap" | "win", enabled: boolean): void {
  if (!enabled || typeof window.AudioContext !== "function") return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    const frequencies = kind === "win" ? [523.25, 659.25, 783.99] : [392];
    for (const [index, frequency] of frequencies.entries()) {
      const oscillator = audio.createOscillator();
      const volume = audio.createGain();
      const begins = audio.currentTime + index * 0.115;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0.0001, begins);
      volume.gain.exponentialRampToValueAtTime(kind === "win" ? 0.065 : 0.035, begins + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, begins + 0.22);
      oscillator.connect(volume);
      volume.connect(audio.destination);
      oscillator.start(begins);
      oscillator.stop(begins + 0.23);
    }
  } catch {
    // Silent play is fully functional when audio is unavailable.
  }
}
