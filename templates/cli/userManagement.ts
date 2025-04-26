import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupUserManagement(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const javaPath = path.join(backendPath, 'src', 'main', 'java');
  
  // Create user management structure
  await setupUserEntities(javaPath, config);
  await setupUserRepository(javaPath, config);
  await setupUserService(javaPath, config);
  await setupUserController(javaPath, config);
  
  if (config.userManagement.adminPanel) {
    await setupAdminPanel(javaPath, config);
  }
}

async function setupUserEntities(javaPath: string, config: ProjectConfig) {
  const entitiesPath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'entity');
  await fs.ensureDir(entitiesPath);
  
  // Create User entity
  const userEntity = `
package com.${config.projectName.toLowerCase()}.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
`;

  await fs.writeFile(
    path.join(entitiesPath, 'User.java'),
    userEntity
  );
  
  // Create Role entity
  const roleEntity = `
package com.${config.projectName.toLowerCase()}.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Data
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();
}
`;

  await fs.writeFile(
    path.join(entitiesPath, 'Role.java'),
    roleEntity
  );
}

async function setupUserRepository(javaPath: string, config: ProjectConfig) {
  const repositoryPath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'repository');
  await fs.ensureDir(repositoryPath);
  
  // Create UserRepository
  const userRepository = `
package com.${config.projectName.toLowerCase()}.repository;

import com.${config.projectName.toLowerCase()}.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
`;

  await fs.writeFile(
    path.join(repositoryPath, 'UserRepository.java'),
    userRepository
  );
  
  // Create RoleRepository
  const roleRepository = `
package com.${config.projectName.toLowerCase()}.repository;

import com.${config.projectName.toLowerCase()}.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
`;

  await fs.writeFile(
    path.join(repositoryPath, 'RoleRepository.java'),
    roleRepository
  );
}

async function setupUserService(javaPath: string, config: ProjectConfig) {
  const servicePath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'service');
  await fs.ensureDir(servicePath);
  
  // Create UserService
  const userService = `
package com.${config.projectName.toLowerCase()}.service;

import com.${config.projectName.toLowerCase()}.entity.User;
import com.${config.projectName.toLowerCase()}.entity.Role;
import com.${config.projectName.toLowerCase()}.repository.UserRepository;
import com.${config.projectName.toLowerCase()}.repository.RoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    public User createUser(String username, String email, String password, Set<String> roleNames) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username is already taken");
        }
        
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already in use");
        }
        
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        
        Set<Role> roles = new HashSet<>();
        roleNames.forEach(roleName -> {
            Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            roles.add(role);
        });
        
        user.setRoles(roles);
        return userRepository.save(user);
    }
    
    public User updateUser(Long id, String username, String email, Set<String> roleNames) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!user.getUsername().equals(username) && userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username is already taken");
        }
        
        if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already in use");
        }
        
        user.setUsername(username);
        user.setEmail(email);
        
        Set<Role> roles = new HashSet<>();
        roleNames.forEach(roleName -> {
            Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            roles.add(role);
        });
        
        user.setRoles(roles);
        return userRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    public User getUser(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
`;

  await fs.writeFile(
    path.join(servicePath, 'UserService.java'),
    userService
  );
}

async function setupUserController(javaPath: string, config: ProjectConfig) {
  const controllerPath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'controller');
  await fs.ensureDir(controllerPath);
  
  // Create UserController
  const userController = `
package com.${config.projectName.toLowerCase()}.controller;

import com.${config.projectName.toLowerCase()}.entity.User;
import com.${config.projectName.toLowerCase()}.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(
        @RequestParam String username,
        @RequestParam String email,
        @RequestParam String password,
        @RequestParam Set<String> roles
    ) {
        return ResponseEntity.ok(userService.createUser(username, email, password, roles));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(
        @PathVariable Long id,
        @RequestParam String username,
        @RequestParam String email,
        @RequestParam Set<String> roles
    ) {
        return ResponseEntity.ok(userService.updateUser(id, username, email, roles));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }
}
`;

  await fs.writeFile(
    path.join(controllerPath, 'UserController.java'),
    userController
  );
}

async function setupAdminPanel(javaPath: string, config: ProjectConfig) {
  const adminPath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'admin');
  await fs.ensureDir(adminPath);
  
  // Create AdminController
  const adminController = `
package com.${config.projectName.toLowerCase()}.admin;

import com.${config.projectName.toLowerCase()}.entity.User;
import com.${config.projectName.toLowerCase()}.service.UserService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserService userService;
    
    public AdminController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping
    public String adminDashboard(Model model) {
        return "admin/dashboard";
    }
    
    @GetMapping("/users")
    public String userManagement(Model model) {
        return "admin/users";
    }
    
    @GetMapping("/users/{id}")
    public String userDetails(@PathVariable Long id, Model model) {
        User user = userService.getUser(id);
        model.addAttribute("user", user);
        return "admin/user-details";
    }
}
`;

  await fs.writeFile(
    path.join(adminPath, 'AdminController.java'),
    adminController
  );
} 