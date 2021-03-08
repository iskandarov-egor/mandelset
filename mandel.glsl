
// (a + bi)(c + di)
void cp_mul(inout float a, inout float b, float c, float d) {
	float a2 = a*c - b*d;
	b = a*d + b*c;
	a = a2;
}
// (a + bi)/(c + di)
void cp_div(inout float a, inout float b, float c, float d) {
	float del = c*c + d*d;
    float a2 = (a*c + b*d)/del;
    b = (b*c - a*d)/del;
    a = a2;
}

void cp_mul_ff(inout vec2 a, inout vec2 b, vec2 c, vec2 d) {
	vec2 a2 = ff_add(ff_mul(a,c), -ff_mul(b,d)); // todo is -ff_mul same as ff_mul(-1, ...)?
    //vec2 a2 = ff_add(ff_mul(a,c), ff_mul(vec2(0, -1), ff_mul(b,d))); // todo is -ff_mul same as ff_mul(-1, ...)?
	b = ff_add(ff_mul(a, d), ff_mul(b,c));
	a = a2;
}

float mandel_ff(inout vec2 x, inout vec2 y, vec2 cx, vec2 cy, int iterations, inout vec2 derivative_x, inout vec2 derivative_y) {
    for (int i = 0; i < iterations; i++) {
        derivative_x = ff_mul(vec2(0, 2.0), derivative_x);
        derivative_y = ff_mul(vec2(0, 2.0), derivative_y);
        cp_mul_ff(derivative_x, derivative_y, x, y);
        derivative_x = ff_add(derivative_x, vec2(0, 1.0));
        
        vec2 x2 = 
			ff_add(
				ff_add(
					ff_mul(x, x),
					ff_mul(
						vec2(0, -1),
						ff_mul(y, y)
					)
				),
				cx
			);
        y = 
			ff_add(
				ff_mul(
					ff_mul(vec2(0, 2.0), x),
					y
				),
				cy
			);
        x = x2;
        
        vec2 sqx = ff_mul(x, x);
        vec2 sqy = ff_mul(y, y);
        vec2 sqs = ff_add(sqx, sqy);
        if (sqs[0] + sqs[1] > 10000.0) {
			float m = sqs[0] + sqs[1];
            return float(i) + 1.0 - log(log(m))/log(2.0);
		}
    }
    return 0.0;
}

float mandel(float cx, float cy, int iterations) {
    float x = 0.0;
    float y = 0.0;
    for (int i = 0; i < iterations; i++) {
		float xx = x*x;
		float yy = y*y;
        float x2 = xx - yy + cx;
        y = 2.0 * x * y + cy;
        x = x2;
        
        if (xx + yy > 10000.0) {
			float m = x*x + y*y;
			float s = float(i) + 1.0 - log(log(m))/log(2.0);
            return s;
		}
    }
    return 0.0;
}

float mandel_der(float cx, float cy, int iterations, out vec2 der) {
    float x = 0.0;
    float y = 0.0;
    der.x = 1.0;
    der.y = 0.0;
    for (int i = 0; i < iterations; i++) {
        der.x *= 2.0;
        der.y *= 2.0;
        cp_mul(der.x, der.y, x, y);
        der.x += 1.0;
        
		float xx = x*x;
		float yy = y*y;
        float x2 = xx - yy + cx;
        y = 2.0 * x * y + cy;
        x = x2;
        
        if (xx + yy > 10000.0) {
			float m = x*x + y*y;
			float s = float(i) + 1.0 - log(log(m))/log(2.0);
            
            cp_div(x, y, der.x, der.y);
            float mag = sqrt(x*x + y*y);
            der = vec2(x/mag, y/mag);
            return s;
		}
        
    }
    return 0.0;
}

float mandel_delta_sim(float cx, float cy, float dx, float dy, int iterations) {
    float x = cx;
    float y = cy;
	float dx0 = dx;
	float dy0 = dy;
    for (int i = 0; i < iterations; i++) {
        // d = 2zd + dd + d0
        float ddx = dx;
        float ddy = dy;
        //ddy = dy;
        cp_mul(ddx, ddy, ddx, ddy);
        cp_mul(dx, dy, x, y);
        dx = 2.0*dx + ddx + dx0;
        dy = 2.0*dy + ddy + dy0;
        
        float x2 = x * x - y * y + cx;
        y = 2.0 * x * y + cy;
        x = x2;
        
        if ((abs((x + dx)/x) < 0.001) || (abs((y + dy)/y) < 0.001)) {
			return -1.0;
		}
        
        float zx = x + dx;
        float zy = y + dy;
        
        if (zx*zx + zy*zy > 10000.0) {
			float m = zx*zx + zy*zy;
			float s = float(i) + 1.0 - log(log(m))/log(2.0);
            return s;
		}
    }
    return 0.0;
}


