#!/usr/bin/python

import json, sys, getopt, re, csv, os

def main(argv):
  mossfile = argv[0]
  outfile = "links.json"
  links = []
  with open(mossfile) as moss_data: 
    moss_reader = csv.reader(moss_data, delimiter=',')
    headers = next(moss_reader, None)
    for row in moss_reader:
      # Only create links with more than 10 lines matched
      if(int(row[5]) > 10): 
        # Get file_id
        file1_id = os.path.splitext(os.path.split(row[1])[1])[0]
        file1_data = file1_id.split('_')
        file1_author = file1_data[0]
        file2_id = os.path.splitext(os.path.split(row[3])[1])[0]
        file2_data = file2_id.split('_')
        file2_author = file2_data[0]

        if(file1_author <> file2_author):
          e = {}
          e["source"] = file1_id
          e["target"] = file2_id
          # lines matched
          e["value"] = int(row[5])
          links.append(e)
      
    print len(links)
    with open('links.json', 'w') as linksfile:
      json.dump(links, linksfile)  
if __name__ == "__main__":
   main(sys.argv[1:])