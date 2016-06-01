 
var units = "Widgets";

var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = window.innerWidth - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
 
var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scale.category20();
 
// append the svg canvas to the page
var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", 
          "translate(0," + margin.top + ")");

// Helper methods
function stringToDate(str) {
  return new Date(Date.parse(str));
}

// var savedCoordinates = sankey.nodes().map(function(d) {
//   return { x : d.x, y : d.y}
// });

Array.prototype.maxDate = function() {
  return stringToDate(this.reduce(function (p, v) {
    return stringToDate(p.created_at) > stringToDate(v.created_at) ? p : v;
  }).created_at);
};

Array.prototype.minDate = function() {
  return stringToDate(this.reduce(function (p, v) {
    return stringToDate(p.created_at) < stringToDate(v.created_at) ? p : v;
  }).created_at);
};
 

function linkUID(link) {
  return link.source.uid + "," + link.target.uid;
 }

// load the data
d3.json("data/force-layout.json", function(graph) {
 
    var nodeMap = {};
    var linkMap = {};
    graph.nodes.forEach(function(x) { nodeMap[x.uid] = x; });

    graph.links = graph.links.map(function(x) {
      return {
        source: nodeMap[x.source],
        target: nodeMap[x.target],
        value: x.value,
        links: x.links
      };
    });

    graph.links.forEach(function(x) { linkMap[linkUID(x)] = x; });

  var link, node, xAxisLabels, xAxisLines, sankey, path;
  drawVisualization(graph);

  $(".resetButton").click(function() {
    link.remove();
    node.remove();
    d3.selectAll(".tick").remove();
    d3.selectAll(".x.axis").remove();
    drawVisualization(graph);
  })

  function drawVisualization(currGraph) {
    drawSankey(currGraph);
    drawTimeline();
  }   

  function drawSankey(currGraph) {
    // Set the sankey diagram properties
    sankey = d3.sankey()
        .nodeWidth(6)
        .nodePadding(10)
        .size([width, height-margin.top])
        .topMargin(3 * margin.top);
     
    path = sankey.link();

    sankey
        .nodes(currGraph.nodes)
        .links(currGraph.links)
        .layout(32);

    // add in the links
    link = svg.append("g").selectAll(".link")
        .data(currGraph.links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .on("click", function(d) {
          showEdgeInfo(d);
        })
        .style("stroke-width", 2);
   
    // add the link titles
    link.append("title")
          .text(function(d) {
          return d.source.description + " → " + 
                  d.target.description + "\n" + format(d.value); });
   
    // add in the nodes
    node = svg.append("g").selectAll(".node")
        .data(currGraph.nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("id", function(d) { return "node_" + d.uid} )
        .attr("created_at", function(d) { return d.created_at; })
        .attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")"; })
      .call(d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", function() { 
        this.parentNode.appendChild(this); })
        .on("drag", dragmove));
   
    // add the circles for the nodes
    node.append("circle")
        // .attr("height", function(d) { return d.dy; })
        .attr("r", sankey.nodeWidth())
        .style("fill", function(d) { 
        return d.color = color(d.uid.replace(/ .*/, "")); })
        .style("stroke", function(d) { 
        return d3.rgb(d.color).darker(2); })
      .append("title")
        .text(function(d) { 
        return d.uid + "\n" + format(d.value); });

    node.on('click', function(d) {
      var visitedNodes = new Set();
      var traversedEdges = new Set();
      getSubgraph(d, visitedNodes, traversedEdges);

      nodesArray = Array.from(visitedNodes);
      edgesArray = Array.from(traversedEdges);

      var newGraph = {
        nodes: nodesArray.map( function(x) { return nodeMap[x] }), 
        links: edgesArray.map( function(x) { return linkMap[x] })
      };

      link.remove();
      node.remove();
      d3.selectAll(".tick").remove();
      $(".tipsy").remove()
      d3.select(".x.axis").remove();
      drawVisualization(newGraph);
    });

    // node.on('mouseout', function(d) {
    //   var nodeSelection = d3.select(this).select('#text_' + d.uid).style("visibility", "hidden");
    // });

    // Tooltips
    $("svg circle").tipsy({
      gravity: 'w',
      html: true,
      title: function() {
        var d = this.__data__;
        return (
          "<span class='callout-text'>" + 
            "<span class='attr-name'> NAME: </span>" + d.description +
            "<br><br>\
            <span class='attr-name'> DATE: </span>" + d.created_at +
            "<span class='attr-name'> DATE: </span>\
            hello" + 
          "</span>"
        );
      }
    });
 }

 function getSubgraph(d, nodes, edges) {
  if (nodes.has(d.uid)) return;

  nodes.add(d.uid);

  function recurseOnLinks(links) {
    links.forEach(function(x) { 
      var edgeID = linkUID(x);
      if (!edges.has(edgeID)) {
        edges.add(edgeID);
        getSubgraph(x.source, nodes, edges);
        getSubgraph(x.target, nodes, edges);
      }
    });
  }

  recurseOnLinks(d.sourceLinks);
  recurseOnLinks(d.targetLinks);
 }

