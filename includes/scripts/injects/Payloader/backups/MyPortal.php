<?php
	/*
		This script checks the entered access key with the user's access key to either allow or deny them access.
		The key is held in a file that has the name of the user's IP address with all periods replaced with underscores
		in the $keyDir directory.  The contents of the file are read in and compared with the supplied access key
		and either True or False are echoed back to the script in InjectJS.
	*/
	header('Access-Control-Allow-Origin: *');
	if (isset($_POST['verifyAccessKey'])) {
		
		// Setup variables with the location of the key files
		$keyDir = "/pineapple/components/infusions/portalauth/includes/pass/keys/";
		$keyFile = $keyDir . str_replace(".", "_", $_SERVER['REMOTE_ADDR']) . ".txt";

		// Open the key file associated with the current client and read the value
		$fh = fopen($keyFile, "r");
		$accessKey = fread($fh, filesize($keyFile));
		fclose($fh);

		// Check if the access key provided by the client matches that in from the file
		if ($_POST['verifyAccessKey'] == $accessKey) {
			echo True;
		} else {
			echo False;
		}
	}
?>