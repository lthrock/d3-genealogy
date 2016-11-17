package com.stanford.lucast.d3evo.api.sankey;

import com.stanford.lucast.d3evo.api.sankey.SankeyNode;
import com.stanford.lucast.d3evo.api.sankey.SankeyLink;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Iterator;
import java.util.List;

public class SankeyData {
	private List<SankeyNode> nodes;
	private List<SankeyLink> links;

	@JsonProperty
	public List<SankeyNode> getNodes() {
		return nodes;
	}

	@JsonProperty
	public void setNodes(List<SankeyNode> nodes) {
		this.nodes = nodes;
	}

	@JsonProperty
	public List<SankeyLink> getLinks() {
		return links;
	}

	@JsonProperty
	public void setLinks(List<SankeyLink> links) {
		this.links = links;
	}
}

