import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupAuthentication(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const javaPath = path.join(backendPath, 'src', 'main', 'java');
  const resourcesPath = path.join(backendPath, 'src', 'main', 'resources');
  
  // Create security configuration
  await setupSecurityConfig(javaPath, config);
  
  // Create authentication configuration
  await setupAuthConfig(resourcesPath, config);
  
  // Create JWT configuration if needed
  if (config.authentication.type === 'JWT') {
    await setupJwtConfig(javaPath, config);
  }
  
  // Create OAuth2 configuration if needed
  if (config.authentication.type === 'OAuth2') {
    await setupOAuth2Config(javaPath, config);
  }
}

async function setupSecurityConfig(javaPath: string, config: ProjectConfig) {
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
    case 'JWT':
      return `
        // JWT Configuration
        .and()
        .addFilter(new JwtAuthenticationFilter(authenticationManager()))
        .addFilter(new JwtAuthorizationFilter(authenticationManager()));
`;
    case 'Session':
      return `
        // Session Configuration
        .and()
        .formLogin()
        .loginPage("/login")
        .permitAll()
        .and()
        .logout()
        .permitAll();
`;
    case 'OAuth2':
      return `
        // OAuth2 Configuration
        .and()
        .oauth2Login()
        .loginPage("/login")
        .permitAll();
`;
    default:
      return '';
  }
}

async function setupAuthConfig(resourcesPath: string, config: ProjectConfig) {
  let authConfig = `
spring:
  security:
    user:
      name: admin
      password: ${generateRandomPassword()}
`;

  if (config.authentication.type === 'JWT') {
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

async function setupJwtConfig(javaPath: string, config: ProjectConfig) {
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

async function setupOAuth2Config(javaPath: string, config: ProjectConfig) {
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