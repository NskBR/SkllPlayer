const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// SkllPlayer brand colors
const COLORS = {
  background: '#0a0a0f',
  backgroundGradientEnd: '#12121a',
  accent: '#8b5cf6',
  accentDark: '#6d28d9',
  text: '#ffffff',
  textMuted: '#a1a1aa',
};

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Path to the app logo
const logoPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.png');

/**
 * Generate sidebar image (164x314 pixels)
 * This appears on the welcome and finish pages
 */
async function generateSidebarImage(logo) {
  const width = 164;
  const height = 314;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(1, COLORS.backgroundGradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Accent stripe on the right
  const stripeGradient = ctx.createLinearGradient(0, 0, 0, height);
  stripeGradient.addColorStop(0, COLORS.accent);
  stripeGradient.addColorStop(1, COLORS.accentDark);
  ctx.fillStyle = stripeGradient;
  ctx.fillRect(width - 4, 0, 4, height);

  // Draw the actual logo
  const logoSize = 80;
  const logoX = (width - logoSize) / 2;
  const logoY = 40;

  // Draw logo with slight glow effect
  ctx.shadowColor = COLORS.accent;
  ctx.shadowBlur = 20;
  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  ctx.shadowBlur = 0;

  // App name
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText('SkllPlayer', width / 2, logoY + logoSize + 25);

  // Version
  ctx.font = '11px Arial';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('v0.3.0', width / 2, logoY + logoSize + 45);

  // Decorative dots pattern
  ctx.fillStyle = COLORS.accent + '20';
  for (let y = 200; y < height - 40; y += 20) {
    for (let x = 30; x < width - 30; x += 20) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Bottom tagline
  ctx.font = '10px Arial';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Music Player', width / 2, height - 30);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(buildDir, 'installerSidebar.png'), buffer);

  console.log('Created installerSidebar.png (164x314)');
}

/**
 * Generate header image (150x57 pixels)
 * This appears on the installer pages header
 */
async function generateHeaderImage(logo) {
  const width = 150;
  const height = 57;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(1, COLORS.backgroundGradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw the actual logo
  const logoSize = 40;
  const logoX = 8;
  const logoY = (height - logoSize) / 2;
  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

  // App name
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'left';
  ctx.fillText('SkllPlayer', 55, height / 2 - 6);

  // Tagline
  ctx.font = '9px Arial';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Music Player', 55, height / 2 + 10);

  // Accent line at bottom
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, height - 2, width, 2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(buildDir, 'installerHeader.png'), buffer);

  console.log('Created installerHeader.png (150x57)');
}

/**
 * Generate uninstaller sidebar (same as installer but with red theme)
 */
async function generateUninstallerSidebarImage(logo) {
  const width = 164;
  const height = 314;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(1, COLORS.backgroundGradientEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Red accent stripe for uninstaller
  const stripeGradient = ctx.createLinearGradient(0, 0, 0, height);
  stripeGradient.addColorStop(0, '#ef4444');
  stripeGradient.addColorStop(1, '#dc2626');
  ctx.fillStyle = stripeGradient;
  ctx.fillRect(width - 4, 0, 4, height);

  // Draw the actual logo
  const logoSize = 80;
  const logoX = (width - logoSize) / 2;
  const logoY = 40;

  // Draw logo with red glow for uninstaller
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 20;
  ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  ctx.shadowBlur = 0;

  // App name
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText('SkllPlayer', width / 2, logoY + logoSize + 25);

  // Uninstall text
  ctx.font = '11px Arial';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('Desinstalar', width / 2, logoY + logoSize + 45);

  // Decorative dots pattern (red)
  ctx.fillStyle = '#ef444420';
  for (let y = 200; y < height - 40; y += 20) {
    for (let x = 30; x < width - 30; x += 20) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(buildDir, 'uninstallerSidebar.png'), buffer);

  console.log('Created uninstallerSidebar.png (164x314)');
}

// Generate all images
async function main() {
  console.log('Generating installer images...\n');

  // Load the app logo
  const logo = await loadImage(logoPath);
  console.log('Loaded app logo from:', logoPath);

  await generateSidebarImage(logo);
  await generateHeaderImage(logo);
  await generateUninstallerSidebarImage(logo);

  console.log('\nDone! Images saved to build/ directory');
}

main().catch(console.error);
