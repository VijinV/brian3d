
export const pointVertexShader = `
uniform float uProgress;
uniform float uPointSize;
uniform float uHover;
uniform vec2 uMouse;
attribute float vertexIndex;
varying float vProgress;
varying float vHoverEffect;

void main() {
    float vertexGroup = floor(vertexIndex / 6.0);
    float totalGroups = 2000.0;

    float localProgress = smoothstep(
        vertexGroup / totalGroups,
        (vertexGroup / totalGroups) + 0.005,
        uProgress
    );

    vProgress = localProgress;

    // Project position to screen space
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 projectedPosition = projectionMatrix * mvPosition;

    // Calculate screen position
    vec3 ndc = projectedPosition.xyz / projectedPosition.w;
    vec2 screenPosition = ndc.xy;

    // Calculate distance to mouse in screen space
    float distanceToMouse = length(screenPosition - uMouse) * 3.0;
    float hoverStrength = 1.0 - smoothstep(0.0, 0.8, distanceToMouse);
    vHoverEffect = hoverStrength;

    // Calculate final point size with hover effect
    float size = uPointSize;
    if (hoverStrength > 0.0) {
        size *= (1.0 + hoverStrength * 5.0);
    }

    gl_Position = projectedPosition;
    gl_PointSize = size * (1.0 / -mvPosition.z);
}
`;



export const pointFragmentShader = `
uniform float uProgress;
varying float vProgress;
varying float vHoverEffect;
uniform vec3 uColor;
uniform vec3 uHoverColor;

void main() {
    // Calculate distance from center of point
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Create circular point with soft edges
    float strength = 1.0 - smoothstep(0.2, 0.4, dist);

    // Mix colors based on hover effect
    vec3 finalColor = mix(uColor, uHoverColor, vHoverEffect);

    float alpha = strength * vProgress;

    // Brighten points on hover
    if (vHoverEffect > 0.0) {
        alpha *= (1.0 + vHoverEffect * 0.5);
    }

    gl_FragColor = vec4(finalColor, alpha);
}
`;



export const vertexShader = `
uniform float uProgress;
attribute float vertexIndex;
varying float vProgress;
varying vec3 vPosition;
varying vec4 vScreenPosition;

void main() {
    float vertexGroup = floor(vertexIndex / 6.0);
    float totalGroups = 2000.0;

    float localProgress = smoothstep(
        vertexGroup / totalGroups,
        (vertexGroup / totalGroups) + 0.005,
        uProgress
    );

    vProgress = localProgress;
    vPosition = position;

    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    vScreenPosition = projectedPosition;
    gl_Position = projectedPosition;

    // Add point size for vertices
    gl_PointSize = 4.0;
}
`;

// if we dont pass any fragementShader it wil give us a nice point shader

export const fragmentShader = `
uniform float uProgress;
varying float vProgress;
varying vec3 vPosition;
varying vec4 vScreenPosition;
uniform vec3 uColor;

void main() {
    vec3 baseColor = vec3(0, 0.4, 1.0);
    vec3 accentColor = vec3(0.2, 0.8, 1.0);
    float positionFactor = fract(vPosition.x * 10.0 + vPosition.y * 10.0 + vPosition.z * 10.0);
    vec3 finalColor = mix(baseColor, accentColor, positionFactor * 0.3);
    float alpha = vProgress;
    gl_FragColor = vec4(uColor, alpha);
}
`;


export const startVertexShader = `attribute float size;
            uniform float pixelRatio;

            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
            }`


export const starFragmentShader = ` uniform vec3 color1;
            uniform vec3 color2;
            uniform float blurStrength;

            void main() {
                // Create circular points
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);

                if(dist > 0.5) discard;

                // Fade out towards edges
                float strength = 1.0 - smoothstep(0.3, 0.5, dist);

                // Star color blending with blur effect
                vec3 color = mix(color1, color2, strength * blurStrength);
                gl_FragColor = vec4(color, strength * 0.8);
            }`
