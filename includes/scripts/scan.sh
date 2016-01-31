#!/bin/sh

mask2cidr() {
    nbits=0
    IFS=.
    for dec in $1 ; do
        case $dec in
            255) let nbits+=8;;
            254) let nbits+=7;;
            252) let nbits+=6;;
            248) let nbits+=5;;
            240) let nbits+=4;;
            224) let nbits+=3;;
            192) let nbits+=2;;
            128) let nbits+=1;;
            0);;
            *) echo "Error: $dec is not recognised"; exit 1
        esac
    done
    echo "$nbits"
}

getClientInterface() {
    for i in $(seq 1 4);
    do
        while read -r line
        do
            if [ "$line" == "up" ]; then
                    echo "wlan$i"
                    break
            fi
        done < "/sys/class/net/wlan$i/operstate"
    done 2> /dev/null
}

# Find the client interface
interface=$(getClientInterface)

# Check if an interface was not found
if [ "$interface" == "" ]; then
    echo "failed"
    exit
fi

# Get the IP address of the client radio
ip=$(ifconfig $interface | grep 'inet\ addr' | cut -d: -f2 | cut -d" " -f1)

# Get the netmask of the client network
netmask=$(ifconfig $interface | grep 'inet\ addr' | cut -d: -f4)
bits=$(mask2cidr $netmask)

# Use nmap to ping sweep the target network
scan=$(nmap -sn $ip/$bits)

# Echo only the MAC addresses of the result
echo $scan | grep -o -E '([[:xdigit:]]{1,2}:){5}([[:xdigit:]]{1,2})'
