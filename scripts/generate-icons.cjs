const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="50%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded rectangle -->
  <rect width="512" height="512" rx="112" fill="url(#grad1)" />
  
  <!-- Outer subtle circuit rings -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="8 8" opacity="0.4" />
  <circle cx="256" cy="256" r="210" fill="none" stroke="#818cf8" stroke-width="1.5" opacity="0.25" />

  <!-- Chat Connect Peer Hexagonal Shield / Message Symbol -->
  <path d="M140 180 C140 140 170 120 220 120 L292 120 C342 120 372 140 372 180 L372 260 C372 300 342 320 292 320 L230 320 L160 370 L175 320 L140 320 C140 320 140 300 140 260 Z"
        fill="url(#grad2)"
        filter="url(#glow)"
        opacity="0.95" />

  <!-- Inner peer network nodes -->
  <circle cx="210" cy="220" r="18" fill="#ffffff" />
  <circle cx="260" cy="200" r="14" fill="#38bdf8" />
  <circle cx="305" cy="235" r="16" fill="#ffffff" />

  <!-- Connecting data links -->
  <line x1="210" y1="220" x2="260" y2="200" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="260" y1="200" x2="305" y2="235" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <line x1="210" y1="220" x2="305" y2="235" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="4 4" />

  <!-- Sub-label brand glyph indicator -->
  <rect x="206" y="420" width="100" height="8" rx="4" fill="#38bdf8" opacity="0.8" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(toCrc), 8 + len);
  return chunk;
}

function generatePngBuffer(width, height) {
  // 8-byte signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // Raw scanlines: width * 4 + 1 filter byte per line
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  
  const cx = width / 2;
  const cy = height / 2;
  const rOuter = width * 0.44;
  const rInner = width * 0.25;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient
      const ratioY = y / height;
      let r = Math.round(2 + ratioY * 13);
      let g = Math.round(132 - ratioY * 110);
      let b = Math.round(199 - ratioY * 160);
      let a = 255;

      // Rounded app icon shape
      const rx = Math.abs(x - cx);
      const ry = Math.abs(y - cy);
      const maxCorner = width * 0.44;
      const cornerR = width * 0.18;
      
      // If outside rounded square, transparent
      if (rx > maxCorner || ry > maxCorner) {
        a = 0;
      } else if (rx > maxCorner - cornerR && ry > maxCorner - cornerR) {
        const cdx = rx - (maxCorner - cornerR);
        const cdy = ry - (maxCorner - cornerR);
        if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerR) {
          a = 0;
        }
      }

      if (a > 0) {
        // Chat glyph inside
        if (dist < rInner) {
          // Inner core
          r = 56;
          g = 189;
          b = 248;
        } else if (Math.abs(dist - rOuter * 0.75) < width * 0.02) {
          // Accent ring
          r = 129;
          g = 140;
          b = 248;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const idatChunk = createPngChunk('IDAT', deflated);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const png192 = generatePngBuffer(192, 192);
const png512 = generatePngBuffer(512, 512);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePngBuffer(32, 32));

console.log('Successfully generated public icons: icon.svg, pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png, apple-touch-icon.png, favicon.ico');
