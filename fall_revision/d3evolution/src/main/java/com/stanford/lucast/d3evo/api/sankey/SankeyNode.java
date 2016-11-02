package com.stanford.lucast.d3evo.api.sankey;

import com.stanford.lucast.d3evo.api.sankey.BasicSankeyNode;

import java.util.Iterator;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class SankeyNode extends BasicSankeyNode{
	private String code;
	private String description;
	private String readme;

	public SankeyNode() {
		super();
	}

	public SankeyNode(SankeyNode node) {
		super(node);
		code = node.code;
		description = node.description;
		readme = node.readme;
	}

	@JsonProperty
	public String getCode() {
		return code;
	}

	@JsonProperty
	public void setCode(String code) {
		this.code = code;
	}

	@JsonProperty
	public String getDescription() {
		return description;
	}

	@JsonProperty
	public void setDescription(String description) {
		this.description = description;
	}

	@JsonProperty
	public String getReadme() {
		return readme;
	}

	@JsonProperty
	public void setReadme(String uid) {
		this.readme = readme;
	}
}