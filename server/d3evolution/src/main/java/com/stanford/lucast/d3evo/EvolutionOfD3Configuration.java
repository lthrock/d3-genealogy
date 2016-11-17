package com.stanford.lucast.d3evo;

import io.dropwizard.Configuration;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.validator.constraints.*;
import javax.validation.constraints.*;

public class EvolutionOfD3Configuration extends Configuration {

	@NotEmpty
    // private String defaultFilename = "/d3-nest-nodes.json"; 
    private String defaultFilename = "/10k-2kRandom-output.json"; 
    

    @NotEmpty
    private String clientURL = "http://localhost:8000";

	@JsonProperty 
	public String getDataFilename() {
		return defaultFilename;
	}

	@JsonProperty
	public void setDataFilename(String filename) {
		this.defaultFilename = filename;
	}

    public String getClientURL() {
        return clientURL;
    }
}
