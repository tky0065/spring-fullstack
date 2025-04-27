import { spawn } from 'child_process';

export async function installGlobally(): Promise<void> {
  try {
    await new Promise((resolve, reject) => {
      const npm = spawn('npm', ['link'], { stdio: 'inherit' });
      npm.on('close', (code) => {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`npm link failed with code ${code}`));
        }
      });
    });
    
    console.log('Package installed globally successfully!');
  } catch (error) {
    console.error('Error installing package globally:', error);
    process.exit(1);
  }
} 