#!/bin/sh

#  Author: sud0nick
#  Date:   Dec 2016

if [ $# -eq 0 ]; then
	exit;
fi

if [[ "$1" == "-check" ]]; then
	testCurl=$(opkg list-installed | grep -w 'curl')
  testLibCurl=$(opkg list-installed | grep -w 'libcurl4')
  testCodecs=$(opkg list-installed | grep -w 'python-codecs')
	if [ -z "$testCurl" ] || [ "$textLibCurl" ] || [ -z "$testCodecs" ]; then
		echo "Not Installed";
	else
		echo "Installed";
	fi
fi

if [[ "$1" == "-install" ]]; then
	opkg update > /dev/null;
	opkg install curl libcurl4 python-codecs > /dev/null;
	echo "Complete"
fi

if [[ "$1" == "-remove" ]]; then
	opkg remove curl > /dev/null
	echo "Complete"
fi
