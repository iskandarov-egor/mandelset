
vec4 mantissa(float x) {
	float sign = 0.0;
	if (x == 0.0) {
		return vec4(1, 1, 0.5, 1);
	}
	if (x < 0.0) {
		sign = 1.0;
		x *= -1.0;
	}
	int e = 0;
	while (x >= 1.0) {
		x /= 2.0;
		e -= 1;
	}
	while (x < 0.5) {
		x *= 2.0;
		e += 1;
	}
	return vec4(mod(x*16777214.0, 2.0), 0.0*sign, 0, 1);
}


vec4 floatColor(float x) {
	if (x <= 0.0) {
		return vec4(1, 0, 0, 1);
	}
	if (x >= 0.5) {
		return vec4(1, 0, 0, 1);
	}
	int e = 0;
	while (x < 0.5) {
		x *= 2.0;
		e += 1;
		if (e == 10) {
			//return vec4(1, 1, 0, 1);
		}
	}
	return vec4(0, mod(float(e), 2.0), mod(x*8388607.0, 2.0), 1);
}
