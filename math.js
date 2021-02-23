var f32 = new Float32Array(2);
function splitDouble(x, dest) {
	var c = 536870913;
	var y = c * x;
	var b = x - y;
	var h = y + b;
	dest[1] = h;
	dest[0] = x - dest[1];
}

