<?php
	ini_set("display_errors", "On");
	error_reporting(E_ALL);	
	$easy = sqlite_open('/home/www/imagedoku.com/_static/db/easy.db', 0666, $error);
	$medium = sqlite_open('/home/www/imagedoku.com/_static/db/medium.db', 0666, $error);
	$hard = sqlite_open('/home/www/imagedoku.com/_static/db/hard.db', 0666, $error);
	$expert = sqlite_open('/home/www/imagedoku.com/_static/db/expert.db', 0666, $error);
	
	$stm = "SELECT * FROM Puzzles ORDER BY RANDOM() LIMIT 1;";
	if ($_GET["d"] == 1) {
		$result = sqlite_query($easy,$stm);
	} else if ($_GET["d"] == 2) {
		$result = sqlite_query($medium,$stm);
	} else if ($_GET["d"] == 3) {
		$result = sqlite_query($hard,$stm);
	} else if ($_GET["d"] == 4) {
		$result = sqlite_query($expert,$stm);
	}
	$row = sqlite_fetch_array($result);
	echo (json_encode($row));
	
	
	
	
	
	sqlite_close($easy);
	sqlite_close($medium);
	sqlite_close($hard);
	sqlite_close($expert);
?>