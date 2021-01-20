
function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  return xmlhttp.responseText;
}


function newBlockScanner(w, h, blockWidth) {
	var scanner = {
		xBlocks: Math.ceil(w / blockWidth),
		yBlocks: Math.ceil(h / blockWidth),
		xBlock: 0,
		yBlock: 0,
	};
	scanner.next = function() {
		var ret = {
			x: scanner.xBlock * blockWidth,
			y: scanner.yBlock * blockWidth,
			w: Math.min(blockWidth, w - scanner.xBlock * blockWidth),
			h: Math.min(blockWidth, h - scanner.yBlock * blockWidth),
		};
		
		if (scanner.yBlock == scanner.yBlocks) {
			return null;
		}
		if (scanner.xBlock == scanner.xBlocks - 1) {
			scanner.yBlock++;
			scanner.xBlock = 0;
		} else {
			scanner.xBlock++;
		}
		return ret;
	}
	return scanner;
}
