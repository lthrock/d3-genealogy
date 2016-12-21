#!/usr/bin/python

import json, sys, getopt, re, random, os, shutil
from sets import Set
from bs4 import BeautifulSoup

# Usage: ./get_code.py -i <inputfile>

def main(argv): 
  workingDirectory = "pipeline/"
  inputfile = workingDirectory + argv[0]

  # Remove any old output
  outputDirectory = workingDirectory + "data/"
  try:
    shutil.rmtree(outputDirectory)
  except OSError:
    pass
  os.makedirs(outputDirectory) 
  
  with open(inputfile) as json_data: 
    d=json.load(json_data)
    json_data.close()
  code_array = d["hits"]["hits"]
  
  output_json = []
  uniqueIds = Set()
  numThumbnails = 0
  
  for element in code_array:
    gistid = element["_id"]
    e = element["_source"]
    code = e["code"].encode('ascii', 'ignore')
    author = e["userId"]
    
    code = get_js_only(code)

    uniqueIds.add(gistid)

    if (code != None):
      # if (author == "mbostock" or random.randint(0, 2) == 0):
      filename = workingDirectory + 'data/' + author + '_' + gistid + '.html'
      outfile = open(filename, 'w')
      outfile.write(code)
      simple_e = {}
      simple_e["uid"] = author + '_' + gistid
      simple_e["created_at"] = e["created_at"]
      simple_e["updated_at"] = e["updated_at"]
      simple_e["api"] = e["api"]
      simple_e["readme"] = e["readme"]
      simple_e["description"] = e["description"]
      simple_e["code"] = code # e["code"]
      if ("thumbnail.png" in e["filenames"]):
        host = "https://gist.githubusercontent.com/"
        thumbId = e["thumb"]
        filename = "/thumbnail.png"
        simple_e["thumb_url"] = host + author + "/" + gistid + "/raw/" + thumbId + filename
        numThumbnails += 1

      output_json.append(simple_e)
  
  print "unique blocks: " + str(len(uniqueIds))
  print "blocks with code: " + str(len(output_json))
  print "blocks with thumbnails: " + str(numThumbnails)

  with open(workingDirectory + 'nodes.json', 'w') as datafile:
    json.dump(output_json, datafile)   
    
def get_js_only(code):  
  soup = BeautifulSoup(code, "lxml")
  scriptTags = soup.find_all("script")
  if (len(scriptTags) != 0):
    jsCode = ""
    for tag in scriptTags:
      if (jsCode != ""):
        jsCode += "\n"
      jsCode += str(tag)
    return jsCode
  else:
    return None

  # re.DOTALL
  # re.MULTILINE
  # match = re.search('<script.*>.*</script>', code, re.DOTALL)
  # if(match != None):
  #   print "\n\n-------------------------------------------------------------"
  #   print match.group(0)
  #   return match.group(0)
  # else:
  #   # print "\n\n-------------------------------------------------------------"
  #   # print code
  #   return None
  
if __name__ == "__main__":
   main(sys.argv[1:])