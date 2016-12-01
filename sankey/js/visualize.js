 
var MAX_AUTHORS_LISTED = 10; // Max length of prolific author list

var units = "Widgets";

var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = window.innerWidth - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;
 
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

var colorArray = ["#052C94", "#0E2A8C", "#182884", "#22267C", "#2C2474", "#35226D", "#3F2065", "#491E5D", "#531C55", "#5D1A4D", "#661846", "#70163E", "#7A1436", "#84122E", "#8E1026", "#970E1F", "#A10C17", "#AB0A0F", "#B50807", "#BF0700"];

var colors = d3.scale.ordinal().range(colorArray).domain(d3.range(0,20));

var authorDic = {};
var fullAuthorDic = {};

var nodesZoomed = false;
var displayedGraph;
var circleMoved = false;

// Helper methods
function stringToDate(str) {
  return new Date(Date.parse(str));
}

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

// params[0] -> author
function authorFilter(node, params) {
  return node.uid.startsWith(params[0] + "_"); 
}

// params[0] -> api name
function apiFilter(node, params) {
  return node.api.includes(params[0]); 
}



sendRequest(fetchGraphCallback);

function sendRequest(callback, uid=null) {
  var params = "";
  var datatype = "json";
  if (uid != null) {
    params = "?uid=" + uid
    datatype = "text";
  }
  $.ajax({
    type: 'GET',
    url: "http://localhost:8080/d3-evo" + params,
    dataType: datatype, // data type of response
    success: callback
  });
}

var nodeMap = {};

