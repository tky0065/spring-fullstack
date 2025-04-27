import { ProjectConfig } from '../../src/types.js'; // Correction du chemin d'importation
import fs from 'fs-extra';
import path from 'path';

export async function setupDocumentation(projectPath: string, config: ProjectConfig) {
  await setupTechnicalDocs(projectPath, config);
  await setupUserDocs(projectPath, config);
  await setupApiDocs(projectPath, config);
}

async function setupTechnicalDocs(projectPath: string, config: ProjectConfig) {
  const docsPath = path.join(projectPath, 'docs', 'technical');
  await fs.ensureDir(docsPath);

  // Create architecture documentation
  const architectureDoc = `
# Architecture Documentation

## System Overview
${config.projectName} is a full-stack application with the following components:

- Backend: Spring Boot application
- Frontend: ${config.frontend?.framework || 'None'} application
- Database: ${config.database.type}
- Authentication: ${config.authentication.type || 'None'}

## Technology Stack

### Backend
- Java 17
- Spring Boot
- Spring Security
- ${config.database.type} Database
- ${config.api.type === 'rest' ? 'REST API' : 'GraphQL API'}

### Frontend
- ${config.frontend?.framework || 'None'}
- TypeScript
- Tailwind CSS
- React Router

## Architecture Patterns
- Microservices Architecture
- RESTful API Design
- JWT Authentication
- Repository Pattern
- Service Layer Pattern

## Deployment Architecture
- Docker Containers
- Kubernetes Orchestration
- CI/CD Pipeline
- Environment-specific Configurations
`;

  await fs.writeFile(
    path.join(docsPath, 'architecture.md'),
    architectureDoc
  );

  // Create development guide
  const devGuide = `
# Development Guide

## Prerequisites
- Java 17
- Node.js 18+
- Docker
- Kubernetes (for deployment)

## Setup Development Environment

### Backend Setup
1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   cd backend
   mvn install
   \`\`\`
3. Configure database:
   - Update application-dev.yml with your database credentials
   - Run database migrations if needed

### Frontend Setup
1. Install dependencies:
   \`\`\`bash
   cd frontend
   npm install
   \`\`\`
2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Development Workflow
1. Create feature branch from main
2. Implement changes
3. Run tests
4. Create pull request
5. Code review
6. Merge to main

## Testing
- Unit Tests: JUnit 5
- Integration Tests: Spring Test
- E2E Tests: Cypress
`;

  await fs.writeFile(
    path.join(docsPath, 'development.md'),
    devGuide
  );
}

async function setupUserDocs(projectPath: string, config: ProjectConfig) {
  const docsPath = path.join(projectPath, 'docs', 'user');
  await fs.ensureDir(docsPath);

  // Create user guide
  const userGuide = `
# User Guide

## Getting Started

### Account Creation
1. Navigate to the registration page
2. Fill in your details:
   - Username
   - Email
   - Password
3. Click "Register"
4. Verify your email

### Login
1. Navigate to the login page
2. Enter your credentials
3. Click "Login"

## Features

### User Management
- View profile
- Update profile
- Change password
- Manage preferences

${config.userManagement?.adminPanel ? `
### Admin Panel
- User management
- Role management
- System settings
` : ''}

## Troubleshooting

### Common Issues
1. Forgot Password
   - Click "Forgot Password" on login page
   - Enter your email
   - Follow instructions in email

2. Account Locked
   - Contact system administrator
   - Or wait for automatic unlock

## Support
- Email: support@${config.projectName.toLowerCase()}.com
- Documentation: https://docs.${config.projectName.toLowerCase()}.com
`;

  await fs.writeFile(
    path.join(docsPath, 'user-guide.md'),
    userGuide
  );
}

async function setupApiDocs(projectPath: string, config: ProjectConfig) {
  const docsPath = path.join(projectPath, 'docs', 'api');
  await fs.ensureDir(docsPath);

  if (config.api.type === 'rest') {
    await setupRestApiDocs(docsPath, config);
  } else {
    await setupGraphQLApiDocs(docsPath, config);
  }
}

async function setupRestApiDocs(docsPath: string, config: ProjectConfig) {
  const apiDoc = `
# REST API Documentation

## Authentication
All API requests require authentication using JWT tokens.

### Get Token
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
\`\`\`

## Endpoints

### User Management

#### Get User
\`\`\`http
GET /api/users/{id}
Authorization: Bearer {token}
\`\`\`

#### Create User
\`\`\`http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "new_user",
  "email": "user@example.com",
  "password": "password123",
  "roles": ["USER"]
}
\`\`\`

#### Update User
\`\`\`http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "updated_user",
  "email": "updated@example.com",
  "roles": ["USER", "ADMIN"]
}
\`\`\`

#### Delete User
\`\`\`http
DELETE /api/users/{id}
Authorization: Bearer {token}
\`\`\`

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
`;

  await fs.writeFile(
    path.join(docsPath, 'rest-api.md'),
    apiDoc
  );
}

async function setupGraphQLApiDocs(docsPath: string, config: ProjectConfig) {
  const apiDoc = `
# GraphQL API Documentation

## Authentication
All GraphQL requests require authentication using JWT tokens.

## Schema

### Types
\`\`\`graphql
type User {
  id: ID!
  username: String!
  email: String!
  roles: [Role!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Role {
  id: ID!
  name: String!
  users: [User!]!
}

type Query {
  user(id: ID!): User
  users: [User!]!
  me: User
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

input CreateUserInput {
  username: String!
  email: String!
  password: String!
  roles: [String!]!
}

input UpdateUserInput {
  username: String
  email: String
  roles: [String!]
}
\`\`\`

## Examples

### Query
\`\`\`graphql
query {
  user(id: "1") {
    id
    username
    email
    roles {
      name
    }
  }
}
\`\`\`

### Mutation
\`\`\`graphql
mutation {
  createUser(input: {
    username: "new_user"
    email: "user@example.com"
    password: "password123"
    roles: ["USER"]
  }) {
    id
    username
    email
  }
}
\`\`\`

## Error Handling
GraphQL errors are returned in the following format:
\`\`\`json
{
  "errors": [
    {
      "message": "Error message",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["queryName"]
    }
  ]
}
\`\`\`
`;

  await fs.writeFile(
    path.join(docsPath, 'graphql-api.md'),
    apiDoc
  );
}
