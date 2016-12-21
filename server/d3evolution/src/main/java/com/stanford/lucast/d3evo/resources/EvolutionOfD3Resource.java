package com.stanford.lucast.d3evo.resources;

import com.stanford.lucast.d3evo.api.sankey.BasicSankeyData;
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
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.io.IOException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.json.simple.JSONObject;
import java.util.Scanner;

@Path("/d3-evo")
@Produces(MediaType.APPLICATION_JSON)
public class EvolutionOfD3Resource {
    private final Map<String, String> codeMap;
    private final String dataFilename;

    private SankeyData fileData;
    private BasicSankeyData basicData;

    public EvolutionOfD3Resource(String filename) {
        System.out.println("EvolutionOfD3Resource");
        this.dataFilename = filename;
        this.codeMap = createNodeToCodeMap(filename);
    }

    private Map<String, String> createNodeToCodeMap(String filename) {
        final ObjectMapper mapper = new ObjectMapper();

        try {
            // Read in json file and map to SankeyData object
            InputStream input = EvolutionOfD3Resource.class.getClass().getResourceAsStream(filename);

            fileData = mapper.readValue(input, SankeyData.class);

            // Create map from the data for easy code lookup
            Map<String,String> map = new HashMap<String,String>();
            List<SankeyNode> nodes = fileData.getNodes();
            for (SankeyNode node : nodes) {
                String uid = node.getUid();
                String code = node.getCode();
                map.put(uid, code);
            }

            // Distill info required by client to create sankey
            basicData = new BasicSankeyData(fileData);

            return map;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    @GET
    @Timed
    public Object query(@QueryParam("uid") Optional<String> nodeId, 
                        @QueryParam("index") Optional<String> index) {


        if (nodeId.isPresent()) {
            String code = codeMap.get(nodeId.get());

            JSONObject obj = new JSONObject();
            obj.put("code", code);
            obj.put("index", index.get());

            return code != null ? obj.toString() : "Error: No code found for uid.";
        } else {
            return basicData;
        }
    }
}