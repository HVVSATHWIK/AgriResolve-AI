
varying vec2 vUv;
varying vec3 vColor;
varying float vDepth;

void main() {
    // Simple leaf shape mask from UV
    vec2 center = vUv - 0.5;
    float dist = length(center);
    
    // Create a leaf shape (pointed oval)
    // equation: x^2 + (y/2)^2 < r^2 ish
    
    float shape = 1.0 - smoothstep(0.3, 0.5, length(vec2(center.x * 1.5, center.y)));
    
    // Vein line
    float vein = 1.0 - smoothstep(0.01, 0.02, abs(center.x));
    
    if (shape < 0.1) discard;
    
    // Final color mixing
    vec3 color = vColor;
    
    // Darken vein
    color = mix(color, color * 0.5, vein * 0.5);
    
    // Fake alpha/transparency for edges
    float alpha = shape;
    
    gl_FragColor = vec4(color, 1.0);
}
