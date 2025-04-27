import fs from 'fs-extra';
import path from 'path';

export async function setupSwagger(projectPath: string): Promise<void> {
  const swaggerPath = path.join(projectPath, 'backend/src/main/java/com/example/config');
  await fs.mkdirp(swaggerPath);

  // Configuration Swagger
  const swaggerConfig = `
package com.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.Contact;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.SWAGGER_2)
            .select()
            .apis(RequestHandlerSelectors.basePackage("com.example.controller"))
            .paths(PathSelectors.any())
            .build()
            .apiInfo(apiInfo());
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
            .title("API Documentation")
            .description("API documentation for the application")
            .version("1.0.0")
            .contact(new Contact("Your Name", "https://your-website.com", "your-email@example.com"))
            .license("Apache 2.0")
            .licenseUrl("http://www.apache.org/licenses/LICENSE-2.0.html")
            .build();
    }
}`;

  await fs.writeFile(path.join(swaggerPath, 'SwaggerConfig.java'), swaggerConfig);

  // Ajouter les dépendances Swagger
  const pomPath = path.join(projectPath, 'backend/pom.xml');
  const pomContent = await fs.readFile(pomPath, 'utf-8');

  const swaggerDependencies = `
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-boot-starter</artifactId>
            <version>3.0.0</version>
        </dependency>
        <dependency>
            <groupId>io.springfox</groupId>
            <artifactId>springfox-swagger-ui</artifactId>
            <version>3.0.0</version>
        </dependency>`;

  const updatedPomContent = pomContent.replace(
    '</dependencies>',
    `${swaggerDependencies}\n    </dependencies>`
  );

  await fs.writeFile(pomPath, updatedPomContent);

  // Créer un exemple de contrôleur documenté
  const controllerPath = path.join(projectPath, 'backend/src/main/java/com/example/controller');
  await fs.mkdirp(controllerPath);

  const exampleController = `
package com.example.controller;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Api(tags = "User Management")
public class UserController {

    @GetMapping("/{id}")
    @ApiOperation(value = "Get user by ID", notes = "Returns a user based on their ID")
    @ApiResponses(value = {
        @ApiResponse(code = 200, message = "Successfully retrieved user"),
        @ApiResponse(code = 404, message = "User not found")
    })
    public ResponseEntity<User> getUser(
        @ApiParam(value = "User ID", required = true) @PathVariable Long id) {
        // Implementation
        return ResponseEntity.ok(new User());
    }

    @PostMapping
    @ApiOperation(value = "Create a new user", notes = "Creates a new user with the provided details")
    @ApiResponses(value = {
        @ApiResponse(code = 201, message = "User created successfully"),
        @ApiResponse(code = 400, message = "Invalid input")
    })
    public ResponseEntity<User> createUser(
        @ApiParam(value = "User details", required = true) @RequestBody User user) {
        // Implementation
        return ResponseEntity.ok(new User());
    }
}`;

  await fs.writeFile(path.join(controllerPath, 'UserController.java'), exampleController);
} 