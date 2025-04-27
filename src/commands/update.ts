import { spawn } from 'child_process';

export async function updatePackage(): Promise<void> {
  try {
    await new Promise((resolve, reject) => {
      const npm = spawn('npm', ['update', '-g', 'spring-fullstack'], { stdio: 'inherit' });
      npm.on('close', (code) => {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`npm update failed with code ${code}`));
        }
      });
    });
    
    console.log('Package updated successfully!');
  } catch (error) {
    console.error('Error updating package:', error);
    process.exit(1);
  }
} 