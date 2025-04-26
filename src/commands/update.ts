import { execa } from 'execa';
import ora from 'ora';

export async function update() {
  const spinner = ora('Mise à jour du CLI...').start();

  try {
    // Mettre à jour le package globalement
    await execa('npm', ['update', '-g', 'spring-fullstack']);

    spinner.succeed('CLI mis à jour avec succès !');
  } catch (error) {
    spinner.fail('Erreur lors de la mise à jour du CLI');
    console.error(error);
  }
} 