/*
 *  NOTE: there are a number of one-line helper methods called frequently
 *        below that are located in another file. To check these out, see:
 *        -* helperMethods.js *-
 */


/*
 * For meta analysis, this is the number of authors included in the prolific
 * authors list
 */
var MAX_AUTHORS_LISTED = 10;
var SERVER_URL = "http://localhost:8080/d3-evo";

var THUMBNAIL_IMAGE_WIDTHS = 230;
var THUMBNAIL_IMAGE_HEIGHTS = 120;
var THUMBNAIL_HW_RATIO = THUMBNAIL_IMAGE_WIDTHS / THUMBNAIL_IMAGE_HEIGHTS;



var margin = { top: 20, right: 20, bottom: 20, left: 20},
    width = window.innerWidth - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom;
var units = "Widgets"; 
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

/*
 *  All colors used in nodes. Every author is assigned to a color
 */
var colorArray = ["#052C94", "#0E2A8C", "#182884", "#22267C", "#2C2474", "#35226D", "#3F2065", "#491E5D", "#531C55", "#5D1A4D", "#661846", "#70163E", "#7A1436", "#84122E", "#8E1026", "#970E1F", "#A10C17", "#AB0A0F", "#B50807", "#BF0700"];
var colors = d3.scale.ordinal().range(colorArray).domain(d3.range(0,20));

/*
 * Used to store the number of blocks by each author, both for the full dataset
 * and for a filtered subset
 */
var authorDic = {};
var fullAuthorDic = {};

/*
 * The currently displayed graph. 
 * This graph must be a subset of all nodes, and may include a filter.
 */
var displayedGraph;

/*
 * This is a binary state, that allows us to not pan the visualization 
 * when someone drags a node vertically.
 */
var circleMoved = false;

/*
 * Another binary state, this is the selected thumbnail mode. 
 * If true, the user has chosen to see author pictures rather than block
 * thumbnails on nodes.
 */
 var authorThumbnailMode = true;

 var scaledWidth = 1;
 var circleRadius;

/*
 * Sends a basic GET request, with callback. 
 * Expects response to be JSON
 */
function sendRequest(callback) {
  $.ajax({
    type: 'GET',
    url: SERVER_URL,
    dataType: "json",
    success: callback
  });
}


sendRequest(fetchGraphCallback);
var nodeMap = {};


