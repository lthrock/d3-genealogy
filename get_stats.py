import urllib
from bs4 import BeautifulSoup
import re
import csv

# CSV output file
primary_output = open("main_moss_output.csv", 'wb')
detail_output = open("detail_moss_output.csv", 'wb')
wr1 = csv.writer(primary_output, quoting=csv.QUOTE_ALL)
wr2 = csv.writer(detail_output, quoting=csv.QUOTE_ALL)

# Fetch moss results, b-e-a-utify
url = "http://moss.stanford.edu/results/63201498/"
f = urllib.urlopen(url)
soup = BeautifulSoup(f.read(), "html.parser")

# Regex for parsing rows in ouptut
# p = re.compile('([a-zA-Z_0-9.]*) \((\d+)%\)')
# Forced to use excessive regex due to malformed html (no </tr> tags...)
p = re.compile('<tr><td><a href="(http://moss.stanford.edu/results/.*.html)">[0-9a-zA-Z.]+ \((\d+)%\)</a>\n<td><a href="http://moss.stanford.edu/results/.*.html">[0-9a-zA-Z.]+ \((\d+)%\)</a>\n<td align="right">(\d+).*')

# to construct links for detailed info on all comparisons reported
comparisonCount =  len(soup.findAll('tr')) - 1

# convert page contents to csv format, output to file
for tr in soup.findAll('tr'):
	m = p.match(str(tr))
	if m:
		row = []
		for i in range(1, 5):
			row.append(m.group(i))
		wr1.writerow(row)

p = re.compile('[.\n]*<th>([0-9a-zA-Z]*.html) \((\d+)%\).*<th>([0-9a-zA-Z]*.html) \((\d+)%\).*')
for i in range(0, comparisonCount):
	# Get new page's html
	newUrl = url + "match" + str(i) + "-top.html"
	f = urllib.urlopen(newUrl)
	soup = BeautifulSoup(f.read(), "html.parser")

	# add data to csv
	m = p.match(str(soup.find('th')))
	name1 = 'error'
	percent1 = 'error'
	name2 = 'error'
	percent2 = 'error'
	if m:
		name1 = m.group(1)
		percent1 = m.group(2)
		name2 = m.group(3)
		percent2 = m.group(4)

	counter = 0
	row = []
	for a in soup.findAll('a'):
		if counter % 2 == 0:
			lineRange = str(a.contents[0])
			if counter % 4 == 0:
				row = [name1, percent1] + lineRange.split('-')
			else:
				row += [name2, percent2] + lineRange.split('-')
				wr2.writerow(row)
		counter += 1