#!/usr/bin/python

import json, sys, getopt, re, csv, os

def main(argv):
  mossfile = "main_moss_output_" + argv[0] + ".csv"
  detailfile = "detail_moss_output_" + argv[0] + ".csv"
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
          e["links"] = []
          print e
          links.append(e)
      
    print len(links)
    
    with open(detailfile) as detailed_data:
      detailed_reader = csv.reader(detailed_data, delimiter=',')
      headers = next(detailed_reader, None)
      for row in detailed_reader:
        source = os.path.splitext(os.path.split(row[0])[1])[0]
        target = os.path.splitext(os.path.split(row[4])[1])[0]
        e = next((x for x in links if x["source"]==source and x["target"] == target), None)
        if(e):
          print e
          copy = {}
          copy["source_confidence"] = int(row[1])
          copy["source_start_line"] = int(row[2])
          copy["source_end_line"] = int(row[3])
          copy["target_confidence"] = int(row[5])
          copy["target_start_line"] = int(row[6])
          copy["target_end_line"] = int(row[7])
          e["links"].append(copy)
          print e
    with open('links.json', 'w') as linksfile:
      json.dump(links, linksfile)  
if __name__ == "__main__":
   main(sys.argv[1:])