import sys
import re
import requests
from bs4 import BeautifulSoup

# The location of the Injection Set URLs
url = "http://www.puffycode.com/download/PortalAuth/InjectSets/index.php"

r = requests.get(url)
soup = BeautifulSoup(r.text, "html.parser")

for tag in soup.find_all('a'):
    print tag.text.strip()+";"+tag['href']