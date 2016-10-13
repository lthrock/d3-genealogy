package com.stanford.lucast.d3evo.api.sankey;

import java.util.Iterator;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class SankeyNode {
	private String code;
	private String description;
	private String created_at;
	private String updated_at;
	private List<String> api;
	private String readme;
	private String uid;

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
	public String getReadme() {
		return readme;
	}

	@JsonProperty
	public void setReadme(String readme) {
		this.readme = readme;
	}

	@JsonProperty
	public String getUid() {
		return uid;
	}

	@JsonProperty
	public void setUid(String uid) {
		this.uid = uid;
	}
}