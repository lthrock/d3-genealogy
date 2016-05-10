import json


with open('force-layout.json') as json_data: 
  d=json.load(json_data)
  json_data.close()

code_array = d["hits"]["hits"]

for element in code_array:
  gistid = element["_id"]
  e = element["_source"]
  code = e["code"].encode('ascii', 'ignore')
  author = e["userId"]
  
  filename = author + '_' + gistid + '.html'
  outfile = open(filename, 'w')
  outfile.write(code)
  
#  print e["created_at"]
#  print e["updated_at"]
#  print e["api"]
#  print e["readme"]
#  print e["description"]

