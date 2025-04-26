import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupI18n(projectPath: string, config: ProjectConfig) {
  await setupBackendI18n(projectPath, config);
  await setupFrontendI18n(projectPath, config);
}

async function setupBackendI18n(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  const i18nPath = path.join(resourcesPath, 'i18n');
  
  // Create messages.properties (default language)
  const defaultMessages = `
# Common
common.error=An error occurred
common.success=Operation successful
common.not_found=Resource not found
common.unauthorized=Unauthorized access
common.forbidden=Access forbidden

# Authentication
auth.login.success=Login successful
auth.login.failed=Invalid credentials
auth.logout.success=Logout successful
auth.register.success=Registration successful
auth.register.failed=Registration failed
auth.token.expired=Session expired
auth.token.invalid=Invalid token

# User Management
user.create.success=User created successfully
user.create.failed=Failed to create user
user.update.success=User updated successfully
user.update.failed=Failed to update user
user.delete.success=User deleted successfully
user.delete.failed=Failed to delete user
user.not_found=User not found
user.already_exists=User already exists

# Validation
validation.required={0} is required
validation.email.invalid=Invalid email format
validation.password.weak=Password is too weak
validation.password.mismatch=Passwords do not match
`;

  await fs.writeFile(
    path.join(i18nPath, 'messages.properties'),
    defaultMessages
  );
  
  // Create messages_fr.properties (French)
  const frenchMessages = `
# Common
common.error=Une erreur est survenue
common.success=Opération réussie
common.not_found=Ressource non trouvée
common.unauthorized=Accès non autorisé
common.forbidden=Accès interdit

# Authentication
auth.login.success=Connexion réussie
auth.login.failed=Identifiants invalides
auth.logout.success=Déconnexion réussie
auth.register.success=Inscription réussie
auth.register.failed=Échec de l'inscription
auth.token.expired=Session expirée
auth.token.invalid=Token invalide

# User Management
user.create.success=Utilisateur créé avec succès
user.create.failed=Échec de la création de l'utilisateur
user.update.success=Utilisateur mis à jour avec succès
user.update.failed=Échec de la mise à jour de l'utilisateur
user.delete.success=Utilisateur supprimé avec succès
user.delete.failed=Échec de la suppression de l'utilisateur
user.not_found=Utilisateur non trouvé
user.already_exists=Utilisateur déjà existant

# Validation
validation.required={0} est requis
validation.email.invalid=Format d'email invalide
validation.password.weak=Mot de passe trop faible
validation.password.mismatch=Les mots de passe ne correspondent pas
`;

  await fs.writeFile(
    path.join(i18nPath, 'messages_fr.properties'),
    frenchMessages
  );
  
  // Create MessageSource configuration
  const messageSourceConfig = `
package com.${config.projectName.toLowerCase()}.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.Locale;

@Configuration
public class MessageSourceConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("i18n/messages");
        messageSource.setDefaultEncoding("UTF-8");
        return messageSource;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.ENGLISH);
        return resolver;
    }
}
`;

  await fs.writeFile(
    path.join(backendPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'config', 'MessageSourceConfig.java'),
    messageSourceConfig
  );
}

async function setupFrontendI18n(projectPath: string, config: ProjectConfig) {
  const frontendPath = path.join(projectPath, 'frontend');
  const i18nPath = path.join(frontendPath, 'src', 'i18n');
  
  // Create i18n configuration
  const i18nConfig = `
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Common
      common: {
        error: 'An error occurred',
        success: 'Operation successful',
        not_found: 'Resource not found',
        unauthorized: 'Unauthorized access',
        forbidden: 'Access forbidden'
      },
      // Authentication
      auth: {
        login: {
          success: 'Login successful',
          failed: 'Invalid credentials'
        },
        logout: {
          success: 'Logout successful'
        },
        register: {
          success: 'Registration successful',
          failed: 'Registration failed'
        },
        token: {
          expired: 'Session expired',
          invalid: 'Invalid token'
        }
      },
      // User Management
      user: {
        create: {
          success: 'User created successfully',
          failed: 'Failed to create user'
        },
        update: {
          success: 'User updated successfully',
          failed: 'Failed to update user'
        },
        delete: {
          success: 'User deleted successfully',
          failed: 'Failed to delete user'
        },
        not_found: 'User not found',
        already_exists: 'User already exists'
      },
      // Validation
      validation: {
        required: '{{field}} is required',
        email: {
          invalid: 'Invalid email format'
        },
        password: {
          weak: 'Password is too weak',
          mismatch: 'Passwords do not match'
        }
      }
    }
  },
  fr: {
    translation: {
      // Common
      common: {
        error: 'Une erreur est survenue',
        success: 'Opération réussie',
        not_found: 'Ressource non trouvée',
        unauthorized: 'Accès non autorisé',
        forbidden: 'Accès interdit'
      },
      // Authentication
      auth: {
        login: {
          success: 'Connexion réussie',
          failed: 'Identifiants invalides'
        },
        logout: {
          success: 'Déconnexion réussie'
        },
        register: {
          success: 'Inscription réussie',
          failed: 'Échec de l\'inscription'
        },
        token: {
          expired: 'Session expirée',
          invalid: 'Token invalide'
        }
      },
      // User Management
      user: {
        create: {
          success: 'Utilisateur créé avec succès',
          failed: 'Échec de la création de l\'utilisateur'
        },
        update: {
          success: 'Utilisateur mis à jour avec succès',
          failed: 'Échec de la mise à jour de l\'utilisateur'
        },
        delete: {
          success: 'Utilisateur supprimé avec succès',
          failed: 'Échec de la suppression de l\'utilisateur'
        },
        not_found: 'Utilisateur non trouvé',
        already_exists: 'Utilisateur déjà existant'
      },
      // Validation
      validation: {
        required: '{{field}} est requis',
        email: {
          invalid: 'Format d\'email invalide'
        },
        password: {
          weak: 'Mot de passe trop faible',
          mismatch: 'Les mots de passe ne correspondent pas'
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
`;

  await fs.writeFile(
    path.join(i18nPath, 'index.ts'),
    i18nConfig
  );
  
  // Create language selector component
  const languageSelector = `
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@mui/material';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    i18n.changeLanguage(event.target.value as string);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleLanguageChange}
      sx={{ minWidth: 120 }}
    >
      <option value="en">English</option>
      <option value="fr">Français</option>
    </Select>
  );
};

export default LanguageSelector;
`;

  await fs.writeFile(
    path.join(frontendPath, 'src', 'components', 'LanguageSelector.tsx'),
    languageSelector
  );
} 