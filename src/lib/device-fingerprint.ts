'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Device Fingerprinting Utility for SynthTrade Pro
// Generates a unique device identifier using browser characteristics
// ═══════════════════════════════════════════════════════════════════════════

const FINGERPRINT_CACHE_KEY = 'stp_device_fp';
const DEVICE_INFO_CACHE_KEY = 'stp_device_info';

export interface DeviceInfo {
  platform: string;
  language: string;
  hardwareConcurrency: number | string;
  deviceMemory: number | string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  timezone: string;
  userAgent: string;
  webglRenderer: string;
  webglVendor: string;
}

/**
 * Simple hash function (djb2 variant with 64-bit-like output)
 * Produces a consistent hex string from any input string
 */
function simpleHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const combined = (h2 >>> 0).toString(16).padStart(8, '0') +
                   (h1 >>> 0).toString(16).padStart(8, '0');
  return combined.toUpperCase();
}

/**
 * Get Canvas fingerprint
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('SynthTrade Pro 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('A2K Digital Studio', 4, 35);

    return canvas.toDataURL();
  } catch {
    return 'canvas-error';
  }
}

/**
 * Get WebGL renderer info
 */
function getWebGLInfo(): { renderer: string; vendor: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { renderer: 'no-webgl', vendor: 'no-webgl' };

    const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!ext) return { renderer: 'no-ext', vendor: 'no-ext' };

    const renderer = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL);
    const vendor = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_VENDOR_WEBGL);
    return {
      renderer: typeof renderer === 'string' ? renderer : 'unknown',
      vendor: typeof vendor === 'string' ? vendor : 'unknown',
    };
  } catch {
    return { renderer: 'webgl-error', vendor: 'webgl-error' };
  }
}

/**
 * Get AudioContext fingerprint
 */
function getAudioFingerprint(): string {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return 'no-audio';

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();
    const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);

    gain.gain.value = 0; // mute
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, ctx.currentTime);

    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(0);

    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);

    oscillator.stop();
    ctx.close();

    // Hash the first 50 values
    const sample = data.slice(0, 50).map(v => v.toFixed(2)).join(',');
    return sample;
  } catch {
    return 'audio-error';
  }
}

/**
 * Get readable device info
 */
function collectDeviceInfo(): DeviceInfo {
  const nav = navigator as any;
  const webgl = getWebGLInfo();

  return {
    platform: nav.platform || 'unknown',
    language: nav.language || 'unknown',
    hardwareConcurrency: nav.hardwareConcurrency || 'N/A',
    deviceMemory: nav.deviceMemory || 'N/A',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: nav.userAgent.substring(0, 120),
    webglRenderer: webgl.renderer,
    webglVendor: webgl.vendor,
  };
}

/**
 * Generate the device fingerprint by combining all signals
 */
function generateFingerprint(info: DeviceInfo, canvas: string, audio: string): string {
  const components = [
    info.platform,
    info.language,
    info.hardwareConcurrency.toString(),
    info.deviceMemory.toString(),
    info.screenWidth.toString(),
    info.screenHeight.toString(),
    info.colorDepth.toString(),
    info.timezone,
    info.webglRenderer,
    info.webglVendor,
    canvas.substring(0, 200),
    audio.substring(0, 200),
  ];

  const combined = components.join('|||');
  return simpleHash(combined);
}

/**
 * Get the device fingerprint (cached in localStorage)
 */
export async function getDeviceFingerprint(): Promise<string> {
  // Check cache first
  if (typeof window === 'undefined') return 'server-side';
  
  const cached = localStorage.getItem(FINGERPRINT_CACHE_KEY);
  if (cached) return cached;

  // Generate new fingerprint
  const info = collectDeviceInfo();
  const canvas = getCanvasFingerprint();
  const audio = getAudioFingerprint();
  const fingerprint = generateFingerprint(info, canvas, audio);

  // Cache it
  localStorage.setItem(FINGERPRINT_CACHE_KEY, fingerprint);
  
  // Also cache device info
  localStorage.setItem(DEVICE_INFO_CACHE_KEY, JSON.stringify(info));

  return fingerprint;
}

/**
 * Get device info (cached in localStorage)
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (typeof window === 'undefined') {
    return {
      platform: 'server', language: 'en', hardwareConcurrency: 'N/A',
      deviceMemory: 'N/A', screenWidth: 0, screenHeight: 0, colorDepth: 0,
      timezone: 'UTC', userAgent: '', webglRenderer: '', webglVendor: '',
    };
  }

  const cached = localStorage.getItem(DEVICE_INFO_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  // Generate device info (this also caches fingerprint)
  const info = collectDeviceInfo();
  localStorage.setItem(DEVICE_INFO_CACHE_KEY, JSON.stringify(info));
  return info;
}

/**
 * Clear cached fingerprint (for testing / device change)
 */
export function clearFingerprintCache(): void {
  localStorage.removeItem(FINGERPRINT_CACHE_KEY);
  localStorage.removeItem(DEVICE_INFO_CACHE_KEY);
}
