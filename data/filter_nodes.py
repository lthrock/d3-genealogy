#!/usr/bin/python

import json, sys, getopt, re
from datetime import datetime 
from collections import OrderedDict

nodes = []
links = []

def reorderLink(link):
  temp = link["source"]
  link["source"] = link["target"]
  link["target"] = temp
  
  for l in link["links"]:
    temp = l["target_end_line"]
    l["target_end_line"] = l["source_end_line"]
    l["source_end_line"] = temp
    temp = l["target_confidence"]
    l["target_confidence"] = l["source_confidence"]
    l["source_confidence"] = temp
    temp = l["target_start_line"]
    l["target_start_line"] = l["source_start_line"]
    l["source_start_line"] = temp
    
def needsReorder(link):
  # for x in nodes:
  source = next((x for x in nodes if x["uid"] == link["source"]), None)
  target = next((x for x in nodes if x["uid"] == link["target"]), None)
  if source == None or target == None:
    return False
  if (datetime.strptime(source["created_at"],'%Y-%m-%dT%H:%M:%SZ') > datetime.strptime(target["created_at"],'%Y-%m-%dT%H:%M:%SZ') ):
    return True
  return False

def getLineCount(e):
  return e["value"]

def main(argv):

  stronglyConnected = False
  if len(argv) != 0:
    stronglyConnected = argv[0] == "--strong"
  workingDirectory = "pipeline/"  

  # Open files and import json
  linkfile = workingDirectory + 'links.json'
  with open(linkfile) as links_data: 
    links=json.load(links_data)
    links_data.close()
  nodefile = workingDirectory + 'nodes.json'
  with open(nodefile) as nodes_data: 
    nodes=json.load(nodes_data)
    nodes_data.close()

  # filter repeats, merge side-by-side similarities
  for link in links: 
    if (needsReorder(link)):
      reorderLink(link)
    link["links"] = [dict(tupleized) for tupleized in set(tuple(item.items()) for item in link["links"])]
    for link1 in link["links"]:
      for link2 in link["links"]:
        if (link1["source_start_line"] == link2["source_end_line"] + 1 and link1["target_start_line"] == link2["target_end_line"] + 1):
          link1["source_start_line"] = link2["source_start_line"]
          link1["target_start_line"] = link2["target_start_line"]
          link["links"].remove(link2)
        elif (link2["source_start_line"] == link1["source_end_line"] + 1) and (link2["target_start_line"] == link1["target_end_line"] + 1):
          link2["source_start_line"] = link1["source_start_line"]
          link2["target_start_line"] = link1["target_start_line"]
          link["links"].remove(link1)



  nodeParents = {}
  nodeLinks = {}

  for node in nodes:
    uid = node["uid"]
    nodeLinks[uid] = []
    nodeParents[uid] = set()

  links.sort(reverse=True, key=getLineCount)
  filteredLinks = []
  for link in links:
    child = link["target"]
    parents = nodeParents[child]
    # check if there is any similarity in new parent that is not in any other parent
    lineRanges = []
    for sublink in link["links"]:
      start = sublink["target_start_line"]
      end = sublink["target_end_line"]
      if (sublink["target_confidence"] > 5 and end - start >= 5) or  sublink["target_confidence"] > 50:
        newRange = {}
        newRange["start"] = start
        newRange["end"] = end
        lineRanges.append(newRange)

    for existingLink in nodeLinks[child]:
      for similarity in existingLink["links"]:
        start = similarity["target_start_line"]
        end = similarity["target_end_line"]
        for lineRange in lineRanges:
          if ((lineRange["start"] <= start and lineRange["end"] > start + 1) or
             (lineRange["start"] >= start + 1 and lineRange["start"] < end)):
            lineRanges.remove(lineRange)

    if lineRanges:
      filteredLinks.append(link)
      nodeLinks[child].append(link)
      nodeParents[child].add(link["source"])

  parents = filteredLinks


  # Filter out all nodes not contained in links
  node_ids = [e["source"] for e in links]
  node_ids += [e["target"] for e in links]
  nodes = [i for i in nodes if i["uid"] in node_ids]

  # Generate output links
  data = {}
  data["nodes"] = nodes
  data["links"] = parents

  outfilename = workingDirectory + 'final-output.json'
  with open(outfilename, 'w') as outfile: 
    json.dump(data, outfile)

if __name__ == "__main__":
   main(sys.argv[1:])