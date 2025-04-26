# Spring Fullstack Starter Kit

Un starter kit complet pour développer des applications fullstack avec Spring Boot et un framework frontend moderne.

## 🚀 Fonctionnalités

- **Backend Spring Boot** avec :
  - Configuration automatique
  - Sécurité avancée (JWT, OAuth2)
  - Gestion des bases de données
  - API REST/GraphQL
  - Tests automatisés

- **Frontend** avec choix entre :
  - React
  - Vue.js
  - Angular
  - Template Engine (Thymeleaf)

- **Outils de développement** :
  - Docker et Docker Compose
  - CI/CD avec GitHub Actions
  - Tests automatisés
  - Documentation API (Swagger)

## 📦 Installation

```bash
npm install -g spring-fullstack
```

## 🛠 Utilisation

### Créer un nouveau projet

```bash
spring-fullstack new app mon-projet
```

### Options disponibles

- `--database` : Choix de la base de données (MySQL, PostgreSQL, MongoDB, H2)
- `--auth` : Type d'authentification (JWT, OAuth2, Session)
- `--frontend` : Framework frontend (React, Vue, Angular, Template Engine)
- `--api` : Type d'API (REST, GraphQL)
- `--docker` : Générer les fichiers Docker
- `--tests` : Inclure la configuration des tests

## 🔧 Configuration

### Base de données

Le projet supporte plusieurs bases de données :

- MySQL
- PostgreSQL
- MongoDB
- H2 (pour le développement)

### Authentification

Plusieurs options d'authentification sont disponibles :

- JWT (JSON Web Tokens)
- OAuth2
- Session classique

### Frontend

Choix entre :

- React avec TypeScript
- Vue.js avec TypeScript
- Angular
- Template Engine (Thymeleaf)

## 🧪 Tests

Le projet inclut :

- Tests unitaires (JUnit)
- Tests d'intégration (Testcontainers)
- Tests de performance
- Tests de sécurité

## 🔒 Sécurité

Fonctionnalités de sécurité incluses :

- Protection CORS
- Rate limiting
- Validation des entrées
- Protection CSRF
- Intégration avec Snyk et SonarQube

## 🌐 Déploiement

### Docker

```bash
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

## 📚 Documentation

- [Guide d'installation](docs/installation.md)
- [Guide de développement](docs/development.md)
- [Guide de déploiement](docs/deployment.md)
- [API Reference](docs/api.md)

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](CONTRIBUTING.md).

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails. 