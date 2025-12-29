const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
  // Only run for Windows builds
  if (context.electronPlatformName !== 'win32') {
    return;
  }

  const exePath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'icon.ico');

  if (fs.existsSync(exePath) && fs.existsSync(iconPath)) {
    console.log(`Applying icon to ${path.basename(exePath)}...`);
    try {
      await rcedit(exePath, {
        icon: iconPath,
        'version-string': {
          FileDescription: 'SkllPlayer',
          ProductName: 'SkllPlayer',
          CompanyName: 'SkellBR',
          LegalCopyright: 'MIT License',
          OriginalFilename: 'SkllPlayer.exe'
        },
        'file-version': '0.3.0',
        'product-version': '0.3.0'
      });
      console.log('Icon applied successfully!');
    } catch (err) {
      console.error('Failed to apply icon:', err.message);
    }
  } else {
    console.log('Executable or icon not found, skipping icon application.');
    console.log('  exe exists:', fs.existsSync(exePath));
    console.log('  icon exists:', fs.existsSync(iconPath));
  }
};
