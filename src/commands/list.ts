import { spawn } from 'child_process';

export async function listTemplates(): Promise<void> {
  try {
    const git = spawn('git', ['ls-remote', '--tags', 'https://github.com/your-org/spring-fullstack-template.git']);
    
    let stdout = '';
    git.stdout.on('data', (data) => {
      stdout += data;
    });
    
    await new Promise((resolve, reject) => {
      git.on('close', (code) => {
        if (code === 0) {
          resolve(undefined);
        } else {
          reject(new Error(`git command failed with code ${code}`));
        }
      });
    });
    
    const versions = stdout
      .split('\n')
      .filter(Boolean)
      .map(line => line.split('/').pop() || '');
    
    console.log('Available templates:');
    versions.forEach(version => console.log(`- ${version}`));
  } catch (error) {
    console.error('Error listing templates:', error);
    process.exit(1);
  }
} 