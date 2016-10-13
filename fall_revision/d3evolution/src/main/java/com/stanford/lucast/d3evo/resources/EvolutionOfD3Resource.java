package com.stanford.lucast.d3evo.resources;

// import com.stanford.lucast.d3evo.api.Saying;
import com.stanford.lucast.d3evo.api.sankey.SankeyData;
import com.stanford.lucast.d3evo.api.sankey.SankeyNode;
import com.stanford.lucast.d3evo.api.sankey.SankeyLink;
import com.stanford.lucast.d3evo.api.sankey.CodeSimilarity;
import com.codahale.metrics.annotation.Timed;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import java.util.concurrent.atomic.AtomicLong;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Scanner;

@Path("/d3-evo")
@Produces(MediaType.APPLICATION_JSON)
public class EvolutionOfD3Resource {
    // private final String template;
    // private final String defaultName;
    private final Map<String, String> codeMap;
    private final String dataFilename;
    private final AtomicLong counter;

    // public EvolutionOfD3Resource(String template, String defaultName) {
    public EvolutionOfD3Resource(String filename) {
        this.dataFilename = filename;
        this.counter = new AtomicLong();
        // this.template = template;
        // this.defaultName = defaultName;

        this.codeMap = createNodeToCodeMap(filename);
    }

    private Map<String, String> createNodeToCodeMap(String filename) {
        final ObjectMapper mapper = new ObjectMapper();
        System.out.println("__________________");

        try {
            // Read in json file and map to SankeyData object
            InputStream input = EvolutionOfD3Resource.class.getClass().getResourceAsStream(filename);
            final SankeyData fileData = mapper.readValue(input, SankeyData.class);

            // Create map from the data
            Map<String,String> map = new HashMap<String,String>();
            List<SankeyNode> nodes = fileData.getNodes();
            for (SankeyNode node : nodes) {
                String uid = node.getUid();
                String code = node.getCode();
                map.put(uid, code);
            }

            return map;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    @GET
    @Timed
    public String getCodeForNode(@QueryParam("uid") Optional<String> nodeId) {
        String code = codeMap.get(nodeId.orElse(""));
        return code != null ? code : "Error: No code found for uid.";
    }

    // @GET
    // @Timed
    // public NodeMap(@QueryParam("nodeId")) {

    // }

    // @GET
    // @Timed
    // public Saying sayHello(@QueryParam("name") Optional<String> name) {
    //     System.out.println("SAYHELLO");
    //     final String value = String.format(template, name.orElse(defaultName));
    //     return new Saying(counter.incrementAndGet(), value);
    // }
}