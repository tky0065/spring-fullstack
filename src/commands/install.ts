import { execa } from 'execa';
import ora from 'ora';

export async function install() {
  const spinner = ora('Installation du CLI...').start();

  try {
    // Créer le lien symbolique global
    await execa('npm', ['link']);

    spinner.succeed('CLI installé avec succès !');
    console.log('\nVous pouvez maintenant utiliser la commande :');
    console.log('spring-fullstack new <nom-du-projet>');
  } catch (error) {
    spinner.fail('Erreur lors de l\'installation du CLI');
    console.error(error);
  }
} 