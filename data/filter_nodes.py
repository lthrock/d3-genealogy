#!/usr/bin/python

import json, sys, getopt, re

# Open files and import json
linkfile = 'links.json'
with open(linkfile) as links_data: 
  links=json.load(links_data)
  links_data.close()
nodefile = 'nodes.json'
with open(nodefile) as nodes_data: 
  nodes=json.load(nodes_data)
  nodes_data.close()

# Filter out all nodes not contained in links
node_ids = [e["source"] for e in links]
node_ids += [e["target"] for e in links]
nodes = [i for i in nodes if i["uid"] in node_ids]


# Filter links to direct parents only
parents = []
for node in nodes:
  ancestor_links = [link for link in links if link["target"] == node["uid"]]
  if(len(ancestor_links) > 0): 
    ancestors = []
    for link in ancestor_links: 
      ancestor = next((x for x in nodes if x["uid"] == link["source"]), None)
      ancestors.append(ancestor)
      
    ancestors = sorted(ancestors, key=lambda x: x["created_at"], reverse=True)
    parent_node = ancestors[0]
    parent_link = next(x for x in ancestor_links if x["source"] == parent_node["uid"])
    parents.append(parent_link)

# Generate output links
data = {}
data["nodes"] = nodes
data["links"] = parents

outfilename = 'd3-mouse-output.json'
with open(outfilename, 'w') as outfile: 
  json.dump(data, outfile)
