// Draws the mix cover — your face as a mood-coloured duotone, with the title
// on top — onto a canvas and returns it as a PNG, ready to save or share.
//
// It mirrors the on-screen .cover from mix.scss, but the duotone is computed
// by hand instead of with CSS blend modes or canvas filters, so the saved
// image looks identical in every browser.

const clamp01 = (v) => Math.min(1, Math.max(0, v));

function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the snapshot'));
    img.src = src;
  });
}

// Make sure Inter is ready before drawing text — but never let a missing
// font hang the download (the system font is used instead).
async function ensureFont() {
  try {
    if (document.fonts?.load) {
      await Promise.race([
        document.fonts.load('800 100px Inter'),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
  } catch {
    /* fall back to the system font */
  }
}

/**
 * Same result as the CSS on the cover:
 *   filter: grayscale(1) contrast(1.2) brightness(1.08)   → the photo
 *   mix-blend-mode: multiply onto the LIGHT tone           → whites become light
 *   a DARK layer with mix-blend-mode: lighten              → blacks lift to dark
 * Works in place on ImageData.
 */
export function applyDuotone(imageData, light, dark) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const contrasted = clamp01((gray - 0.5) * 1.2 + 0.5);
    const v = clamp01(contrasted * 1.08);
    d[i] = Math.max(v * light[0], dark[0]);
    d[i + 1] = Math.max(v * light[1], dark[1]);
    d[i + 2] = Math.max(v * light[2], dark[2]);
    d[i + 3] = 255;
  }
}

// Text with custom letter-spacing. Uses the native canvas property where it
// exists (keeps kerning), otherwise places the letters one by one.
export function drawTracked(ctx, text, x, y, tracking) {
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${tracking}px`;
    ctx.fillText(text, x, y);
    ctx.letterSpacing = '0px';
    return;
  }
  let cursor = x;
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + tracking;
  }
}

function trackedWidth(ctx, text, tracking) {
  return ctx.measureText(text).width + tracking * text.length;
}

/**
 * @param {object} o
 * @param {string|null} o.snapshot  data-URL of the captured camera frame (square)
 * @param {string} o.title          e.g. "Sad Mix"
 * @param {string} o.light          light tone of the mood palette, e.g. "#a9c0ff"
 * @param {string} o.dark           dark tone,  e.g. "#142048"
 * @param {number} [o.size]         output size in px (square), default 1080
 * @returns {Promise<Blob>} PNG
 */
export async function renderCoverBlob({ snapshot, title, light, dark, size = 1080 }) {
  await ensureFont();

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const L = hexToRgb(light);
  const D = hexToRgb(dark);
  const k = size / 232; // the on-screen cover is 232px at its largest; everything scales from that

  if (snapshot) {
    const img = await loadImage(snapshot);
    ctx.drawImage(img, 0, 0, size, size);
    const pixels = ctx.getImageData(0, 0, size, size);
    applyDuotone(pixels, L, D);
    ctx.putImageData(pixels, 0, 0);
  } else {
    // no photo: same fallback as the page — a 160deg light → dark gradient
    const angle = (160 * Math.PI) / 180;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const half = (size * (Math.abs(dx) + Math.abs(dy))) / 2;
    const c = size / 2;
    const g = ctx.createLinearGradient(c - dx * half, c - dy * half, c + dx * half, c + dy * half);
    g.addColorStop(0, `rgb(${L.join(',')})`);
    g.addColorStop(1, `rgb(${D.join(',')})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  // scrim: a little dark at the top, a lot at the bottom, so the text reads
  const scrim = ctx.createLinearGradient(0, 0, 0, size);
  scrim.addColorStop(0, 'rgba(0,0,0,0.2)');
  scrim.addColorStop(0.32, 'rgba(0,0,0,0)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.64)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, size, size);

  const sans = "Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  ctx.textBaseline = 'alphabetic';

  // brand, top-left
  const brandSize = 10 * k;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `800 ${brandSize}px ${sans}`;
  drawTracked(ctx, 'MOODIFY', 14 * k, 12 * k + brandSize * 0.8, 0.16 * brandSize);

  // title, bottom-left, on two lines: "Sad" / "Mix"
  const words = String(title).trim().split(/\s+/);
  const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [words[0]];
  const maxWidth = size - 28 * k;

  let fontSize = 42 * k;
  ctx.font = `800 ${fontSize}px ${sans}`;
  while (fontSize > 18 * k && Math.max(...lines.map((l) => trackedWidth(ctx, l, -0.045 * fontSize))) > maxWidth) {
    fontSize *= 0.95;
    ctx.font = `800 ${fontSize}px ${sans}`;
  }

  ctx.fillStyle = '#ffffff';
  const lineHeight = 0.95 * fontSize;
  const lastBaseline = size - 12 * k - 0.111 * fontSize;
  lines.forEach((line, i) => {
    const y = lastBaseline - (lines.length - 1 - i) * lineHeight;
    drawTracked(ctx, line, 14 * k, y, -0.045 * fontSize);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image'))),
      'image/png'
    );
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}