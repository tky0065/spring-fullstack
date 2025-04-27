import fs from 'fs-extra';
import path from 'path';

export async function setupAdminPanel(projectPath: string): Promise<void> {
  const adminPath = path.join(projectPath, 'backend/src/main/java/com/example/admin');
  await fs.mkdirp(adminPath);

  // Créer les contrôleurs admin
  const adminControllers = {
    'UserController.java': `
package com.example.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    
    @GetMapping
    public List<User> getAllUsers() {
        // Implementation
    }
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        // Implementation
    }
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        // Implementation
    }
    
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        // Implementation
    }
    
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        // Implementation
    }
}`,
    'RoleController.java': `
package com.example.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {
    
    @GetMapping
    public List<Role> getAllRoles() {
        // Implementation
    }
    
    @PostMapping
    public Role createRole(@RequestBody Role role) {
        // Implementation
    }
    
    @PutMapping("/{id}")
    public Role updateRole(@PathVariable Long id, @RequestBody Role role) {
        // Implementation
    }
}`,
    'DashboardController.java': `
package com.example.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {
    
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        // Implementation
    }
    
    @GetMapping("/logs")
    public List<LogEntry> getLogs() {
        // Implementation
    }
}`,
    'SecurityConfig.java': `
package com.example.admin;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .formLogin()
                .loginPage("/admin/login")
                .permitAll()
            .and()
            .logout()
                .logoutUrl("/admin/logout")
                .permitAll();
    }
}`
  };

  // Créer les fichiers
  for (const [filename, content] of Object.entries(adminControllers)) {
    await fs.writeFile(path.join(adminPath, filename), content);
  }

  // Ajouter les dépendances nécessaires
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');

  const adminDependencies = `
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.thymeleaf.extras</groupId>
            <artifactId>thymeleaf-extras-springsecurity5</artifactId>
        </dependency>`;

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${adminDependencies}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);
} 