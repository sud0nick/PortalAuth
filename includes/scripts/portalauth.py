import sys
import requests
import urlparse
from bs4 import BeautifulSoup

url = 'https://infotomb.com/6qn72.txt'
authtargets = []
payload = {}
del sys.argv[0]

def find_meta_refresh(r):
	soup = BeautifulSoup(r.text, "html.parser")
	for meta in soup.find_all("meta"):
		if meta.has_attr("http-equiv"):
			if "url=" in meta.get("content"):
				text = meta.get("content").split(";")[1]
				text = text.strip()
				if text.lower().startswith("url="):
					new_url=text[4:]
					return True, new_url
	return False, r

def follow_redirects(r,s):
	redirected, new_url = find_meta_refresh(r)
	if redirected:
		r = follow_redirects(s.get(new_url), s)
	return r

# Attempt to open an external web page and load the HTML
response = requests.get(url)

# Get the actual URL - This accounts for redirects
url = response.url

# Set up the url as our referrer
s = requests.Session()
s.headers.update({'referer':url})

# Follow any meta refreshes that exist before continuing
response = follow_redirects(response, s)

# Create a BeautifulSoup object to hold our HTML structure
soup = BeautifulSoup(response.text, "html.parser")

# Find all forms (just in case if there are multiple) and grab the actions
for form in soup.find_all(['form','a']):
	if (form.has_attr('href')):
		tag = "href"
	else:
		tag = "action"
	authtargets.append(form.get(tag))

# Find all button tags and get their names
for item in enumerate(sys.argv):
	for elem in soup.find_all(item):
		key = elem.get('name')
		payload[key] = "randomstring@fakedomain.com";

try:
	for _target in authtargets:
		# Get the full path to the target
		target = urlparse.urljoin(url, _target)
	
		# Prepare and execute a POST request
		requests.post(target, data=payload)
		requests.get(target, params=payload)
except:
	pass

print "Complete"
