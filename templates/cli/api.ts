import { ProjectConfig } from './config';
import fs from 'fs-extra';
import path from 'path';

export async function setupApi(projectPath: string, config: ProjectConfig) {
  const backendPath = path.join(projectPath, 'backend');
  const javaPath = path.join(backendPath, 'src', 'main', 'java');
  
  if (config.api.type === 'REST') {
    await setupRestApi(javaPath, config);
  } else {
    await setupGraphQLApi(javaPath, config);
  }
  
  if (config.features.openApi) {
    await setupOpenApi(javaPath, config);
  }
}

async function setupRestApi(javaPath: string, config: ProjectConfig) {
  const controllerPath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'controller');
  await fs.ensureDir(controllerPath);
  
  // Create base controller
  const baseController = `
package com.${config.projectName.toLowerCase()}.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class BaseController {
    
    @GetMapping("/health")
    public String healthCheck() {
        return "OK";
    }
}
`;

  await fs.writeFile(
    path.join(controllerPath, 'BaseController.java'),
    baseController
  );
  
  // Create exception handler
  const exceptionHandler = `
package com.${config.projectName.toLowerCase()}.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }
}

class ErrorResponse {
    private int status;
    private String message;
    
    public ErrorResponse(int status, String message) {
        this.status = status;
        this.message = message;
    }
    
    // Getters and setters
}

class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
`;

  await fs.writeFile(
    path.join(controllerPath, 'GlobalExceptionHandler.java'),
    exceptionHandler
  );
}

async function setupGraphQLApi(javaPath: string, config: ProjectConfig) {
  const graphqlPath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'graphql');
  await fs.ensureDir(graphqlPath);
  
  // Create GraphQL configuration
  const graphqlConfig = `
package com.${config.projectName.toLowerCase()}.graphql;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import graphql.schema.GraphQLSchema;
import graphql.schema.idl.RuntimeWiring;
import graphql.schema.idl.SchemaGenerator;
import graphql.schema.idl.SchemaParser;
import graphql.schema.idl.TypeDefinitionRegistry;

@Configuration
public class GraphQLConfig {
    
    @Bean
    public GraphQLSchema graphQLSchema() {
        SchemaParser schemaParser = new SchemaParser();
        SchemaGenerator schemaGenerator = new SchemaGenerator();
        
        // Load schema from file
        String schema = loadSchema();
        TypeDefinitionRegistry typeRegistry = schemaParser.parse(schema);
        
        RuntimeWiring runtimeWiring = buildWiring();
        
        return schemaGenerator.makeExecutableSchema(typeRegistry, runtimeWiring);
    }
    
    private String loadSchema() {
        // Load schema from resources
        return """
            type Query {
                hello: String
            }
        """;
    }
    
    private RuntimeWiring buildWiring() {
        return RuntimeWiring.newRuntimeWiring()
            .type("Query", typeWiring -> typeWiring
                .dataFetcher("hello", environment -> "Hello, GraphQL!")
            )
            .build();
    }
}
`;

  await fs.writeFile(
    path.join(graphqlPath, 'GraphQLConfig.java'),
    graphqlConfig
  );
  
  // Create GraphQL controller
  const graphqlController = `
package com.${config.projectName.toLowerCase()}.graphql;

import graphql.ExecutionInput;
import graphql.ExecutionResult;
import graphql.GraphQL;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class GraphQLController {
    
    private final GraphQL graphQL;
    
    public GraphQLController(GraphQL graphQL) {
        this.graphQL = graphQL;
    }
    
    @PostMapping("/graphql")
    public ResponseEntity<Object> graphql(@RequestBody Map<String, String> request) {
        String query = request.get("query");
        Map<String, Object> variables = (Map<String, Object>) request.get("variables");
        
        ExecutionInput executionInput = ExecutionInput.newExecutionInput()
            .query(query)
            .variables(variables)
            .build();
        
        ExecutionResult executionResult = graphQL.execute(executionInput);
        
        return ResponseEntity.ok(executionResult.toSpecification());
    }
}
`;

  await fs.writeFile(
    path.join(graphqlPath, 'GraphQLController.java'),
    graphqlController
  );
}

async function setupOpenApi(javaPath: string, config: ProjectConfig) {
  const openapiPath = path.join(javaPath, 'com', config.projectName.toLowerCase(), 'openapi');
  await fs.ensureDir(openapiPath);
  
  // Create OpenAPI configuration
  const openapiConfig = `
package com.${config.projectName.toLowerCase()}.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {
    
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("${config.projectName} API")
                .version("1.0")
                .description("API documentation for ${config.projectName}")
                .license(new License()
                    .name("Apache 2.0")
                    .url("http://springdoc.org")));
    }
}
`;

  await fs.writeFile(
    path.join(openapiPath, 'OpenAPIConfig.java'),
    openapiConfig
  );
} 