M.utils = {};

M.utils.loadFile = function (filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  return xmlhttp.responseText;
};

M.utils.newBlockScanner = function (w, h, blockWidth) {
    var scanner = {};
    
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
    };
    
    scanner.reset = function() {
        scanner.xBlocks = Math.ceil(w / blockWidth);
        scanner.yBlocks = Math.ceil(h / blockWidth);
        scanner.xBlock = 0;
        scanner.yBlock = 0;
    };
    
    scanner.getProgress = function() {
        return (scanner.yBlock*scanner.xBlocks + scanner.xBlock) / (scanner.yBlocks*scanner.xBlocks);
    };
    
    scanner.reset();
    return scanner;
};

M.utils.newRateLimiter = function (rps) {
    var lastTime = 0;
    var interval = 1000/rps;
    return {
        proceed: function() {
            var now = performance.now();
            if (now - lastTime > interval) {
                lastTime = now;
                return true;
            } else {
                return false;
            }
        }
    }
};

M.utils.resizeCanvasToDisplaySize = function (canvas) {
    canvas.width = window.devicePixelRatio*canvas.clientWidth;
    canvas.height = window.devicePixelRatio*canvas.clientHeight;
};

M.utils.download = function(filename, text) {
    // browser programming is hard
    
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

M.utils.download_link = function(filename, link) {
    var element = document.createElement('a');
    element.setAttribute('href', link);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

M.utils._usage_ping = {};
M.utils.usage_ping = function(what) {
    if (what in M.utils._usage_ping) {
        return;
    }
    M.utils._usage_ping[what] = 1;
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'usage-ping-' + what, true); // true for asynchronous 
    xmlHttp.send(null);
};