/* Draw grids everytime we zoom the axes */
function redrawAxes(xScale) {
  xAxisTicks = svg.selectAll(".tick line")
    .attr("y1", 0)
    .attr("y2", height)
    .style("stroke", "#ccc");
  
  var startDate = sankey.nodes().minDate();
  var endDate = sankey.nodes().maxDate();
  
    // find ms : px ratio
  var timeDiff = Math.abs(startDate.getTime() - endDate.getTime());
  var screenWidth = width - sankey.nodeWidth();
  var timeToSizeRatio = timeDiff / screenWidth;
  
  var newCoordinates = sankey.nodes().map(function(d) {
    var newX = xScale(stringToDate(d.created_at).getTime());
    
    d3.select('#node_' + d.uid).attr("transform", 
        "translate(" + (d.x = newX) + "," + (d.y = Math.max(margin.top + 30, Math.min(d.y))) + ")");
    sankey.relayout();
    link.attr("d", path);
    return newX;
  });
}
  
/* Add timeline and move nodes to timeline position. */
function drawTimeline() {
  var startDate = sankey.nodes().minDate();
  var endDate = sankey.nodes().maxDate();

  startDate.setDate(startDate.getDate() -20);
  endDate.setDate(endDate.getDate() +20);
// vertical gridlines / x axis 
  var xScale = d3.time.scale()
        .domain([startDate, endDate])
        .range([0, width]);

  var xAxis = d3.svg.axis()
    .orient("top")
    // to change format: https://github.com/d3/d3/wiki/Time-Formatting
    .tickFormat(d3.time.format('%m/%y')) 
    .scale(xScale)

  svg.append("g")
    .attr("transform", "translate(0," + 20 + ")")
    .attr("class", "x axis")
    .call(xAxis);

  xAxisLabels = svg.selectAll(".xAxis text")
    .attr("transform", function(d) {
        return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
    })

  draw = function() {
    svg.select(".x.axis").call(xAxis);
    redrawAxes(xScale);
  }

  var zoom = d3.behavior.zoom()
  .x(xScale)
  .scaleExtent([1, 32])
  .on("zoom", draw);

  redrawAxes(xScale);

  d3.select("#chart").select("svg")
    .call(zoom);
}
 
// the function for moving the nodes
  function dragmove(d) {
    d3.select(this).attr("transform", 
        "translate(" + (
             d.x = d.x
          ) + "," + (
                   d.y = Math.max(margin.top + 30, Math.min(height - d.dy, d3.event.y))
            ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }

  // update card after clicking on a link
  var parent = $("#detail-parent");
  var child = $("#detail-child");

  // Outputs html for code, highlighting matches in red.
  function generateCodeHtml(lines, startDivs, endDivs) {
    var emptySpan = "<span> </span>"
    var newHtml = $("<div class='full-width'> </div>");
    var currentElement = $(emptySpan);
    for (var i = 0; i < lines.length; i++) {
      var lineNumber = i + 1;
      if (lineNumber in startDivs) {
        newHtml.append(currentElement);
        currentElement = $("<div class='match match-" + startDivs[lineNumber] + "'> </div>");
        currentElement.hover(highlight, removeHighlight);
      }

      var newLine = $("<div class='full-width'> </div>");
      newLine.text(lineNumber + "\t" + lines[i]);
      currentElement.append(newLine);

      if (lineNumber in endDivs) {
        newHtml.append(currentElement);
        currentElement = $(emptySpan);
      }
    }
    newHtml.append(currentElement);
    return newHtml;
  }

  // updates the code snippets in the code comparison card
  function updateCode(link) {
    var parentNode = link.source;
    var childNode = link.target;

    var sourceLines = parentNode.code.split(/\n/);
    var targetLines = childNode.code.split(/\n/);
    var newSourceStartDivs = {};
    var newSourceEndDivs = {};
    var newTargetStartDivs = {};
    var newTargetEndDivs = {};

    newSourceStartDivs["count"] = 0;
    for (var i = 0; i < link.links.length; i++) {
      var match = link.links[i];
      var matchNumber = newSourceStartDivs["count"]++;

      newSourceStartDivs[match.source_start_line] = matchNumber;
      newSourceEndDivs[match.source_end_line] = matchNumber;

      newTargetStartDivs[match.target_start_line] = matchNumber;
      newTargetEndDivs[match.target_end_line] = matchNumber;
    }

    parent.find(".code-snippet").html(generateCodeHtml(sourceLines, newSourceStartDivs, newSourceEndDivs));
    child.find(".code-snippet").html(generateCodeHtml(targetLines, newTargetStartDivs, newTargetEndDivs));
  }

  // swaps source and target if an edge is in the wrong order
  function ensureLinkIsDirected(link) {
    var source = link.source;
    var target = link.target;

    if (link.source.created_at > link.target.created_at) {
      var temp = link.source;
      link.source = link.target;
      link.target = temp;
    }
  }

  // updates the code comparison card for a given edge.
  function showEdgeInfo(link) {
    ensureLinkIsDirected(link);
    var parentNode = link.source;
    var childNode = link.target;

    parent.find(".snippet-name").text(parentNode.description)
    parent.find(".author").text(parentNode.uid)
    parent.find(".created-date").text(parentNode.created_at)

    child.find(".snippet-name").text(childNode.description)
    child.find(".author").text(childNode.uid)
    child.find(".created-date").text(childNode.created_at)

    // TODO: replace this with a real edge, that includes real code and line numbers.
    updateCode(link);
  }

  // highlight a specific code match (on hover) using hoveree's class
  function highlight(e) {
    var matchingLines = $("." + e.currentTarget.className.split(" ").join("."));

    $(matchingLines).each(function() {
      $(this).css("background-color", "lightgray");
    })
  }

  // remove highlight after hover ends
  function removeHighlight(e) {
    var matchingLines = $("." + e.currentTarget.className.split(" ").join("."));

    $(matchingLines).each(function() {
      $(this).css("background-color", "white");
    })
  }
});