function fetchGraphCallback(graph) {
  console.log(graph);
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

  /*
   * Iterate through all links, and find the shortest and longest identified
   * similarities. 
   * 
   * Return info in form: 
   *
   * { min: x, max: y }
   */
  function getValueRange(graph) {
    var result = {};
    result.min = -1;
    result.max = -1;

    graph.links.forEach(function(x) {
      if (result.min == -1) {
        result.min = x.lineCount;
        result.max = x.lineCount;
      }
      result.min = Math.min(x.lineCount, result.min);
      result.max = Math.max(x.lineCount, result.max);
    });
    return result;
  }

  /*
   * Given a graph (may be a filtered version of the full graph),
   * redraw the entire visualization. This includes the ticks, etc.
   */
  function drawVisualization(currGraph) {
    displayedGraph = currGraph;
    drawSankey(currGraph);
    drawTimeline();
  }   

  /*
   * Draw the sankey portion of the graph 
   */
  function drawSankey(currGraph) {

    // Set the sankey diagram properties
    sankey = d3.sankey()
        .nodeWidth(12)
        .nodePadding(10)
        .size([width, height-margin.top])
        .topMargin(3 * margin.top);
    circleRadius = sankey.nodeWidth()  / 2;
     
    path = sankey.link();

    sankey
        .nodes(currGraph.nodes)
        .links(currGraph.links)
        .layout(32);

    /*
     * Links are colored by the number of lines that match between two blocks:
     *    - the more lines, the redder the link will be.
     *
     * That's all that this is doing.
     */
    var valueRange = getValueRange(currGraph);
    var minLinkWeight = valueRange.min;
    var maxLinkWeight = valueRange.max;
    var weightRangeSize = maxLinkWeight - minLinkWeight;

    // radius of thumbnail pictures within nodes
    var thumbnailRadius = sankey.nodeWidth() / 2 - 1;

    // This makes it possible to have circular pictures inside of nodes.
    clipPath = svg.append("defs")
        .append("clipPath")
          .attr("id", "thumbnail-clip")
        .append("circle")
          .attr("r", thumbnailRadius)
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
        .attr("thumb_url", function(d) { return d.thumb_url; })
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
        .attr("r", sankey.nodeWidth() / 2)
        .attr("class", "node-circle")
        .style("fill", function(d) { 
        // color by author
        return d.color = color(author(d)).replace(/ .*/, ""); })
        .style("stroke", function(d) { 
        return d3.rgb(d.color).darker(2); })
      .append("title")
        .text(function(d) { 
        return d.uid + "\n" + format(d.value); });

    scaledWidth = THUMBNAIL_HW_RATIO * thumbnailRadius * 2;

    // add in the images 
    var minDimension = Math.min()
    node.append("svg:image")
      .attr("xlink:href", function(x) {
        return (authorThumbnailMode ?  profilePictureUrl(x) : x.thumb_url)
      })
      .attr("opacity", 0.9)
      .attr("x", authorThumbnailMode ? -thumbnailRadius : -scaledWidth / 2)
      .attr("y", -thumbnailRadius)
          // note: all thumbnails must be the same size, and therefore
          // we need only use height.
      .attr("height", (thumbnailRadius * 2) + "px") 
      .attr("clip-path", "url(#thumbnail-clip)");




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
            <span class='attr-name'> AUTHOR: </span>" + author(d) + "<br>\
            <span class='attr-name'> DATE: </span>" + d.created_at + "<br>\
            <img class='preview' src='" + d.thumb_url + "'>\
          </span>"
        );
      }
    });
  }

  /*
   * Given a node, add its author to the author dictionary (if necessary)
   */
  function addNodeToAuthorDictionary(node) {
    var author = node.substring(0, node.lastIndexOf("_"));
    if (!(author in authorDic)) {
      authorDic[author] = []
    }
    if (!authorDic[author].includes(node)) {
      authorDic[author].push(node);
    }
  }

  /*
   * Responsible for recursing down a given tree while applying a filter 
   * function. 
   *
   * While doing so, will add nodes and edges to their respective 
   * objects to help create the new filtered visualization.
   */
  function getSubgraph(d, nodes, edges, params, filterFunction=function() { return true }) {
    if (nodes.has(d.uid)) return;
    nodes.add(d.uid);

    addNodeToAuthorDictionary(d.uid);

    // loop on each link, and recursively call parent method for each new link.
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

  /*
   * Applies a filter to the visualization.
   *
   * isNodeFilter means ALL nodes must match filter criteria. 
   * Else, only one node in a tree must match and the full tree will be shown.
   */
  // 
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

    // update the "fiteredGraph" to reflect changes
    var filteredGraph = { nodes: [], links: [] };
    filteredNodes.forEach(function(x) {
      filteredGraph.nodes.push(nodeMap[x]);
    });
    filteredLinks.forEach(function(x) {
      filteredGraph.links.push(linkMap[x]);
    });

    // only apply filter if there are things to show
    if (filteredGraph.nodes.length > 0) {
      clearVisualization();
      drawVisualization(filteredGraph);
    }
  }

  /*
   * Clears the visualization completely
   */
  function clearVisualization() {
    node.remove();
    link.remove();
    d3.selectAll(".tick").remove();
    $(".tipsy").remove()
    d3.select(".x.axis").remove();
  }


  /* 
   * Draw grids everytime we zoom the axes 
   */
  function redrawAxes(xScale, yScale) {
    xAxisTicks = svg.selectAll(".tick line")
      .attr("y1", 0)
      .attr("y2", height)
      .style("stroke", "#ccc");

    var whiteBox = svg.select("rect")
                      .attr("width", width)

    
    var startDate = sankey.nodes().minDate();
    var endDate = sankey.nodes().maxDate();
    
    // find ms : px ratio
    var timeDiff = Math.abs(startDate.getTime() - endDate.getTime());
    var screenWidth = width - sankey.nodeWidth() / 2;
    var timeToSizeRatio = timeDiff / screenWidth;

    // This was the best I could do to detect the wheel direction and scale. 
    // I'd like to incorporate some amount of acceleration, but it seems the
    // values associated with the actual event grow exponentially. 
    var movementScale = undefined;
    var radiusScale = undefined;
    var yMovement = 0;
    if (d3.event != null) {
      var event = d3.event.sourceEvent;
      if (event instanceof WheelEvent) {
        var yOffset = event.offsetY

        if (event.wheelDelta > 0) {
          movementScale = 16 / 15;
          radiusScale = 10 / 9;
        } else {
          movementScale = 15 / 16;
          radiusScale = 9 / 10;
        }
      } else if (event instanceof MouseEvent && !circleMoved) {
        yMovement = event.movementY;
      }
    }
    circleMoved = false;

    // For efficiency's sake, first map all ids to their node object
    //    Note: this is not the same node contained by nodeMap
    var vizNodeMap = {};
    Object.keys(nodeMap).forEach(function(uid) {
      var element = d3.select('#node_' + uid);
      if (element.length != 0) {
        vizNodeMap[uid] = element;
      }
    });
    
    // needed to update clip paths
    var newRadius = undefined; // this should get set later

    // now, loop through all nodes and translate them according to new scaling
    // furthermore, adjust node size.
    var newCoordinates = sankey.nodes().map(function(d) {
      var newX = xScale(stringToDate(d.created_at).getTime());
      var newY = d.y + yMovement;

      var currNode = vizNodeMap[d.uid];

      if (movementScale == undefined) {
        currNode.attr("transform", "translate(" + (d.x = newX) + "," +
                                                  (d.y = newY) + ")");
      } else {
        var oldOffset = d.y - yOffset;
        var newOffset = oldOffset * movementScale + yOffset;

        currNode.attr("transform", "translate(" + (d.x = newX) + "," + 
                                                  (d.y = newOffset) + ")")

        // scale the circle based on radiusScale, and set the image width to 
        // always be 2 less than that.
        var circle = currNode.select("circle");
        newRadius  = circle.attr("r") * radiusScale;
        circleRadius = newRadius;
        circle.attr("r", newRadius);

        var scaledWidth = THUMBNAIL_HW_RATIO * newRadius * 2;

        var image = currNode.select("image");
        image.attr("height", newRadius * 2)
             .attr("x", authorThumbnailMode ? -1 * newRadius + 1 : -scaledWidth / 2 + 1)
             .attr("y", -1 * newRadius + 1);
      }

      link.attr("d", path);
      return newX;
    });

    // update clip paths
    if (newRadius != undefined) {
      clipPath.attr("r", newRadius - 1);
    }

    sankey.relayout();
  }
    
  /* 
   * Add timeline and move nodes to their position on thet timeline. 
   */
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

    // Note: to change format - https://github.com/d3/d3/wiki/Time-Formatting
    var xAxis = d3.svg.axis()
      .orient("top")
      .tickFormat(d3.time.format('%m/%y')) 
      .scale(xScale)

    var whiteBox = svg.append("rect")
                     .attr("x", 0)
                     .attr("y", -30)
                     .attr("width", width)
                     .attr("height", 50)
                     .attr("fill", "white");

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
  
  /*
   * When a node is dragged, allow it to move freely vertically.
   * If dragged horizontally, pan the entire visualization
   */
  function dragmove(d) {
    circleMoved = true;
    d3.select(this).attr("transform", 
        "translate(" + (
              d.x = d.x
          ) + "," + ( 
              d.y = Math.max(margin.top + 30, 
                             Math.min(height - d.dy, d3.event.y))
          ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }
}

/*
 * Once document is ready, add click, scroll, and resize listeners:
 *
 * This includes interactions with the canvas, detail view, and the ability to 
 * toggle the detail view on and off.
 */
$(document).ready(function() {

  /*
   * Add on-click functionality radio buttons
   */
  $("#picture-selector :input").change(function() {
    var newMode = this.value == "Author";
    if (newMode == authorThumbnailMode) {
      return;
    }
    authorThumbnailMode = newMode;

    svg.selectAll(".node").each(function(d) {
      var currNode = d3.select(this);
      var image = currNode.select("image");

      image.attr("x", function(x) {
              return authorThumbnailMode ? -1 * circleRadius : -THUMBNAIL_HW_RATIO * circleRadius + 1
           })
            .attr("href", authorThumbnailMode ? profilePictureUrl(d) : d.thumb_url)
                
    });
  });

  /*
   *  Add click listener for the canvas
   */
  var detailView = document.getElementById("diff-row");
  detailView.addEventListener('click', function(event) { 
    canvasClickFunction(event);
  }, false);

  /*
   * Add click listener to left arrow
   */
  var leftArrow = document.getElementById("left-arrow");

  leftArrow.addEventListener('click', function(event) { 
    arrowClickFunction();
  }, false);

  /*
   * Make sure canvas rerenders on resize and scroll
   */
  $(window).on('resize', function(){
    addCanvasHTML(numberOfMatchesPerColumn);
  });

  $("#diff-row").on('scroll', function() {
    addCanvasHTML(numberOfMatchesPerColumn);
  })

  /*
   * Allow the detail view to toggle on and off
   */
  $(".modal-open").click(function() {
    $(".modal-outer").fadeIn('slow');
    addCanvasHTML(numberOfMatchesPerColumn);
  });

  $(".modal-outer").click(function() {
    $(".modal-outer").fadeOut('slow');
  })

  $(".modal-inner").click(function(e) {
    e.stopPropagation();
  })
});

