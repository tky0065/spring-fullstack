import { ProjectConfig } from '../../src/types/config.js';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export async function setupAuthentication(projectPath: string, config: ProjectConfig): Promise<void> {
  const backendPath = path.join(projectPath, 'backend');
  const javaPath = path.join(backendPath, 'src', 'main', 'java');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  
  // Create security configuration
  await setupSecurityConfig(javaPath, config);
  
  // Create authentication configuration
  await setupAuthConfig(resourcesPath, config);
  
  // Create JWT configuration if needed
  if (config.authentication.type === 'jwt') {
    await setupJwtConfig(javaPath, config);
  }
  
  // Create OAuth2 configuration if needed
  if (config.authentication.type === 'oauth2') {
    await setupOAuth2Config(javaPath, config);
  }
}

async function setupSecurityConfig(javaPath: string, config: ProjectConfig): Promise<void> {
  const securityConfig = `
package com.${config.projectName.toLowerCase()}.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/auth/**").permitAll()
            .antMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated();
            
        ${getAuthenticationConfig(config)}
    }
}
`;

  await fs.writeFile(
    path.join(javaPath, 'com', config.projectName.toLowerCase(), 'security', 'SecurityConfig.java'),
    securityConfig
  );
}

function getAuthenticationConfig(config: ProjectConfig): string {
  switch (config.authentication.type) {
    case 'jwt':
      return `
        // JWT Configuration
        jwt:
          secret: ${generateSecretKey()}
          expiration: 86400000  # 24 hours
      `;
    case 'oauth2':
      return `
        # OAuth2 Configuration
        oauth2:
          client:
            registration:
              google:
                client-id: YOUR_CLIENT_ID
                client-secret: YOUR_CLIENT_SECRET
      `;
    case 'session':
      return `
        # Session Configuration
        session:
          timeout: 1800  # 30 minutes
      `;
    default:
      return '';
  }
}

async function setupAuthConfig(resourcesPath: string, config: ProjectConfig): Promise<void> {
  let authConfig = `
spring:
  security:
    user:
      name: admin
      password: ${generateRandomPassword()}
`;

  if (config.authentication.type === 'jwt') {
    authConfig += `
jwt:
  secret: ${generateRandomSecret()}
  expiration: 86400000 # 24 hours
`;
  }

  await fs.writeFile(
    path.join(resourcesPath, 'application-auth.yml'),
    authConfig
  );
}

async function setupJwtConfig(javaPath: string, config: ProjectConfig): Promise<void> {
  const jwtConfig = `
package com.${config.projectName.toLowerCase()}.security.jwt;

import io.jsonwebtoken.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import java.util.Base64;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {
    
    private String secretKey;
    private long validityInMilliseconds;
    private final UserDetailsService userDetailsService;
    
    public JwtTokenProvider(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }
    
    @PostConstruct
    protected void init() {
        secretKey = Base64.getEncoder().encodeToString("${generateRandomSecret()}".getBytes());
        validityInMilliseconds = 86400000; // 24h
    }
    
    public String createToken(String username, List<String> roles) {
        Claims claims = Jwts.claims().setSubject(username);
        claims.put("roles", roles);
        
        Date now = new Date();
        Date validity = new Date(now.getTime() + validityInMilliseconds);
        
        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(now)
            .setExpiration(validity)
            .signWith(SignatureAlgorithm.HS256, secretKey)
            .compact();
    }
    
    public Authentication getAuthentication(String token) {
        UserDetails userDetails = this.userDetailsService.loadUserByUsername(getUsername(token));
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }
    
    public String getUsername(String token) {
        return Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody().getSubject();
    }
    
    public String resolveToken(HttpServletRequest req) {
        String bearerToken = req.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
    
    public boolean validateToken(String token) {
        try {
            Jws<Claims> claims = Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token);
            return !claims.getBody().getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidJwtAuthenticationException("Expired or invalid JWT token");
        }
    }
}
`;

  await fs.writeFile(
    path.join(javaPath, 'com', config.projectName.toLowerCase(), 'security', 'jwt', 'JwtTokenProvider.java'),
    jwtConfig
  );
}

async function setupOAuth2Config(javaPath: string, config: ProjectConfig): Promise<void> {
  const oauth2Config = `
package com.${config.projectName.toLowerCase()}.security.oauth2;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.stereotype.Component;

@Configuration
public class OAuth2Config {
    
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(this.googleClientRegistration());
    }
    
    private ClientRegistration googleClientRegistration() {
        return ClientRegistration.withRegistrationId("google")
            .clientId("google-client-id")
            .clientSecret("google-client-secret")
            .clientAuthenticationMethod(ClientAuthenticationMethod.BASIC)
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .scope("openid", "profile", "email")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://www.googleapis.com/oauth2/v4/token")
            .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
            .userNameAttributeName(IdTokenClaimNames.SUB)
            .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
            .clientName("Google")
            .build();
    }
}
`;

  await fs.writeFile(
    path.join(javaPath, 'com', config.projectName.toLowerCase(), 'security', 'oauth2', 'OAuth2Config.java'),
    oauth2Config
  );
}

function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-8);
}

function generateRandomSecret(): string {
  return Math.random().toString(36).slice(-32);
}

function generateSecretKey(): string {
  return crypto.randomBytes(64).toString('base64');
}

export async function setupAuthDependencies(projectPath: string, authType: string): Promise<void> {
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');

  const authDependencies: Record<string, string> = {
    jwt: `
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt</artifactId>
            <version>0.9.1</version>
        </dependency>`,
    oauth2: `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-client</artifactId>
        </dependency>`,
    none: ''
  };

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${authDependencies[authType]}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);
} 