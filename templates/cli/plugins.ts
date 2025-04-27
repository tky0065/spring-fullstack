import { ProjectConfig } from '../../src/types.js'; // Correction du chemin d'importation
import fs from 'fs-extra';
import path from 'path';

export async function setupPlugins(projectPath: string, config: ProjectConfig) {
  await setupPluginSystem(projectPath, config);
  await setupPluginTemplates(projectPath, config);
  await setupPluginRegistry(projectPath, config);
}

async function setupPluginSystem(projectPath: string, config: ProjectConfig) {
  // Create plugin system core
  const pluginSystem = {
    'src/main/java/com/${config.projectName.toLowerCase()}/plugin/Plugin.java': `
package com.${config.projectName.toLowerCase()}.plugin;

import org.springframework.context.ApplicationContext;

public interface Plugin {
    String getName();
    String getVersion();
    String getDescription();
    void initialize(ApplicationContext context);
    void destroy();
}
`,
    'src/main/java/com/${config.projectName.toLowerCase()}/plugin/PluginManager.java': `
package com.${config.projectName.toLowerCase()}.plugin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.HashMap;
import java.util.Map;
import java.util.ServiceLoader;

@Component
public class PluginManager {
    private final Map<String, Plugin> plugins = new HashMap<>();
    
    @Autowired
    private ApplicationContext context;

    @PostConstruct
    public void initialize() {
        ServiceLoader.load(Plugin.class)
            .forEach(plugin -> {
                plugins.put(plugin.getName(), plugin);
                plugin.initialize(context);
            });
    }

    @PreDestroy
    public void destroy() {
        plugins.values().forEach(Plugin::destroy);
        plugins.clear();
    }

    public Plugin getPlugin(String name) {
        return plugins.get(name);
    }

    public Map<String, Plugin> getPlugins() {
        return new HashMap<>(plugins);
    }
}
`,
    'src/main/java/com/${config.projectName.toLowerCase()}/plugin/PluginContext.java': `
package com.${config.projectName.toLowerCase()}.plugin;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class PluginContext {
    private final ApplicationContext context;

    public PluginContext(ApplicationContext context) {
        this.context = context;
    }

    public <T> T getBean(Class<T> beanType) {
        return context.getBean(beanType);
    }

    public Object getBean(String name) {
        return context.getBean(name);
    }
}
`
  };

  const pluginPath = path.join(projectPath, 'plugins');
  await fs.mkdirp(pluginPath);

  for (const [filename, content] of Object.entries(pluginSystem)) {
    await fs.writeFile(
      path.join(pluginPath, filename),
      content
    );
  }
}

async function setupPluginTemplates(projectPath: string, config: ProjectConfig) {
  // Create plugin templates
  const pluginTemplates = {
    'templates/plugin/pom.xml': `
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.${config.projectName.toLowerCase()}</groupId>
        <artifactId>${config.projectName.toLowerCase()}-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>${config.projectName.toLowerCase()}-plugin-template</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.${config.projectName.toLowerCase()}</groupId>
            <artifactId>${config.projectName.toLowerCase()}-core</artifactId>
            <version>\${project.version}</version>
        </dependency>
    </dependencies>
</project>
`,
    'templates/plugin/src/main/java/com/${config.projectName.toLowerCase()}/plugin/template/TemplatePlugin.java': `
package com.${config.projectName.toLowerCase()}.plugin.template;

import com.${config.projectName.toLowerCase()}.plugin.Plugin;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class TemplatePlugin implements Plugin {
    @Override
    public String getName() {
        return "template-plugin";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "Template plugin for ${config.projectName}";
    }

    @Override
    public void initialize(ApplicationContext context) {
        // Initialize plugin
    }

    @Override
    public void destroy() {
        // Cleanup resources
    }
}
`,
    'templates/plugin/src/main/resources/META-INF/services/com.${config.projectName.toLowerCase()}.plugin.Plugin': `
com.${config.projectName.toLowerCase()}.plugin.template.TemplatePlugin
`
  };

  const templatesPath = path.join(projectPath, 'plugins', 'templates');
  await fs.mkdirp(templatesPath);

  for (const [filename, content] of Object.entries(pluginTemplates)) {
    await fs.writeFile(
      path.join(templatesPath, filename),
      content
    );
  }
}

async function setupPluginRegistry(projectPath: string, config: ProjectConfig) {
  // Create plugin registry
  const pluginRegistry = {
    'src/main/java/com/${config.projectName.toLowerCase()}/plugin/registry/PluginRegistry.java': `
package com.${config.projectName.toLowerCase()}.plugin.registry;

import com.${config.projectName.toLowerCase()}.plugin.Plugin;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class PluginRegistry {
    private final Map<String, PluginInfo> plugins = new HashMap<>();

    public void registerPlugin(Plugin plugin) {
        plugins.put(plugin.getName(), new PluginInfo(plugin));
    }

    public void unregisterPlugin(String name) {
        plugins.remove(name);
    }

    public PluginInfo getPluginInfo(String name) {
        return plugins.get(name);
    }

    public Map<String, PluginInfo> getPlugins() {
        return new HashMap<>(plugins);
    }
}
`,
    'src/main/java/com/${config.projectName.toLowerCase()}/plugin/registry/PluginInfo.java': `
package com.${config.projectName.toLowerCase()}.plugin.registry;

import com.${config.projectName.toLowerCase()}.plugin.Plugin;

public class PluginInfo {
    private final Plugin plugin;
    private final long loadTime;
    private boolean enabled;

    public PluginInfo(Plugin plugin) {
        this.plugin = plugin;
        this.loadTime = System.currentTimeMillis();
        this.enabled = true;
    }

    public Plugin getPlugin() {
        return plugin;
    }

    public long getLoadTime() {
        return loadTime;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
`,
    'src/main/java/com/${config.projectName.toLowerCase()}/plugin/registry/PluginConfiguration.java': `
package com.${config.projectName.toLowerCase()}.plugin.registry;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PluginConfiguration {
    @Bean
    public PluginRegistry pluginRegistry() {
        return new PluginRegistry();
    }
}
`
  };

  const registryPath = path.join(projectPath, 'plugins', 'registry');
  await fs.mkdirp(registryPath);

  for (const [filename, content] of Object.entries(pluginRegistry)) {
    await fs.writeFile(
      path.join(registryPath, filename),
      content
    );
  }
} 
