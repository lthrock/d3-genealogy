var MAX_NUMBER_COLORS = 8;

function generateDiffHTML(parentNode, childNode, link) {
  console.log(childNode);
  console.log(parentNode);
  console.log(link);

  var sourceLines = null;
  var targetLines = null;

  var requestsComplete = 0;

  sendRequest(sourceCallback, parentNode.uid);
  sendRequest(targetCallback, childNode.uid);
  
  function sourceCallback(code) {
    sourceLines = code.split(/\n/);
    if (++requestsComplete == 2) {
      constructDiffs();
    }
  }
  
  function targetCallback(code) {
    targetLines = code.split(/\n/);
    if (++requestsComplete == 2) {
      constructDiffs();
    }
  }
  
  function constructDiffs() {
    var newSourceStartDivs = {};
    var newSourceEndDivs = {};

    var newTargetStartDivs = {};
    var newTargetEndDivs = {};

    newSourceStartDivs["count"] = 0;
    var result;

    for (var i = 0; i < link.links.length; i++) {
      var match = link.links[i];
      var matchNumber = newSourceStartDivs["count"]++
      newSourceStartDivs[match.source_start_line] = matchNumber;
      newSourceEndDivs[match.source_end_line] = matchNumber
      newTargetStartDivs[match.target_start_line] = matchNumber;
      newTargetEndDivs[match.target_end_line] = matchNumber;
    }

    result =  [createLines(sourceLines, newSourceStartDivs, newSourceEndDivs, 0), createLines(targetLines, newTargetStartDivs, newTargetEndDivs, 1)];

    // printElement(result[1]);
    $(".code-container.code-box-0").html(result[0]);
    $(".code-container.code-box-1").html(result[1]);
  }

  function printElement(element) {
    var asString = $('<div/>').append(element).clone().html();
    console.log(asString);
  }

  function numberOfDigits(x) {
    return x.toString().length;
  }

  function createLines(lines, startDivs, endDivs, side) {
    var emptySpan = "<span> </span>"
    var newHTML = $(emptySpan);
    var currentElement = $(emptySpan);

    var inMatchBlock = false;
    var inNoMatchBlock = false;
    var noMatchBlockStart = -1;

    var maxDigits = numberOfDigits(lines.length);

    for (var i = 0; i < lines.length; i++) {
      var lineNumber = i + 1;

      /* Reached start of block? 
       *    - end noMatchBlock if necessary
       *    - start matchBlock
       */
      if (lineNumber in startDivs) {
        inMatchBlock = true;
        if (inNoMatchBlock) {
          inNoMatchBlock = false;

          var idNumber = side + "-" + noMatchBlockStart; 
          var lineRange;

          // No "range" if it's just one line.
          if (noMatchBlockStart == lineNumber - 1) {
            lineRange = noMatchBlockStart;
          } else {
            lineRange = noMatchBlockStart + "-" + (lineNumber - 1);
          }

          var collapseLink = $("<a class='hidden-code' data-toggle='collapse' data-target='#collapse-" + idNumber + "'> <b>" + lineRange + "</b> </a>");

          if (lineNumber == 71) {
            console.log("-----------------------------------------------");
          }

          newHTML.append(collapseLink);
        // console.log("A"); //-------------------------------
        }

        newHTML.append(currentElement);
        // console.log("B"); //-------------------------------
        var colorNumber = startDivs[lineNumber] % MAX_NUMBER_COLORS;
        currentElement = $("<div class='match-block color-" + colorNumber + "'></div>");

      /* 
       * If you're starting a no match block:
       *    - Create a new collapsing element
       *    - The actual link that comes before collapsing section will be
       *      created at completion.
       */
      } else if (!inMatchBlock && !inNoMatchBlock) {
        inNoMatchBlock = true;
        // console.log("+++++++++++++++++++++++++++++++++++++++++++++++++");
        noMatchBlockStart = lineNumber;
        currentElement = $("<div id='collapse-" + side + "-" + noMatchBlockStart + "' class='collapse'>");
      }

      var line = $("<div class='code-line'></div>");
      line.text(lines[i]);
      var lineNumberSpan = $("<span class='line-number'>" + lineNumber + "</span>");
      for (var j = numberOfDigits(lineNumber); j < maxDigits; j++) {
        lineNumberSpan.append("&nbsp;");
      }

      line.prepend(lineNumberSpan);
      currentElement.append(line);
      // console.log("C"); //-------------------------------***

      if (lineNumber in endDivs) {
        inMatchBlock = false;
        newHTML.append(currentElement);
        // console.log("end div: " + lineNumber.toString());
        // console.log(startDivs);
        // console.log(endDivs);
        // console.log("D"); //-------------------------------
        currentElement = $(emptySpan);
      }
    }
    if (inNoMatchBlock) {
      inNoMatchBlock = false;

      var idNumber = side + "-" + noMatchBlockStart; 
      var lineRange = noMatchBlockStart + "-" + lineNumber;
      var collapseLink = $("<a class='hidden-code' data-toggle='collapse' data-target='#collapse-" + idNumber + "'> <b>" + lineRange + "</b> </a>");

      newHTML.append(collapseLink);
      // console.log("E"); //-------------------------------
    }
    newHTML.append(currentElement);
    // console.log("F"); //-------------------------------
    // printElement(newHTML);
    return newHTML;
  }
}