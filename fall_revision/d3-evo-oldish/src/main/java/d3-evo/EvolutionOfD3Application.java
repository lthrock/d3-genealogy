package d3_evo;

import d3_evo.resources;
import io.dropwizard.Application;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;

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
    }

    @Override
    public void run(final EvolutionOfD3Configuration configuration,
                    final Environment environment) {
        final EvolutionOfD3Resource resource = new EvolutionOfD3Resource(
            configuration.getTemplate(),
            configuration.getDefaultName()
        );
        environment.jersey().register(resource);

        // Health Check
        final TemplateHealthCheck healthCheck =
            new TemplateHealthCheck(configuration.getTemplate());
        environment.healthChecks().register("template", healthCheck);
        environment.jersey().register(resource);
        }

}
