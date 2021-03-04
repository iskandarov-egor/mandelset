var traceconf = {
	//'comp': '  ',
	//'loop': '',
	//'raf': '    ',
}

var traceTime = performance.now();

function trace(what, ...args) {
	if (what in traceconf) {
		
		var now = performance.now();
		console.log(Math.floor(now - traceTime) + traceconf[what], ...args);
		traceTime = now;
	}
}
