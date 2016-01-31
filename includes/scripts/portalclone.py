import os
import re
import sys

parent_dir = os.path.abspath(os.path.dirname(__file__))
libs_dir = os.path.join(parent_dir, 'libs')
sys.path.append(libs_dir)

import requests
import urlparse
import tinycss
import collections
from bs4 import BeautifulSoup
	
if len(sys.argv) < 3:
	sys.exit("Usage: python portalclone.py <PortalName> <PortalArchive> <Options (';' delimited string)> <TestURL> <InjectSet>")

portalName = sys.argv[1]
localNDS = sys.argv[2] + portalName + "/"
options = sys.argv[3].split(";")
url = sys.argv[4]
injectSet = sys.argv[5]
splashFile = localNDS + "splash.html"
requiredPaths = [localNDS, localNDS + "images/"]
basePath = '/pineapple/components/infusions/portalauth/'

# Create a dictionary for URLs found in CSS files
css_urls = collections.defaultdict(list)

def find_meta_refresh(r):
	soup = BeautifulSoup(r.text, "html.parser")
	for meta in soup.find_all("meta"):
		if meta.has_attr("http-equiv"):
			if "url=" in meta.get("content").lower():
				text = meta.get("content").split(";")[1]
				text = text.strip()
				if text.lower().startswith("url="):
					new_url=text[4:]
					return True, new_url
	return False, r

def follow_redirects(r,s):
	redirected, new_url = find_meta_refresh(r)
	if redirected:
		r = follow_redirects(s.get(urlparse.urljoin(r.url, new_url)), s)
	return r

def downloadFile(r,name):
	with open(localNDS + "images/" + name, 'wb') as out_file:
			for chunk in r.iter_content(4096):
				out_file.write(chunk)
	
def parseCSS(_url):
	r = requests.get(_url)
	urls = []
	parser = tinycss.make_parser('page3')
	try:
		stylesheet = parser.parse_stylesheet(r.text)
		for rule in stylesheet.rules:
			for dec in rule.declarations:
				for token in dec.value:
					if token.type == "URI":
						# Strip out anything not part of the URL and append it to the list
						urls.append(token.as_css().replace("url(","").replace(")","").strip('"\''))
	except:
		pass
	return urls
	
def checkFileName(orig):
	filename, file_ext = os.path.splitext(orig)
	path = localNDS + "images/%s%s" % (filename, file_ext)
	fname = orig
	uniq = 1
	while os.path.exists(path):
		fname = "%s_%d%s" % (filename, uniq, file_ext)
		path = localNDS + "images/" + fname
		uniq += 1
	return fname

# Check if the proper directories exist and create them if not
for path in requiredPaths:
        if not os.path.exists(path):
                os.makedirs(path)

# Attempt to open an external web page and load the HTML
response = requests.get(url, verify=False)

# Get the actual URL - This accounts for redirects
url = response.url

# Set up the url as our referer to get access to protected images
s = requests.Session()
s.headers.update({'referer':url})

# Follow any meta refreshes that exist before continuing
response = follow_redirects(response, s)

# Create a BeautifulSoup object to hold our HTML structure
soup = BeautifulSoup(response.text, "html.parser")

# Download all linked JS files and remove all inline JavaScript
# from the document if the stripjs option is enabled
for script in soup.find_all('script'):
	if script.has_attr('src'):
		fname = str(script.get('src')).split("/")[-1]
		r = s.get(urlparse.urljoin(url, script.get('src')), stream=True, verify=False)
		downloadFile(r,fname)
		script['src'] = "$imagesdir/" + fname
	
	if "stripjs" in options:
		script.clear()

# Add user defined functions from injectJS.txt
if "injectjs" in options:
	with open(basePath + 'includes/scripts/injects/'+injectSet+'/injectJS.txt', 'r') as injectJS:
		soup.head.append(injectJS.read())

