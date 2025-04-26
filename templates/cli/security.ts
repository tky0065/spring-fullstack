import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupSecurity(projectPath: string, config: ProjectConfig) {
  await setupSecurityConfig(projectPath, config);
  await setupSecurityTools(projectPath, config);
  await setupRateLimiting(projectPath, config);
  await setupCors(projectPath, config);
}

async function setupSecurityConfig(projectPath: string, config: ProjectConfig) {
  const securityConfig = {
    'src/main/java/com/${config.projectName.toLowerCase()}/security/SecurityConfig.java': `
package com.${config.projectName.toLowerCase()}.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .authorizeRequests()
                .antMatchers("/api/public/**").permitAll()
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .httpBasic();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
`,
    'src/main/java/com/${config.projectName.toLowerCase()}/security/RateLimitingConfig.java': `
package com.${config.projectName.toLowerCase()}.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.${config.projectName.toLowerCase()}.security.interceptor.RateLimitInterceptor;

@Configuration
public class RateLimitingConfig implements WebMvcConfigurer {
    
    @Bean
    public RateLimitInterceptor rateLimitInterceptor() {
        return new RateLimitInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor())
                .addPathPatterns("/api/**");
    }
}
`,
    'src/main/java/com/${config.projectName.toLowerCase()}/security/interceptor/RateLimitInterceptor.java': `
package com.${config.projectName.toLowerCase()}.security.interceptor;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private static final int MAX_REQUESTS = 100;
    private static final long TIME_WINDOW = TimeUnit.MINUTES.toMillis(1);
    
    private final ConcurrentHashMap<String, RequestCounter> requestCounters = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String clientIp = request.getRemoteAddr();
        RequestCounter counter = requestCounters.computeIfAbsent(clientIp, k -> new RequestCounter());
        
        if (counter.isRateLimited()) {
            response.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
            return false;
        }
        
        counter.increment();
        return true;
    }

    private static class RequestCounter {
        private int count;
        private long resetTime;

        RequestCounter() {
            this.count = 0;
            this.resetTime = System.currentTimeMillis() + TIME_WINDOW;
        }

        synchronized void increment() {
            if (System.currentTimeMillis() > resetTime) {
                count = 0;
                resetTime = System.currentTimeMillis() + TIME_WINDOW;
            }
            count++;
        }

        synchronized boolean isRateLimited() {
            if (System.currentTimeMillis() > resetTime) {
                count = 0;
                resetTime = System.currentTimeMillis() + TIME_WINDOW;
                return false;
            }
            return count >= MAX_REQUESTS;
        }
    }
}
`
  };

  const securityPath = path.join(projectPath, 'src', 'main', 'java', 'com', config.projectName.toLowerCase(), 'security');
  await fs.mkdirp(securityPath);

  for (const [filename, content] of Object.entries(securityConfig)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
}

async function setupSecurityTools(projectPath: string, config: ProjectConfig) {
  const securityTools = {
    'sonar-project.properties': `
sonar.projectKey=${config.projectName.toLowerCase()}
sonar.projectName=${config.projectName}
sonar.projectVersion=1.0
sonar.sources=src/main/java
sonar.tests=src/test/java
sonar.java.binaries=target/classes
sonar.java.libraries=target/dependency/*.jar
sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
`,
    '.snyk': `
version: v1.19.0
ignore: {}
patch: {}
`
  };

  for (const [filename, content] of Object.entries(securityTools)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
}

async function setupRateLimiting(projectPath: string, config: ProjectConfig) {
  const rateLimitingConfig = {
    'src/main/resources/application-rate-limit.yml': `
rate-limit:
  max-requests: 100
  time-window: 60000
  paths:
    - /api/**
`
  };

  for (const [filename, content] of Object.entries(rateLimitingConfig)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
}

async function setupCors(projectPath: string, config: ProjectConfig) {
  const corsConfig = {
    'src/main/resources/application-cors.yml': `
cors:
  allowed-origins: "*"
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS
  allowed-headers: "*"
  exposed-headers: Authorization
  max-age: 3600
`
  };

  for (const [filename, content] of Object.entries(corsConfig)) {
    await fs.writeFile(
      path.join(projectPath, filename),
      content
    );
  }
} 