function fetchGraphCallback(graph) {
  var linkMap = {};
  graph.nodes.forEach(function(x) { 
    nodeMap[x.uid] = x;
    addNodeToAuthorDictionary(x.uid);
  });

  fullAuthorDic = JSON.parse(JSON.stringify(authorDic));

  graph.links = graph.links.map(function(x) {
    return {
      source: nodeMap[x.source],
      target: nodeMap[x.target],
      value: x.value,
      lineCount: x.value,
      links: x.links
    };
  });

  graph.links.forEach(function(x) { linkMap[linkUID(x)] = x; });

  var link, node, circle, xAxisLabels, xAxisLines, sankey, path, clipPath;
  drawVisualization(graph);

  $(".resetButton").click(function() {
    link.remove();
    node.remove();
    d3.selectAll(".tick").remove();
    d3.selectAll(".x.axis").remove();
    authorDic = fullAuthorDic;
    drawVisualization(graph);
  });

  var authorTextField = $(".authorFilter");
  authorTextField.keypress(function(e) { 
    e = e || window.event;
    var charCode = e.keyCode || e.which;

    if (charCode == 13) {
      e.preventDefault();
      var author = authorTextField.val();

      applyFilter(displayedGraph, authorFilter, [author]);
    }
  });

  var apiTextField = $(".apiFilter");
  apiTextField.keypress(function(e) { 
    e = e || window.event;
    var charCode = e.keyCode || e.which;

    if (charCode == 13) {
      e.preventDefault();
      var api = apiTextField.val();
      applyFilter(displayedGraph, apiFilter, [api]);
    }
  }) 

  function getValueRange(graph) {
    var minLinkValue = -1;
    var maxLinkValue = -1;
    graph.links.forEach(function(x) {
      if (minLinkValue == -1) {
        minLinkValue = x.lineCount;
        maxLinkValue = x.lineCount;
      }
      minLinkValue = Math.min(x.lineCount, minLinkValue);
      maxLinkValue = Math.max(x.lineCount, maxLinkValue);
    });
    return [minLinkValue, maxLinkValue];
  }

  function drawVisualization(currGraph) {
    displayedGraph = currGraph;
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

    var valueRange = getValueRange(currGraph);
    var minLinkWeight = valueRange[0];
    var maxLinkWeight = valueRange[1];
    var weightRangeSize = maxLinkWeight - minLinkWeight;

    clipPath = svg.append("defs")
        .append("clipPath")
          .attr("id", "thumbnail-clip")
        .append("circle")
          .attr("r", 15)
          .attr("cx", 0)
          .attr("cy", 0);

    // add in the links
    link = svg.append("g").selectAll(".link")
        .data(currGraph.links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .on("click", function(d) {
          showEdgeInfo(d);
        })
        .style("stroke-width", 2)
        .style("stroke", function(d) { 
          var index = Math.min((d.lineCount - minLinkWeight) / (weightRangeSize / colorArray.length), colorArray.length - 1);
          return d.color = colors(index);
        });
        
   
    // add the link titles
    link.append("title")
          .text(function(d) {
          return d.source.description + " → " + 
                  d.target.description + "\n" + format(d.value); 
          });

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
        .attr("class", "node-circle")
        .style("fill", function(d) { 
        // color by author
        return d.color = color(d.uid.substring(0, d.uid.lastIndexOf("_")).replace(/ .*/, "")); })
        .style("stroke", function(d) { 
        return d3.rgb(d.color).darker(2); })
      .append("title")
        .text(function(d) { 
        return d.uid + "\n" + format(d.value); });

    // node
    //     .append("clipPath")
    //       .append("circle")
    //         .attr("x", 0)
    //         .attr("y", 0)
    //         .attr("width", "20px")
    //         .attr("height", "20px")
    //         .attr("color", "blue");


    node.on('click', function(d) {
      // showNodeAndThreeDescendants(d);

      createNewPathWithRoot(d);

      // var visitedNodes = new Set();
      // var traversedEdges = new Set();
      // authorDic = {};
      // getSubgraph(d, visitedNodes, traversedEdges);

      // nodesArray = Array.from(visitedNodes);
      // edgesArray = Array.from(traversedEdges);

      // var newGraph = {
      //   nodes: nodesArray.map( function(x) { return nodeMap[x] }), 
      //   links: edgesArray.map( function(x) { return linkMap[x] })
      // };

      // clearVisualization();
      // drawVisualization(newGraph);
    });

    // Tooltips
    $("svg circle.node-circle").tipsy({
      gravity: 'w',
      html: true,
      title: function() {
        var d = this.__data__;
        return (
          "<div class='callout-text'>" + 
            "<span class='attr-name'> NAME: </span>" + d.description +
            "<br>\
            <span class='attr-name'> AUTHOR: </span>" + d.uid.substring(0, d.uid.lastIndexOf("_")) + "<br>\
            <span class='attr-name'> DATE: </span>" + d.created_at + "<br>\
            <img class='preview' src='assets/thumbnail1.png'>\
          </span>"
        );
      }
    });
  }

  function addNodeToAuthorDictionary(node) {
    var author = node.substring(0, node.lastIndexOf("_"));
    if (!(author in authorDic)) {
      authorDic[author] = []
    }
    if (!authorDic[author].includes(node)) {
      authorDic[author].push(node);
    }
  }

  function getSubgraph(d, nodes, edges, params, filterFunction=function() { return true }) {
    if (nodes.has(d.uid)) return;
    nodes.add(d.uid);

    addNodeToAuthorDictionary(d.uid);

    function recurseOnLinks(links) {
      links.forEach(function(x) { 
        var edgeID = linkUID(x);
        if (!edges.has(edgeID) 
                && filterFunction(x.source, params) 
                && filterFunction(x.target, params)) {
          edges.add(edgeID);
          getSubgraph(x.source, nodes, edges);
          getSubgraph(x.target, nodes, edges);
        }
      });
    }

    recurseOnLinks(d.sourceLinks);
    recurseOnLinks(d.targetLinks);
  }

  // isNodeFilter means all nodes must match filter criteria. Otherwise, only one node in a tree must match for the tree to be shown.
  function applyFilter(unfilteredGraph, filterFunction, params, isNodeFilter=false) {
    authorDic = {};

    var nodesToCheck = new Map();
    unfilteredGraph.nodes.forEach(function(node) {
      nodesToCheck.set(node.uid, node);
    });

    var filteredNodes = new Set();
    var filteredLinks = new Set();

    while (nodesToCheck.size != 0) {
      for (var [key, value] of nodesToCheck) {
        var visitedNodes = new Set();
        var traversedEdges = new Set();

        if (filterFunction(value, params)) {
          if (isNodeFilter) {
            getSubgraph(value, visitedNodes, traversedEdges, params, filterFunction);
          } else {
            getSubgraph(value, visitedNodes, traversedEdges);
          }

          visitedNodes.forEach(function(node) {
            filteredNodes.add(node);
            nodesToCheck.delete(key);
          })
          traversedEdges.forEach(function(link) {
            filteredLinks.add(link);
          })
        } 
        nodesToCheck.delete(key);
        

        // lol, yes, i do want this to break. Wasn't sure how else just to pop an element out of the map. Derp derp.
        break;
      }
    }
    var filteredGraph = { nodes: [], links: [] };
    filteredNodes.forEach(function(x) {
      filteredGraph.nodes.push(nodeMap[x]);
    });
    filteredLinks.forEach(function(x) {
      filteredGraph.links.push(linkMap[x]);
    });


    if (filteredGraph.nodes.length > 0) {
      clearVisualization();
      drawVisualization(filteredGraph);
    }
  }

  function clearVisualization() {
    node.remove();
    link.remove();
    d3.selectAll(".tick").remove();
    $(".tipsy").remove()
    d3.select(".x.axis").remove();
  }


  /* Draw grids everytime we zoom the axes */
  function redrawAxes(xScale, yScale) {
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

    var scale = null;
    var yMovement = 0;
    if (d3.event != null) {
      var event = d3.event.sourceEvent;
      if (event instanceof WheelEvent) {
        var yOffset = event.offsetY

        if (event.wheelDelta > 0) {
          scale = 4 / 3;
        } else {
          scale = 3 / 4;
        }
      } else if (event instanceof MouseEvent && !circleMoved) {
        yMovement = event.movementY;
      }
    }
    circleMoved = false;
    
    var newCoordinates = sankey.nodes().map(function(d) {
      var newX = xScale(stringToDate(d.created_at).getTime());
      var newY = d.y + yMovement;

      if (scale == null) {
        d3.select('#node_' + d.uid).attr("transform", 
            "translate(" + (d.x = newX) + "," + 
            (d.y =  newY) + ")");
            // (d.y = Math.max(margin.top + 30, d.y)) + ")");
      } else {
        var oldOffset = d.y - yOffset;
        var newOffset = oldOffset * scale + yOffset;

        d3.select('#node_' + d.uid).attr("transform", 
            "translate(" + (d.x = newX) + "," + (d.y = newOffset) + ")");
      }
      link.attr("d", path);
      return newX;
    });

    sankey.relayout();

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
    var yScale = d3.time.scale()
          .domain([0, height])
          .range([0, height]);

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
      redrawAxes(xScale, yScale);

      var nodes = jQuery(".node");
      var counter = 0;
      for (var i = 0; i < nodes.length; i++) {
        var currNode = nodes[i];
        var rect = currNode.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width) {
            counter++;
          }
      }

      var zoomedIn = counter < 64;
      if (nodesZoomed != zoomedIn) {
        var nodeCircle = svg.selectAll('.node-circle');
        // toggle node display type
        if (zoomedIn) {
          nodeCircle.attr('r', 18);

          node.append("svg:image")
            .attr("xlink:href", "assets/thumbnail1.png")
            .attr("opacity", 0.9)
            .attr("x", -15)
            .attr("y", -15)
            .attr("width", "30px")
            .attr("height", "30px")
            .attr("clip-path", "url(#thumbnail-clip)");
        } else {
          svg.selectAll("image").remove();
          nodeCircle.attr('r', sankey.nodeWidth());
        }
        nodesZoomed = zoomedIn;
      }
    }

    var zoom = d3.behavior.zoom()
    .x(xScale)
    .y(yScale)
    .scaleExtent([1, 32])
    .on("zoom", draw);

    redrawAxes(xScale, yScale);

    d3.select("#chart").select("svg")
      .call(zoom);
  }
 
