import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupMigrations(projectPath: string, config: ProjectConfig) {
  await setupFlywayConfig(projectPath, config);
  await setupInitialMigrations(projectPath, config);
  await setupTokenMigrations(projectPath, config);
  await setupAdvancedFeaturesMigrations(projectPath, config);
}

async function setupFlywayConfig(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  
  // Create Flyway configuration
  const flywayConfig = `
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    table: schema_version
    validate-on-migrate: true
    clean-disabled: false
    out-of-order: false
    baseline-version: 0
    baseline-description: "Initial baseline"
`;

  await fs.writeFile(
    path.join(resourcesPath, 'application-flyway.yml'),
    flywayConfig
  );
  
  // Create Flyway configuration class
  const flywayConfigClass = `
package com.${config.projectName.toLowerCase()}.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {

    @Autowired
    private DataSource dataSource;

    @Bean
    @DependsOn("dataSource")
    public Flyway flyway() {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .baselineOnMigrate(true)
            .baselineVersion("0")
            .baselineDescription("Initial baseline")
            .locations("classpath:db/migration")
            .load();
        flyway.migrate();
        return flyway;
    }
}
`;

  await fs.writeFile(
    path.join(backendPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'config', 'FlywayConfig.java'),
    flywayConfigClass
  );
}

async function setupInitialMigrations(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const migrationsPath = path.join(backendPath, 'src', 'main', 'resources', 'db', 'migration');
  
  // Create V1__Initial_schema.sql
  const initialSchema = `
-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Create user_roles join table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_roles_name ON roles(name);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_USER', 'Basic user role'),
    ('ROLE_ADMIN', 'Administrator role');
`;

  await fs.writeFile(
    path.join(migrationsPath, 'V1__Initial_schema.sql'),
    initialSchema
  );
  
  // Create V2__Add_audit_fields.sql
  const auditFields = `
-- Add audit fields to users table
ALTER TABLE users
    ADD COLUMN created_by VARCHAR(50),
    ADD COLUMN last_modified_by VARCHAR(50),
    ADD COLUMN last_modified_at TIMESTAMP WITH TIME ZONE;

-- Add audit fields to roles table
ALTER TABLE roles
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN created_by VARCHAR(50),
    ADD COLUMN last_modified_by VARCHAR(50),
    ADD COLUMN last_modified_at TIMESTAMP WITH TIME ZONE;
`;

  await fs.writeFile(
    path.join(migrationsPath, 'V2__Add_audit_fields.sql'),
    auditFields
  );
}

async function setupTokenMigrations(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const migrationsPath = path.join(backendPath, 'src', 'main', 'resources', 'db', 'migration');
  
  // Create V3__Add_token_tables.sql
  const tokenTables = `
-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create password_reset_tokens table
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create email_verification_tokens table
CREATE TABLE email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
`;

  await fs.writeFile(
    path.join(migrationsPath, 'V3__Add_token_tables.sql'),
    tokenTables
  );
}

async function setupAdvancedFeaturesMigrations(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const migrationsPath = path.join(backendPath, 'src', 'main', 'resources', 'db', 'migration');
  
  // Create V4__Add_advanced_features.sql
  const advancedFeatures = `
-- Add profile fields to users table
ALTER TABLE users
    ADD COLUMN profile_picture_url VARCHAR(255),
    ADD COLUMN bio TEXT,
    ADD COLUMN phone_number VARCHAR(20),
    ADD COLUMN address TEXT,
    ADD COLUMN country VARCHAR(100),
    ADD COLUMN timezone VARCHAR(50);

-- Create user_preferences table
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_activity_log table
CREATE TABLE user_activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);
`;

  await fs.writeFile(
    path.join(migrationsPath, 'V4__Add_advanced_features.sql'),
    advancedFeatures
  );
} 