# Search through all tags for the style attribute and gather inline CSS references
for tag in soup():
	if tag.has_attr('style'):
		if "stripcss" in options:
			tag['style'] = ""
		else:
			for dec in tag['style'].split(";"):
				token = dec.split(":")[-1]
				token = token.strip()
				if token.lower().startswith("url"):
					imageURL = token.replace("url(","").replace(")","").strip('"\'')
					fname = imageURL.split("/")[-1]
					r = s.get(urlparse.urljoin(url, imageURL), stream=True, verify=False)
					downloadFile(r, fname)

					# Change the inline CSS
					tag['style'].replace(imageURL, "$imagesdir/" + fname)

# Search for CSS files linked with the @import statement and remove
# all inline CSS from the document if the stripcss option is enabled
for style in soup.find_all("style"):
	if "stripcss" in options:
		style.clear()
	else:
		parser = tinycss.make_parser('page3')
		stylesheet = parser.parse_stylesheet(style.string)
		for rule in stylesheet.rules:
			if rule.at_keyword == "@import":
				fname = str(rule.uri).split("/")[-1]
				r = s.get(urlparse.urljoin(url, rule.uri), stream=True, verify=False)
				downloadFile(r, fname)
				
				# Parse the CSS to get image links
				_key = "images/" + fname
				css_urls[_key] = parseCSS(urlparse.urljoin(url, rule.uri))
				
				# Replace the old link of the CSS with the new one
				modStyle = style.string
				style.string.replace_with(modStyle.replace(rule.uri, "$imagesdir/" + fname))

# Add user defined CSS from injectCSS.txt
if "injectcss" in options:
	with open(basePath + 'includes/scripts/injects/'+injectSet+'/injectCSS.txt', 'r') as injectCSS:
		soup.head.append(injectCSS.read())

# Find all forms, remove the action and clear the form
if "stripforms" in options:
	for form in soup.find_all('form'):
		# Clear the action attribute
		form['action'] = ""

		# Clear the form
		form.clear()

# Append our HTML elements to the body of the web page
if "injecthtml" in options:
	with open(basePath + 'includes/scripts/injects/'+injectSet+'/injectHTML.txt', 'r') as injectHTML:
		soup.body.append(injectHTML.read())

# Find and clear all href attributes from a tags
if "striplinks" in options:
	for link in soup.find_all('a'):
		link['href'] = ""

# Find and download all images and css files
for img in soup.find_all(['img', 'link', 'embed']):
	if img.has_attr('href'):
		tag = "href"
	elif img.has_attr('src'):
		tag = "src"
	
	# Parse the tag to get the file name
	fname = str(img.get(tag)).split("/")[-1]
	
	# Strip out any undesired characters
	pattern = re.compile('[^a-zA-Z0-9_.]+', re.UNICODE)
	fname = pattern.sub('', fname)
	fname = fname[:255]
	
	if fname == "":
		continue
	if fname.rpartition('.')[1] == "":
		fname += ".css"
	if fname.rpartition('.')[2] == "css":
		_key = "images/" + fname
		css_urls[_key] = parseCSS(urlparse.urljoin(url, img.get(tag)))

	# Download the file
	checkedName = checkFileName(fname)
	r = s.get(urlparse.urljoin(url, img.get(tag)), stream=True, verify=False)
	downloadFile(r, checkedName)
	
	# Change the image src to look for the image in $imagesdir
	img[tag] = "$imagesdir/" + checkedName
	
# Download any images found in the CSS file and change the link to $imagesdir
# This occurs AFTER the CSS files have already been copied
for css_file, urls in css_urls.iteritems():

	# Open the CSS file and get the contents
	fh = open(localNDS + css_file).read().decode('utf-8')

	# Iterate over the URLs associated with this CSS file
	for _fileurl in urls:

		# Get the image name
		fname = _fileurl.split("/")[-1]

		# Download the image from the web server
		checkedName = checkFileName(fname)
		try:
			r = s.get(urlparse.urljoin(url, _fileurl), stream=True, verify=False)
			downloadFile(r, checkedName)
		except:
			pass
		
		# Change the link in the CSS file
		fh = fh.replace(_fileurl, checkedName)

	# Write the contents back out to the file
	fw = open(localNDS + css_file, 'w')
	fw.write(fh.encode('utf-8'))
	fw.flush()
	fw.close()

# Write the file out to splash.html
with open(splashFile, 'w') as splash:
	splash.write((soup.prettify(formatter=None)).encode('utf-8'))

print "Complete"
