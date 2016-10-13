package com.stanford.lucast.d3evo.api.sankey;

import com.stanford.lucast.d3evo.api.sankey.CodeSimilarity;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Iterator;
import java.util.List;

public class SankeyLink {
	private String source;
	private int value;
	private String target;
	private List<CodeSimilarity> links;

	@JsonProperty
	public String getSource() {
		return source;
	}

	@JsonProperty
	public void setSource(String source) {
		this.source = source;
	}

	@JsonProperty
	public int getValue() {
		return value;
	}

	@JsonProperty
	public void setValue(int value) {
		this.value = value;
	}

	@JsonProperty
	public String getTarget() {
		return target;
	}

	@JsonProperty
	public void setTarget(String target) {
		this.target = target;
	}

	@JsonProperty
	public List<CodeSimilarity> getLinks() {
		return links;
	}

	@JsonProperty
	public void setLinks(List<CodeSimilarity> links) {
		this.links = links;
	}
}