// the function for moving the nodes
  function dragmove(d) {
    circleMoved = true;
    console.log("happening")
    d3.select(this).attr("transform", 
        "translate(" + (
              d.x = d.x
          ) + "," + ( 
              d.y = Math.max(margin.top + 30, Math.min(height - d.dy, d3.event.y))
            ) + ")");
    sankey.relayout();
    link.attr("d", path);
    console.log("happened;")
  }
}


$(document).ready(function() {
  var detailView = document.getElementById("diff-row");

  detailView.addEventListener('click', function(event) { 
    canvasClickFunction(event);
  }, false);


  var leftArrow = document.getElementById("left-arrow");

  leftArrow.addEventListener('click', function(event) { 
    arrowClickFunction();
  }, false);

  $(window).on('resize', function(){
    addCanvasHTML(numberOfMatchesPerColumn);
  });

  $("#diff-row").on('scroll', function() {
    addCanvasHTML(numberOfMatchesPerColumn);
  })

  var buttonClosedStateText = "Show Detail View";
  var buttonOpenedStateText = "Hide Detail View";
  $(".modal-open").html(buttonClosedStateText);

  $(".modal-open").click(function() {
    var content = $(".modal-open").html();
    if (content == buttonClosedStateText) {
      $(".modal-open").html(buttonOpenedStateText);
      $(".modal-outer").fadeIn('slow');

      addCanvasHTML(numberOfMatchesPerColumn);
    } else {
      $(".modal-open").html(buttonClosedStateText);
      $(".modal-outer").fadeOut('slow');
    }
  });

  $(".modal-outer").click(function() {
    var buttonClosedStateText = "Show Detail View";
    $(".modal-open").html(buttonClosedStateText);
    $(".modal-outer").fadeOut('slow');
  })

  $(".modal-inner").click(function(e) {
    e.stopPropagation();
  })
});

