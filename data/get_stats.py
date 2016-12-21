#!/usr/bin/python

import urllib
from bs4 import BeautifulSoup
import re
import csv
import sys

def main(argv):

  workingDirectory = "pipeline/"

  # CSV output file
  primary_output = open(workingDirectory + 'main_moss_output.csv', 'wb')
  detail_output = open(workingDirectory + 'detail_moss_output.csv', 'wb')
  wr1 = csv.writer(primary_output, quoting=csv.QUOTE_ALL)
  wr2 = csv.writer(detail_output, quoting=csv.QUOTE_ALL)

  wr1.writerow(['Detail Url', 'File 1', 'Confidence', 'File 2', 'Confidence', 'Number of Matched Lines'])
  wr2.writerow(['File 1', 'Confidence', 'Start Line', 'End Line', 'File 2', 'Confidence', 'Start Line', 'End Line'])

  # Fetch moss results, b-e-a-utify
  # url = "http://moss.stanford.edu/results/" + idNumber + "/"
  # url = "file:///Users/lucast/Desktop/d3-genealogy/mosslocal/html/"
  url = "file:///mnt/hgfs/d3-genealogy/mosslocal/html/"
  # htmlContents = open("../mosslocal/html/index.html")
  htmlContents = urllib.urlopen(url + "index.html").read()
  soup = BeautifulSoup(htmlContents, 'html.parser')

  # to construct links for detailed info on all comparisons reported
  comparisonCount =  len(soup.findAll('tr')) - 1

  # skip first row
  rowStartIndex = htmlContents.find('<TR>')
  rowEndIndex = htmlContents.find('<TR>', rowStartIndex + 1)

  while (rowEndIndex != -1):
    rowStartIndex = rowEndIndex
    rowEndIndex = htmlContents.find('<TR>', rowStartIndex + 1)
    rowSoup = BeautifulSoup(htmlContents[rowStartIndex : rowEndIndex], 'html.parser')

    aTags = rowSoup.findAll('a')
    if len(aTags) > 0:
      row = [aTags[0]['href']]
      for a in aTags:
        contents = a.contents[0]

        addressEndIndex = contents.find('.html') + 5
        address = contents[ : addressEndIndex]
        percentEndIndex = contents.find('%', addressEndIndex)
        percentMatch = contents[addressEndIndex + 2 : percentEndIndex]

        numberOfLines = rowSoup.findAll('td')[2].contents[0].strip()

        row.append(address)
        row.append(percentMatch)

      row.append(numberOfLines)	
      wr1.writerow(row)


  # Detail pages:
  for i in range(0, comparisonCount):
    # Get new page's html
    newUrl = url + "match" + str(i) + "-top.html"
    # print newUrl
    htmlContents = urllib.urlopen(newUrl).read()
    soup = BeautifulSoup(htmlContents, "html.parser")


    # skip first row
    rowStartIndex = htmlContents.find('<TR>')
    rowEndIndex = htmlContents.find('<TR>', rowStartIndex + 1)

    rowSoup = BeautifulSoup(htmlContents[rowStartIndex : rowEndIndex], 'html.parser')
    rowContents = str(rowSoup) 

    file1StartIndex = 8
    file1EndIndex = rowContents.find('.html', file1StartIndex) + 5
    file2StartIndex = rowContents.find('.gif"><th>') + 10
    file2EndIndex = rowContents.find('.html', file2StartIndex) + 5

    file1 = rowContents[file1StartIndex : file1EndIndex]
    file2 = rowContents[file2StartIndex : file2EndIndex]

    percent1StartIndex = rowContents.find('(', file1EndIndex) + 1
    percent1EndIndex = rowContents.find('%', percent1StartIndex)
    percent2StartIndex = rowContents.find('(', file2EndIndex) + 1
    percent2EndIndex = rowContents.find('%', percent2StartIndex)

    percent1 = rowContents[percent1StartIndex : percent1EndIndex]
    percent2 = rowContents[percent2StartIndex : percent2EndIndex]

    while rowEndIndex != -1:
      rowStartIndex = rowEndIndex
      rowEndIndex = htmlContents.find('<TR>', rowStartIndex+1)
      rowSoup = BeautifulSoup(htmlContents[rowStartIndex : rowEndIndex], 'html.parser')

      counter = 0
      row = []
      links = soup.findAll('a')
      del links[0 : 6]

      for a in links:
        if counter % 2 == 0:
          lineRange = str(a.contents[0])
          if counter % 4 == 0:
            row = [file1, percent1] + lineRange.split('-')
          else:
            row += [file2, percent2] + lineRange.split('-')
            wr2.writerow(row)
        counter += 1

if __name__ == "__main__":
   main(sys.argv[1:])