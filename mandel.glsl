
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
    vec2 a2 = ff_add(ff_mul(a,c), -ff_mul(b,d)); // TODO: is -ff_mul same as ff_mul(-1, ...)?
    //vec2 a2 = ff_add(ff_mul(a,c), ff_mul(vec2(0, -1), ff_mul(b,d))); // TODO: is -ff_mul same as ff_mul(-1, ...)?
    b = ff_add(ff_mul(a, d), ff_mul(b,c));
    a = a2;
}

float mandel_ff(inout vec2 x, inout vec2 y, vec2 cx, vec2 cy, int iterations, inout vec2 derivative) {
    for (int i = 1; i < iterations; i++) {
        derivative *= 2.0;
        cp_mul(derivative.x, derivative.y, x[0] + x[1], y[0] + y[1]);
        derivative.x += 1.0;
        
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
    return -1.0;
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
    
    derivative = vec2(0.0, 0.0);
    int orbitIterations = min(refOrbitLen, iterations);
    for (int i = 1; i < orbitIterations; i++) {
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
        
        derivative = 2.0*derivative;
        cp_mul(derivative.x, derivative.y, zx, zy);
        derivative.x += 1.0;
                
        zx = x + dx;
        zy = y + dy;
                
        if (zx*zx + zy*zy > 10000.0) {
            float m = zx*zx + zy*zy;
            float s = float(i) - log(log(m))/log(2.0);
            
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
        //    return -1.0;
        //}
    }
    if (refOrbitLen < iterations) {
        /* reference orbit too short */
        vec4 texel = texelFetch(refOrbit, ivec2(1, 0), 0);
        vec2 zx_ff = vec2(0, zx);
        vec2 zy_ff = vec2(0, zy);
        float ret = mandel_ff(zx_ff, zy_ff, vec2(0, texel.x + dx0), vec2(0, texel.y + dy0), iterations - refOrbitLen + 1, derivative);
        if (ret == -1.0) {
            return ret;
        }
        ret += float(refOrbitLen - 1);
        z = vec2(zx_ff[1], zy_ff[1]);
        return ret;
    }
    return -1.0;
}

