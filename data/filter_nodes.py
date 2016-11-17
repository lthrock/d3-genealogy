#!/usr/bin/python

import json, sys, getopt, re
from datetime import datetime 

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
  source = next((x for x in nodes if x["uid"] == link["source"]), None)
  target = next((x for x in nodes if x["uid"] == link["target"]), None)
  if( datetime.strptime(source["created_at"],'%Y-%m-%dT%H:%M:%SZ') > datetime.strptime(target["created_at"],'%Y-%m-%dT%H:%M:%SZ') ):
    return True
  return False

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

# TODO (github #15): order links properly by timestamp
for link in links: 
  if (needsReorder(link)):
    reorderLink(link)

# TODO: Change filter algorithm to allow select multiple parentage. 
# Filter links to direct parents only
parents = []
for node in nodes:
  ancestor_links = [link for link in links if link["target"] == node["uid"]]
  if(len(ancestor_links) > 0): 
    ancestors = []
    for link in ancestor_links: 
      ancestor = next((x for x in nodes if x["uid"] == link["source"]), None)
      ancestors.append(ancestor)
    # TODO: compare datetimes, not strings
    ancestors = sorted(ancestors, key=lambda x: datetime.strptime(x["created_at"], '%Y-%m-%dT%H:%M:%SZ'), reverse=True)
    parent_node = ancestors[0]
    parent_link = next(x for x in ancestor_links if x["source"] == parent_node["uid"])
    parents.append(parent_link)

# Generate output links
data = {}
data["nodes"] = nodes
data["links"] = parents

print len(parents)

outfilename = '1000-output.json'
with open(outfilename, 'w') as outfile: 
  json.dump(data, outfile)
