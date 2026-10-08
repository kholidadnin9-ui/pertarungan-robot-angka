/**
 * Runtime black-background removal.
 * Source robot art has a pure-black backdrop. We flood-fill the connected dark
 * region that touches the image border, make it fully transparent, then feather
 * the edge (with un-premultiply) so there is no dark halo.
 * Results are cached as PNG object URLs.
 */

import { useEffect, useState } from 'react';

const MAX_DIM = 780;
const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function keyOut(p: Uint8ClampedArray, w: number, h: number) {
  const n = w * h;
  const bg = new Uint8Array(n);
  const stack = new Int32Array(n);
  let sp = 0;
  const SEED = 26; // luminance below this = possible background

  const push = (i: number) => {
    if (bg[i]) return;
    const o = i << 2;
    const lum = 0.2126 * p[o] + 0.7152 * p[o + 1] + 0.0722 * p[o + 2];
    if (lum > SEED) return;
    bg[i] = 1;
    stack[sp++] = i;
  };

  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }

  while (sp > 0) {
    const i = stack[--sp];
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (y > 0) push(i - w);
    if (y < h - 1) push(i + w);
  }

  const rampLo = 10;
  const rampHi = 78;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const o = i << 2;
      if (bg[i]) {
        p[o + 3] = 0;
        continue;
      }
      const edge =
        (x > 0 && bg[i - 1]) ||
        (x < w - 1 && bg[i + 1]) ||
        (y > 0 && bg[i - w]) ||
        (y < h - 1 && bg[i + w]);
      if (!edge) continue;

      const lum = 0.2126 * p[o] + 0.7152 * p[o + 1] + 0.0722 * p[o + 2];
      let a = (lum - rampLo) / (rampHi - rampLo);
      if (a <= 0) {
        p[o + 3] = 0;
        continue;
      }
      if (a > 1) a = 1;
      a = a * a * (3 - 2 * a); // smoothstep
      p[o + 3] = (a * 255) | 0;

      if (a < 0.94) {
        // un-premultiply against black to kill the dark fringe
        const inv = 1 / Math.max(a, 0.2);
        p[o] = Math.min(255, p[o] * inv);
        p[o + 1] = Math.min(255, p[o + 1] * inv);
        p[o + 2] = Math.min(255, p[o + 2] * inv);
      }
    }
  }
}

function process(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        if (!nw || !nh) return reject(new Error('bad size'));
        const scale = Math.min(1, MAX_DIM / Math.max(nw, nh));
        const w = Math.max(1, Math.round(nw * scale));
        const h = Math.max(1, Math.round(nh * scale));

        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        if (!cx) return reject(new Error('no 2d'));
        cx.drawImage(img, 0, 0, w, h);

        const id = cx.getImageData(0, 0, w, h);
        keyOut(id.data, w, h);
        cx.putImageData(id, 0, 0);

        cv.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('blob failed'));
            resolve(URL.createObjectURL(blob));
          },
          'image/png',
        );
      } catch (e) {
        reject(e as Error);
      }
    };
    img.onerror = () => reject(new Error('load failed: ' + src));
    img.src = src;
  });
}

export function transparentUrl(src: string): Promise<string> {
  const hit = cache.get(src);
  if (hit) return Promise.resolve(hit);
  const running = pending.get(src);
  if (running) return running;
  const task = process(src)
    .then((url) => {
      cache.set(src, url);
      pending.delete(src);
      return url;
    })
    .catch((e) => {
      pending.delete(src);
      throw e;
    });
  pending.set(src, task);
  return task;
}

/** Warm the cache without blocking the UI. */
export function preloadTransparent(srcs: string[]) {
  srcs.forEach((s) => {
    transparentUrl(s).catch(() => {});
  });
}

/** React hook: returns the transparent object URL (or null while processing). */
export function useTransparent(src: string | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    src ? cache.get(src) ?? null : null,
  );

  useEffect(() => {
    if (!src) {
      setUrl(null);
      return;
    }
    const hit = cache.get(src);
    if (hit) {
      setUrl(hit);
      return;
    }
    setUrl(null);
    let alive = true;
    transparentUrl(src)
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src]);

  return url;
}
