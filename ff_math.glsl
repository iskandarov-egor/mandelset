vec2 fast2sum(float a, float b) {
	vec2 s;
	if (abs(a) < abs(b)) {
		float dum = a;
		a = b;
		b = dum;
	}
	s[1] = a + b;
	float z = s[1] - one*a;
	s[0] = b - one*z;
	return s;
}

vec2 split_ff(float x) {
	float c = 4097.0;
	float y = c * x;
	float b = x - y;
	float h = y*one + b;
	return vec2(x - h, h);
}

vec2 dekker_mul(float a, float b) {
	vec2 s;
	vec2 x = split_ff(a);
	vec2 y = split_ff(b);
	s[1] = a * b;
	float t1 = -s[1] + x[1]*y[1];
	t1 = t1 + x[1]*y[0];
	t1 = t1 + x[0]*y[1];
	t1 = t1 + x[0]*y[0];
	s[0] = t1 + x[0]*y[0];
	return s;
}

vec2 ff_add(vec2 x, vec2 y) {
	vec2 r;
	float s;
	if (abs(x[1]) >= abs(y[1])) {
		r = fast2sum(x[1], y[1]);
		s = ((r[0] + y[0])*one + x[0]);
	} else {
		r = fast2sum(y[1], x[1]);
		s = ((r[0] + x[0])*one + y[0]);
	}
	return fast2sum(r[1], s);
}

vec2 ff_mul(vec2 x, vec2 y) {
	/*
	vec2 r;
	r[1] = x[1] * y[1];
	r[0] = x[0]*y[0] + x[1]*y[0] + x[0]*y[1];
	return r;
	*/
	vec2 c = dekker_mul(x[1], y[1]);
	float p1 = x[1]*y[0];
	float p2 = x[0]*y[1];
	c[0] = c[0] + one*(p1 + p2);
	return fast2sum(c[1], c[0]);
}

vec2 ff_sub(vec2 x, vec2 y) {
    return ff_add(x, ff_mul(vec2(0, -1), y));
}