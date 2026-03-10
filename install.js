const { execSync } = require('child_process');

console.log('Starting explicit NPM installation...');
try {
    execSync('npm install @capacitor/camera@8.0.2 --no-fund --no-audit', { stdio: 'inherit' });
    console.log('Installation fully completed without errors.');
} catch (error) {
    console.error("Installation threw an error:", error.message);
    process.exit(1);
}
