# D3 GENEALOGY

This is a visualization attempt of the genealogy of D3 code. We currently have some basic scripts that retrieve code snippets from blocks and runs them through moss. 

Within /data:

You can sub out mbostock.json with any other json file from blockbuilder (e.g. http://blockbuilder.org/api/search?text=&size=100&sort=created_at&sort_dir=desc&user=&&from=300), and extract it by running 

python get_code.py

It will extract pieces of code in username_uniquegistid.html form. 
