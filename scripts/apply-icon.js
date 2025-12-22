const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

const releaseDir = path.join(__dirname, '..', 'release');
const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.ico');

async function applyIcon() {
  console.log('Applying custom icon to executables...');

  const exePaths = [
    path.join(releaseDir, 'win-unpacked', 'SkllPlayer.exe'),
  ];

  // Find portable exe
  const files = fs.readdirSync(releaseDir);
  for (const file of files) {
    if (file.startsWith('SkllPlayer-Portable') && file.endsWith('.exe')) {
      exePaths.push(path.join(releaseDir, file));
    }
  }

  for (const exePath of exePaths) {
    if (fs.existsSync(exePath)) {
      try {
        console.log(`Updating icon for: ${path.basename(exePath)}`);
        await rcedit(exePath, { icon: iconPath });
        console.log(`  ✓ Success`);
      } catch (err) {
        console.error(`  ✗ Failed: ${err.message}`);
      }
    }
  }

  console.log('Done!');
}

applyIcon();
