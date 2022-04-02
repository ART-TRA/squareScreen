uniform sampler2D uTexture; //текстуру НЕ НАЗЫВАТЬ texture
uniform vec4 resolution;
varying vec2 vUv;

void main() {
    vec2 newUV = (vUv - vec2(0.5)) * resolution.zw + vec2(0.5);

    vec4 image = texture2D(uTexture, vUv);

    float alpha = 1.0 - step(0.5, length(gl_PointCoord - vec2(0.5)));
//    gl_FragColor = vec4(vUv, 1.0, alpha);
//    gl_FragColor = vec4(vUv, 1.0, 1.0);
    gl_FragColor = image;
}