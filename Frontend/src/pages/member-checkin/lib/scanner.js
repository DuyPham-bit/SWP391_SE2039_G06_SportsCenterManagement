/**
 * Extracts a clean member identifier from decoded QR code data.
 * Supports plain string (MEM-00001), JSON objects, and URLs with query parameters.
 */
export function extractMemberIdentifier(scannedText) {
  if (!scannedText) return '';
  const text = String(scannedText).trim();

  // Handle JSON encoded QR
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.memberCode) return String(parsed.memberCode).trim();
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.code) return String(parsed.code).trim();
      if (parsed.identifier) return String(parsed.identifier).trim();
    } catch {
      // not json, fall back
    }
  }

  // Handle URL with query params (e.g. https://domain.com/#/checkin?code=MEM-00001)
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text);
      const q = url.searchParams.get('query') || url.searchParams.get('code') || url.searchParams.get('memberCode') || url.searchParams.get('id');
      if (q) return q.trim();
    } catch {
      // fall back
    }
  }

  return text;
}

/**
 * Plays a POS/turnstile scanner chime using Web Audio API.
 */
export function playScannerBeep(isSuccess = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Olympic turnstile pleasant chime (B5 -> E6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Low warning tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio gesture policy fallback
  }
}
