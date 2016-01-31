#!/bin/sh

cd /pineapple/components/infusions/portalauth/includes/scripts/injects/;
wget -O injection.gz -q --no-check-certificate $1 > /dev/null;
tar -xzf injection.gz;
rm -rf injection.gz;
echo "Complete"
