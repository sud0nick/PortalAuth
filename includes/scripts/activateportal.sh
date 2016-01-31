#!/bin/sh
rm -rf /etc/nodogsplash/htdocs/*
if ! cp -R $1$2/* /etc/nodogsplash/htdocs/;then
	echo "Failed to activate portal";
fi

if [ $3 ]; then
	if ! cp /pineapple/modules/PortalAuth/includes/scripts/injects/$3/auth.php /www/nodogsplash/auth.php; then
        	echo "Failed to move auth.php";
	fi
fi
