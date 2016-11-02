package com.stanford.lucast.d3evo;

import com.stanford.lucast.d3evo.resources.EvolutionOfD3Resource;
import com.stanford.lucast.d3evo.health.TemplateHealthCheck;
import io.dropwizard.Application;
// import io.dropwizard.Core;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import org.eclipse.jetty.servlets.CrossOriginFilter;
import javax.servlet.FilterRegistration;
import javax.servlet.DispatcherType;
import java.util.EnumSet;

public class EvolutionOfD3Application extends Application<EvolutionOfD3Configuration> {

    public static void main(final String[] args) throws Exception {
        new EvolutionOfD3Application().run(args);
    }

    @Override
    public String getName() {
        return "EvolutionOfD3";
    }

    @Override
    public void initialize(final Bootstrap<EvolutionOfD3Configuration> bootstrap) {
        // TODO: application initialization

        //serve some HTML resources
        // bootstrap.addBundle(new AssetsBundle());
    }

    @Override
    public void run(final EvolutionOfD3Configuration configuration,
                    final Environment environment) {
        System.out.println("run");

        // Enable CORS headers
        final FilterRegistration.Dynamic cors =
            environment.servlets().addFilter("CORS", CrossOriginFilter.class);

        // Configure CORS parameters
        cors.setInitParameter("allowedOrigins", configuration.getClientURL());
        cors.setInitParameter("allowedHeaders", "X-Requested-With,Content-Type,Accept,Origin");
        cors.setInitParameter("allowedMethods", "GET");
        // cors.setInitParameter("allowedMethods", "OPTIONS,GET,PUT,POST,DELETE,HEAD");

        // Add URL mapping
        cors.addMappingForUrlPatterns(EnumSet.allOf(DispatcherType.class), true, "/*");


        // environment.jersey().setUrlPattern("/myapp/*");
        final EvolutionOfD3Resource resource = new EvolutionOfD3Resource(
            configuration.getDataFilename()
        );
        environment.jersey().register(resource);

        // Health Check
        // final TemplateHealthCheck healthCheck =
        //     new TemplateHealthCheck(configuration.getTemplate());
        // environment.healthChecks().register("template", healthCheck);
        // environment.jersey().register(resource);
    }
}