// dx, dy - offset from ref orbit after first iteration (assuming all orbits start at (0,0))
// uses uniforms refOrbit and refOrbitLen
float mandel_delta(float dx, float dy, int iterations, out vec2 derivative, out vec2 z) {
	float dx0 = dx;
	float dy0 = dy;
	
	float zx = 0.0;
	float zy = 0.0;
	ivec2 orbiti = ivec2(1, 0);
	ivec2 txtSize = textureSize(refOrbit, 0);
	
	float x;
	float y;
	vec4 texel1 = texelFetch(refOrbit, ivec2(1, 0), 0);
    
    vec2 derivative_x = vec2(0.0, 1.0); // todo maybe we dont need ff precision
    vec2 derivative_y = vec2(0.0, 0.0);
    for (int i = 1; i < refOrbitLen; i++) {
		/* update reference orbit */
        if ((true)) {
			vec4 texel = texelFetch(refOrbit, orbiti, 0);
			x = texel.x;
			y = texel.y;
		} else {
			float x2 = x*x - y*y + texel1.x;
			y = 2.0 * x * y + texel1.y;
			x = x2;
		}
        
        derivative_x = ff_mul(vec2(0, 2.0), derivative_x);
        derivative_y = ff_mul(vec2(0, 2.0), derivative_y);
        cp_mul_ff(derivative_x, derivative_y, vec2(0, zx), vec2(0, zy));
        derivative_x = ff_add(derivative_x, vec2(0, 1.0));
        
        zx = x + dx;
        zy = y + dy;
                
        if (zx*zx + zy*zy > 10000.0) {
			float m = zx*zx + zy*zy;
			float s = float(i) - log(log(m))/log(2.0);
            
            derivative = vec2(derivative_x[1], derivative_y[1]);
            z = vec2(zx, zy);
            return s;
		}
		
		/* update dx dy */
        float ddx = dx;
        float ddy = dy;
        //ddy = dy;
        cp_mul(ddx, ddy, ddx, ddy);
        cp_mul(dx, dy, x, y);
        dx = 2.0*dx + ddx + dx0;
        dy = 2.0*dy + ddy + dy0;
        
        /* update texture index */
        orbiti.x++;
        if (orbiti.x == txtSize.x) {
			orbiti.x = 0;
			orbiti.y++;
		}
        
        /* glitch detection */
        //if ((abs((x + dx)/x) < 0.001) || (abs((y + dy)/y) < 0.001)) {
		//	return -1.0;
		//}
    }
    if (refOrbitLen < iterations) {
		/* reference orbit too short, continue using high precision */
		vec4 texel = texelFetch(refOrbit, ivec2(1, 0), 0);
        vec2 zx_ff = vec2(0, zx);
        vec2 zy_ff = vec2(0, zy);
		float ret = float(refOrbitLen - 1) + mandel_ff(zx_ff, zy_ff, vec2(0, texel.x + dx0), vec2(0, texel.y + dy0), iterations - refOrbitLen + 1, derivative_x, derivative_y);
        derivative = vec2(derivative_x[1], derivative_y[1]);
        z = vec2(zx_ff[1], zy_ff[1]);
        return ret;
	}
    return 0.0;
}
// dx, dy - offset from ref orbit after first iteration (assuming all orbits start at (0,0))
// uses uniforms refOrbit and refOrbitLen
float mandel_delta_ff(vec2 dx, vec2 dy, int iterations) {
	vec2 dx0 = dx;
	vec2 dy0 = dy;
	// zx, zy - current orbit
	
	vec2 zx;
	vec2 zy;
	ivec2 orbiti = ivec2(1, 0);
	ivec2 txtSize = textureSize(refOrbit, 0);
	
	// zx, zy - reference orbit
	vec2 x;
	vec2 y;
	vec4 texel1 = texelFetch(refOrbit, ivec2(1, 0), 0);
    for (int i = 1; i < refOrbitLen; i++) {
		/* update reference orbit */
        if ((true)) {
			vec4 texel = texelFetch(refOrbit, orbiti, 0);
			x = vec2(0, texel.x);
			y = vec2(0, texel.y);
		} else {
			//float x2 = x*x - y*y + texel1.x;
			//y = 2.0 * x * y + texel1.y;
			//x = x2;
		}
        
        zx = ff_add(x, dx);
        zy = ff_add(y, dy);
        
        if (zx[1]*zx[1] + zy[1]*zy[1] > 10000.0) { // todo is it ok to disregard vec2[0] here?
			float m = zx[1]*zx[1] + zy[1]*zy[1];
			float s = float(i) - log(log(m))/log(2.0);
            return s;
		}
		
		/* update dx dy */
        vec2 ddx = dx;
        vec2 ddy = dy;
        //ddy = dy;
        cp_mul_ff(ddx, ddy, ddx, ddy);
        cp_mul_ff(dx, dy, x, y);
        dx = ff_add(ff_add(ff_mul(vec2(0, 2.0), dx), ddx), dx0);
        dy = ff_add(ff_add(ff_mul(vec2(0, 2.0), dy), ddy), dy0);
        
        /* update texture index */
        orbiti.x++;
        if (orbiti.x == txtSize.x) {
			orbiti.x = 0;
			orbiti.y++;
		}
        
        /* glitch detection */
        //if ((abs((x + dx)/x) < 0.001) || (abs((y + dy)/y) < 0.001)) {
		//	return -1.0;
		//}
    }
    if (refOrbitLen < iterations) {
		/* reference orbit too short, continue using high precision */
		vec4 texel = texelFetch(refOrbit, ivec2(1, 0), 0);
		// todo derivative return float(refOrbitLen - 1) + mandel_ff(zx, zy, ff_add(vec2(0.0, texel.x), dx0), ff_add(vec2(0.0, texel.y), dy0), iterations - refOrbitLen + 1);
        
	}
    return 0.0;
}

