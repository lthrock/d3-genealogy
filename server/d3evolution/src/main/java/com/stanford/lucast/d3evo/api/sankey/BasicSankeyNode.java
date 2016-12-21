package com.stanford.lucast.d3evo.api.sankey;

import java.util.Iterator;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class BasicSankeyNode {
	protected String created_at;
	protected String updated_at;
	protected List<String> api;
	protected String uid;
	protected String description;
	protected String thumb_url;

	public BasicSankeyNode() { }

	public BasicSankeyNode(SankeyNode node) {
		created_at = node.created_at;
		updated_at = node.updated_at;
		api = node.api;
		uid = node.uid;
		description = node.description;
		thumb_url = node.thumb_url;
	}

	@JsonProperty
	public String getCreated_at() {
		return created_at;
	}

	@JsonProperty
	public void setCreated_at(String created_at) {
		this.created_at = created_at;
	}

	@JsonProperty
	public String getUpdated_at() {
		return updated_at;
	}

	@JsonProperty
	public void setUpdated_at(String updated_at) {
		this.updated_at = updated_at;
	}

	@JsonProperty
	public List<String> getApi() {
		return api;
	}

	@JsonProperty
	public void setApi(List<String> api) {
		this.api = api;
	}

	@JsonProperty
	public String getUid() {
		return uid;
	}

	@JsonProperty
	public void setUid(String uid) {
		this.uid = uid;
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
	public String getThumb_url() {
		return thumb_url;
	}

	@JsonProperty
	public void setThumb_url(String thumb_url) {
		this.thumb_url = thumb_url;
	}
}