import { execa } from 'execa';
import ora from 'ora';

export async function list() {
  const spinner = ora('Récupération des versions des templates...').start();

  try {
    // Récupérer les tags du dépôt des templates
    const { stdout } = await execa('git', ['ls-remote', '--tags', 'https://github.com/your-org/spring-fullstack-template.git']);

    // Parser les versions
    const versions = stdout
      .split('\n')
      .map(line => line.split('\t')[1])
      .filter(tag => tag && tag.startsWith('refs/tags/'))
      .map(tag => tag.replace('refs/tags/', ''));

    spinner.succeed('Versions disponibles :');
    versions.forEach(version => console.log(`- ${version}`));
  } catch (error) {
    spinner.fail('Erreur lors de la récupération des versions');
    console.error(error);
  }
} 