const float eps = 5.960464477539063e-08; // float32 epsilon
const float gamma = (eps)/(1.0 - eps);
float add_err(float a, float b, float aerr, float berr) {
	return aerr + berr + gamma*(abs(a + b) + aerr + berr);
}
float mul_err(float a, float b, float aerr, float berr) {
	return (abs(b*aerr) + abs(a*berr) + aerr*berr) + gamma*abs(a*b);
}

float mandel_delta_err(float dx, float dy, int iterations) {
	float dx0 = dx;
	float dy0 = dy;
	// zx, zy - current orbit
	float zx;
	float zy;
	ivec2 orbiti = ivec2(1, 0);
	ivec2 txtSize = textureSize(refOrbit, 0);
	
	// zx, zy - reference orbit
	float x = 0.0;
	float y = 0.0;
	
	// error bounds
	float xerr = 0.0;
	float yerr = 0.0;
	
	int errs = 0;
	vec4 texel1 = texelFetch(refOrbit, ivec2(1, 0), 0);
    for (int i = 1; i < refOrbitLen; i++) {
		/* update reference orbit */
        if (i == 1 || xerr > 0.000001 || yerr > 0.000001) {
			vec4 texel = texelFetch(refOrbit, orbiti, 0);
			x = texel.x;
			y = texel.y;
			xerr = 0.0;
			yerr = 0.0;
			errs++;
		} else {
			float xx = x*x;
			float yy = y*y;
			float xxerr = mul_err(x, x, xerr, xerr);
			float yyerr = mul_err(y, y, yerr, yerr);
			float xyerr = mul_err(x, y, xerr, yerr);
			float xerr2 = add_err(xx, -yy, xxerr, yyerr);
			xerr2 = add_err(xx - yy, texel1.x, xerr2, 0.0);
			float yerr2 = mul_err(x, y, xerr, yerr);
			yerr2 = add_err(2.0*x*y, texel1.y, yerr2, 0.0);
			xerr = xerr2;
			yerr = yerr2;
			float x2 = xx - yy + texel1.x;
			y = 2.0 * x * y + texel1.y;
			x = x2;
		}
        
        zx = x + dx;
        zy = y + dy;
        
        if (zx*zx + zy*zy > 10000.0) {
			float m = zx*zx + zy*zy;
			float s = float(i) - log(log(m))/log(2.0);
            return s;
		}
		
		/* update dx dy */
        float ddx = dx;
        float ddy = dy;
        //ddy = dy;
        cp_mul(ddx, ddy, ddx, ddy);
        cp_mul(dx, dy, x, y);
        dx = 2.0*dx + ddx + dx0;
        dy = 2.0*dy + ddy + dy0;
        
        /* update texture index */
        orbiti.x++;
        if (orbiti.x == txtSize.x) {
			orbiti.x = 0;
			orbiti.y++;
		}
        
        /* glitch detection */
        //if ((abs((x + dx)/x) < 0.001) || (abs((y + dy)/y) < 0.001)) {
		//	return -1.0;
		//}
    }
    if (refOrbitLen < iterations) {
		/* reference orbit too short, continue using high precision */
		vec4 texel = texelFetch(refOrbit, ivec2(1, 0), 0);
		// todo derivative return float(refOrbitLen - 1) + mandel_ff(vec2(0, zx), vec2(0, zy), vec2(0, texel.x + dx0), vec2(0, texel.y + dy0), iterations - refOrbitLen + 1);
	}
    return 0.0;
}
