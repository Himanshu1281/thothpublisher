// Text-to-speech through Azure AI Speech (official REST API, free F0 tier: 500k chars/month).
// Enabled when AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are set. Results are cached in memory
// so repeated lines (book text, Thoth's lines) cost nothing after the first time.
const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
export const ttsEnabled = !!(KEY && REGION);

const VOICES = { ar: 'ar-SA-ZariyahNeural', en: 'en-US-AnaNeural' }; // Ana = child-like English voice
const cache = new Map(); const MAX = 400;
const esc = s => s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

export async function synth(text, lang) {
  const key = lang + '|' + text;
  if (cache.has(key)) { const v = cache.get(key); cache.delete(key); cache.set(key, v); return v; }
  const voice = VOICES[lang];
  const rate = lang === 'ar' ? '-15%' : '-5%';
  const ssml = `<speak version="1.0" xml:lang="${lang === 'ar' ? 'ar-SA' : 'en-US'}"><voice name="${voice}"><prosody rate="${rate}">${esc(text)}</prosody></voice></speak>`;
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'thoth-story-worlds' },
    body: ssml,
  });
  if (!r.ok) throw new Error('azure_' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  cache.set(key, buf); if (cache.size > MAX) cache.delete(cache.keys().next().value);
  return buf;
}

// very small per-user limiter: 120 requests / 10 min
const hits = new Map();
export function allowed(uid) {
  const now = Date.now(); const arr = (hits.get(uid) || []).filter(t => now - t < 600000);
  if (arr.length >= 120) { hits.set(uid, arr); return false; }
  arr.push(now); hits.set(uid, arr); return true;
}
