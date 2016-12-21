#!/usr/bin/python

import json, sys, getopt, re, csv, os
# from sets import Set

links = []

def getFileID(filename):
  file_id = os.path.splitext(os.path.split(filename)[1])[0]
  return file_id

# Takes in a filename of the form author_gistid.html 
# and extracts the author
def getAuthor(file_id): 
  author = file_id.split('_')[0]
  return author
  
# Get links for each pair of matched code snippets
def getLinks(mossfile):
  with open(mossfile) as moss_data: 
    moss_reader = csv.reader(moss_data, delimiter=',')
    headers = next(moss_reader, None)
    for row in moss_reader:

      # Only create links with more than 10 lines matched
      # if(int(row[5]) > 10): 

      # Get file_ids and authors
      file1_id = getFileID(row[1])
      file1_author = getAuthor(file1_id)
      file2_id = getFileID(row[3])
      file2_author = getAuthor(file2_id)

      e = {}
      e["source"] = file1_id
      e["target"] = file2_id
      # number of lines matched
      e["value"] = int(row[5])
      e["links"] = []

      links.append(e)

# Get specific line matches for each link
def getDetails(detailfile):
  with open(detailfile) as detailed_data:
    detailed_reader = csv.reader(detailed_data, delimiter=',')
    headers = next(detailed_reader, None)

    for row in detailed_reader:
      source = os.path.splitext(os.path.split(row[0])[1])[0]
      target = os.path.splitext(os.path.split(row[4])[1])[0]

      e = next((x for x in links if x["source"]==source and x["target"] == target), None)
      if(e):

        copy = {}
        copy["source_confidence"] = int(row[1])
        copy["source_start_line"] = int(row[2])
        copy["source_end_line"] = int(row[3])
        copy["target_confidence"] = int(row[5])
        copy["target_start_line"] = int(row[6])
        copy["target_end_line"] = int(row[7])
        e["links"].append(copy)


# def matchLength(e):
#   return e["value"]

# def createNodeSets():
#   for link in links:
#     nodeLinks[link] = set()
#     nodeParents[link] = set()
#     nodeParents[link].add(link)

# def filterLinks(links):
#   links.sort(key=matchLength, reverse=true)
#   createNodeSets(links)
#   for link in links:
#     source = link["source"]
#     target = link["target"]


          
def main(argv):
  workingDirectory = "pipeline/"

  mossfile = workingDirectory + "main_moss_output.csv"
  detailfile = workingDirectory + "detail_moss_output.csv"
  outfile = workingDirectory + "links.json"
  getLinks(mossfile)  
  getDetails(detailfile)

  # new linking:
  # filterLinks(links)

  with open(outfile, 'w') as linksfile:
    json.dump(links, linksfile) 
    
if __name__ == "__main__":
   main(sys.argv[1:])