#!/usr/bin/python

import json, sys, getopt, re

#def main(argv):
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
print len(nodes)

cleanedfile = 'nodes-clean.json'
with open(cleanedfile, 'w') as clean_file:
  json.dump(nodes, clean_file)
