package com.stanford.lucast.d3evo.api.sankey;

import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class BasicSankeyData {
	private List<BasicSankeyNode> nodes;
	private List<SankeyLink> links;

	@JsonProperty
	public List<BasicSankeyNode> getNodes() {
		return nodes;
	}

	@JsonProperty
	public void setNodes(List<BasicSankeyNode> nodes) {
		this.nodes = nodes;
	}

	@JsonProperty
	public List<SankeyLink> getLinks() {
		return links;
	}

	@JsonProperty
	public void setLinks(List<SankeyLink> setLinks) {
		this.links = links;
	}

	public BasicSankeyData(SankeyData complexSankey) {
		links = complexSankey.getLinks();

		List<SankeyNode> complexNodes = complexSankey.getNodes();
		nodes = new ArrayList<BasicSankeyNode>();
		for (SankeyNode complexNode : complexNodes) {
			BasicSankeyNode newNode = new BasicSankeyNode(complexNode);
			nodes.add(newNode);
		}
	}
}