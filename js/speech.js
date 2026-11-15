// Voice-to-text helper.
//
// Honest about platform limits:
//   - On Android Chrome / desktop Chrome the Web Speech API (SpeechRecognition)
//     is available, so we can live-transcribe straight into the editor.
//   - On iOS Safari there is NO reliable programmatic SpeechRecognition. The
//     realistic path there is native keyboard dictation: we focus the editor
//     and the user taps the 🎤 on the iOS keyboard. We surface a hint saying so.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export function speechSupported() {
  // iOS Safari technically exposes webkitSpeechRecognition on some versions but
  // it is unreliable; treat iOS as "use keyboard dictation".
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return !!SR && !isIOS;
}

export function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Start continuous recognition. Calls onText(finalChunk) for each finalized
// phrase and onInterim(text) for the live partial. Returns a stop() function.
export function startDictation({ onText, onInterim, onEnd, onError }) {
  if (!SR) { onError && onError(new Error('unsupported')); return () => {}; }
  const rec = new SR();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = navigator.language || 'en-US';

  rec.onresult = (ev) => {
    let interim = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      if (res.isFinal) onText && onText(res[0].transcript);
      else interim += res[0].transcript;
    }
    onInterim && onInterim(interim);
  };
  rec.onerror = (e) => onError && onError(e);
  rec.onend = () => onEnd && onEnd();

  try { rec.start(); } catch (e) { onError && onError(e); }
  return () => { try { rec.stop(); } catch { /* ignore */ } };
}
