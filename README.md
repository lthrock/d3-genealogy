# D3 GENEALOGY

This is a visualization attempt of the genealogy of D3 code. We currently have some basic scripts that retrieve code snippets from blocks and runs them through moss. 

## Data pipeline
Our source data is from the blockbuilder API. You can get raw json files like so:  http://blockbuilder.org/api/search?text=&size=100&sort=created_at&sort_dir=desc&user=&&from=0
Insert a parameter for text=[api call] if interested in a particular api call and save it as [name].json. 

In order to parse the resulting example.json file, call:

    python get_code.py example.json

This will extract all code snippets in username_uniquegistid.html form and save them to the data folder. It will also generate the file, nodes.json. This will contain an array of node data. 

Use the following command to send the parsed files from the data folder to the MOSS server: 

    find ./data -name "*.html" | xargs perl moss.pl

We use xargs to circumvent the command line ARG_MAX limit. 

The MOSS script will yield a weblink of the following form: http://moss.stanford.edu/results/[id_number]

Take the id_number, and use the get_stats.py script to download the raw stats. 

    python get_stats.py [id_number]

This will generate a main_moss_output_[id_number].csv file and a detail_moss_output_[id_number].csv file. 

Use the parse_moss.py script to generate a links.json file. 

    python parse_moss.py [id_number] # (the following is old) main_moss_output_[id_number].csv. 

Finally, call the filter_nodes.py script to generate the nodes-clean.json file. 

    python filter_nodes.py

You should be able to copy the nodes-clean.json file and links.json file into the standard format necessary for generating a sankey. 

This is somewhat long and complicated, until I go back and fix it. 
