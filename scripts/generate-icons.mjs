import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')

// SVG base: dumbbell icon with gym theme
const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#09090b"/>
  <g transform="translate(256,256)" stroke="#fafafa" stroke-width="24" stroke-linecap="round" fill="none">
    <!-- barbell bar -->
    <line x1="-140" y1="0" x2="140" y2="0"/>
    <!-- left weights -->
    <rect x="-160" y="-60" width="40" height="120" rx="8" fill="#fafafa"/>
    <rect x="-190" y="-45" width="30" height="90" rx="6" fill="#a1a1aa"/>
    <!-- right weights -->
    <rect x="120" y="-60" width="40" height="120" rx="8" fill="#fafafa"/>
    <rect x="160" y="-45" width="30" height="90" rx="6" fill="#a1a1aa"/>
  </g>
  <text x="256" y="420" text-anchor="middle" fill="#fafafa" font-family="system-ui,sans-serif" font-size="56" font-weight="700">GR</text>
</svg>`

const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#09090b"/>
  <g transform="translate(256,256)" stroke="#fafafa" stroke-width="20" stroke-linecap="round" fill="none">
    <line x1="-110" y1="0" x2="110" y2="0"/>
    <rect x="-130" y="-48" width="34" height="96" rx="6" fill="#fafafa"/>
    <rect x="-156" y="-36" width="26" height="72" rx="5" fill="#a1a1aa"/>
    <rect x="96" y="-48" width="34" height="96" rx="6" fill="#fafafa"/>
    <rect x="130" y="-36" width="26" height="72" rx="5" fill="#a1a1aa"/>
  </g>
  <text x="256" y="370" text-anchor="middle" fill="#fafafa" font-family="system-ui,sans-serif" font-size="44" font-weight="700">GR</text>
</svg>`

const sizes = [192, 512]

async function generate() {
  for (const size of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(join(outDir, `icon-${size}.png`))

    await sharp(Buffer.from(maskableSvg))
      .resize(size, size)
      .png()
      .toFile(join(outDir, `icon-maskable-${size}.png`))
  }

  // Apple touch icon (180x180)
  await sharp(Buffer.from(svg))
    .resize(180, 180)
    .png()
    .toFile(join(outDir, '..', 'apple-touch-icon.png'))

  // Favicon 32x32
  await sharp(Buffer.from(svg))
    .resize(32, 32)
    .png()
    .toFile(join(outDir, '..', 'favicon.ico'))

  console.log('Icons generated!')
}

generate()
