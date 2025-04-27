package com.example.{{projectName}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;

@SpringBootApplication
@OpenAPIDefinition(
    info = @Info(
        title = "{{projectName}} API",
        version = "1.0",
        description = "API documentation for {{projectName}}"
    )
)
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

} 