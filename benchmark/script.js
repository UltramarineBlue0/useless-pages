"use strict";
(() => {
	const htmlStr = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="referrer" content="no-referrer">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script>
	</script>
</head>
<body>
</body>
</html>
	`.trim();

	const iframe = document.getElementById("test-iframe");

	iframe.srcdoc = htmlStr;

})();