package com.stanford.lucast.d3evo.api.sankey;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CodeSimilarity {
	private int source_start_line;
	private int source_end_line;
	private int source_confidence;

	private int target_start_line;
	private int target_end_line;
	private int target_confidence;

	@JsonProperty
	public int getSource_start_line() {
		return source_start_line;
	}

	@JsonProperty
	public void setSource_start_line(int source_start_line) {
		this.source_start_line = source_start_line;
	}

	@JsonProperty
	public int getSource_end_line() {
		return source_end_line;
	}

	@JsonProperty
	public void setSource_end_line(int source_end_line) {
		this.source_end_line = source_end_line;
	}

	@JsonProperty
	public int getSource_confidence() {
		return source_confidence;
	}

	@JsonProperty
	public void setSource_confidence(int source_confidence) {
		this.source_confidence = source_confidence;
	}

	@JsonProperty
	public int getTarget_start_line() {
		return target_start_line;
	}

	@JsonProperty
	public void setTarget_start_line(int target_start_line) {
		this.target_start_line = target_start_line;
	}

	@JsonProperty
	public int getTarget_end_line () {
		return target_end_line;
	}

	@JsonProperty
	public void setTarget_end_line (int target_end_line) {
		this.target_end_line = target_end_line;
	}

	@JsonProperty
	public int getTarget_confidence() {
		return target_confidence;
	}

	@JsonProperty
	public void setTarget_confidence(int target_confidence) {
		this.target_confidence = target_confidence;
	}
}