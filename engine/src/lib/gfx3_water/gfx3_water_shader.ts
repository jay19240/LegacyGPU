export const WATER_SHADER_VERTEX_ATTR_COUNT = 8;

export const WATER_MAX_IMPACTS = 8;

export const WATER_PIPELINE_DESC: any = {
  label: 'Water pipeline',
  layout: 'auto',
  vertex: {
    entryPoint: 'main',
    buffers: [{
      arrayStride: WATER_SHADER_VERTEX_ATTR_COUNT * 4,
      attributes: [{
        shaderLocation: 0, /*position*/
        offset: 0,
        format: 'float32x3'
      }, {
        shaderLocation: 1, /*normal*/
        offset: 3 * 4,
        format: 'float32x3'
      }, {
        shaderLocation: 2, /*uv*/
        offset: 6 * 4,
        format: 'float32x2'
      }]
    }]
  },
  fragment: {
    entryPoint: 'main',
    targets: [{
      format: navigator.gpu.getPreferredCanvasFormat(),
      blend: {
        color: {
          srcFactor: 'src-alpha',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        },
        alpha: {
          srcFactor: 'one',
          dstFactor: 'one-minus-src-alpha',
          operation: 'add'
        }
      }
    },
    { format: 'rgba16float' }, // normals
    { format: 'rgba16float' }, // tags
    { format: 'rgba16float' }] // ch1
  },
  primitive: {
    topology: 'triangle-list',
    cullMode: 'none',
    frontFace: 'ccw'
  },
  depthStencil: {
    depthWriteEnabled: true,
    depthCompare: 'less',
    format: 'depth24plus'
  }
};

export const WATER_VERTEX_SHADER = (data: any = {}) => /* wgsl */`
struct SceneInfos {
  VP_MATRIX: mat4x4<f32>,
  CAMERA_POS: vec4<f32>,
  TIME_INFOS: vec4<f32>
};

struct WaterMeshInfos {
  MODEL_MATRIX: mat4x4<f32>,
  TAG: vec4<f32>,
  NORMAL_MAP_INFOS: vec4<f32>,
  SURFACE_COLOR: vec4<f32>,
  OPTICS: vec4<f32>,
  SUN_PARAMS: vec4<f32>,
  SUN_COLOR: vec4<f32>,
  WAVE_PARAMS: vec4<f32>,
  GRID_INFO: vec4<f32>,
  IMPACTS_A: array<vec4<f32>, ${WATER_MAX_IMPACTS}>,
  IMPACTS_B: array<vec4<f32>, ${WATER_MAX_IMPACTS}>
};

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) FragWorldPos: vec3<f32>,
  @location(1) FragNormal: vec3<f32>,
  @location(2) FragUV: vec2<f32>
};

@group(0) @binding(0) var<uniform> SCENE: SceneInfos;
@group(1) @binding(0) var<uniform> MESH: WaterMeshInfos;

fn Hash22(p: vec2<f32>) -> vec2<f32> {
  let q = vec2<f32>(dot(p, vec2<f32>(127.1, 311.7)), dot(p, vec2<f32>(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(q) * 43758.5453123);
}

fn Perlin2(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  let g00 = Hash22(i + vec2<f32>(0.0, 0.0));
  let g10 = Hash22(i + vec2<f32>(1.0, 0.0));
  let g01 = Hash22(i + vec2<f32>(0.0, 1.0));
  let g11 = Hash22(i + vec2<f32>(1.0, 1.0));
  let n00 = dot(g00, f - vec2<f32>(0.0, 0.0));
  let n10 = dot(g10, f - vec2<f32>(1.0, 0.0));
  let n01 = dot(g01, f - vec2<f32>(0.0, 1.0));
  let n11 = dot(g11, f - vec2<f32>(1.0, 1.0));
  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}

fn ImpactBoost(xz: vec2<f32>) -> f32 {
  var sum = 0.0;
  let count = i32(MESH.GRID_INFO.z);
  for (var i: i32 = 0; i < ${WATER_MAX_IMPACTS}; i = i + 1) {
    if (i >= count) { break; }
    let a = MESH.IMPACTS_A[i];
    let b = MESH.IMPACTS_B[i];
    let age = b.x;
    let lifetime = b.y;
    if (age <= 0.0 || age >= lifetime) { continue; }
    let d = xz - a.xy;
    let dist = length(d);
    if (dist >= a.w) { continue; }
    let spatial = 1.0 - smoothstep(a.w * 0.4, a.w, dist);
    let t = age / lifetime;
    let rise = smoothstep(0.0, 0.15, t);
    let decay = 1.0 - smoothstep(0.15, 1.0, t);
    sum = sum + a.z * spatial * rise * decay;
  }
  return sum;
}

fn CalcHeight(xz: vec2<f32>, time: f32) -> f32 {
  let amp = MESH.WAVE_PARAMS.x;
  let scale = MESH.WAVE_PARAMS.y;
  let speed = MESH.WAVE_PARAMS.z;
  let choppy = max(MESH.WAVE_PARAMS.w, 1.0);
  let drift1 = vec2<f32>(0.7, 0.4) * (time * speed);
  let drift2 = vec2<f32>(-0.3, 0.6) * (time * speed);
  let n1 = Perlin2(xz * scale + drift1);
  let n2 = Perlin2(xz * scale * 2.1 + drift2) * 0.5;
  let noise = n1 + n2;
  let localAmp = amp + ImpactBoost(xz);
  var h = noise * localAmp;
  if (choppy > 1.0 && abs(localAmp) > 1e-6) {
    h = sign(h) * pow(abs(h / localAmp), 1.0 / choppy) * localAmp;
  }
  return h;
}

@vertex
fn main(@location(0) Pos: vec3<f32>, @location(1) Normal: vec3<f32>, @location(2) UV: vec2<f32>) -> VertexOutput {
  let time = SCENE.TIME_INFOS.x;
  let stepX = MESH.GRID_INFO.x;
  let stepZ = MESH.GRID_INFO.y;
  let xz = Pos.xz;

  let h = CalcHeight(xz, time);
  let hxp = CalcHeight(xz + vec2<f32>(stepX, 0.0), time);
  let hxm = CalcHeight(xz - vec2<f32>(stepX, 0.0), time);
  let hzp = CalcHeight(xz + vec2<f32>(0.0, stepZ), time);
  let hzm = CalcHeight(xz - vec2<f32>(0.0, stepZ), time);

  let nx = -(hxp - hxm) / (2.0 * stepX);
  let nz = -(hzp - hzm) / (2.0 * stepZ);
  let normalLocal = normalize(vec3<f32>(nx, 1.0, nz));

  let displaced = vec3<f32>(Pos.x, h, Pos.z);
  let world = (MESH.MODEL_MATRIX * vec4<f32>(displaced, 1.0)).xyz;
  let worldNormal = normalize((MESH.MODEL_MATRIX * vec4<f32>(normalLocal, 0.0)).xyz);

  var output: VertexOutput;
  output.Position = SCENE.VP_MATRIX * vec4<f32>(world, 1.0);
  output.FragWorldPos = world;
  output.FragNormal = worldNormal;
  output.FragUV = UV;
  return output;
}`;

export const WATER_FRAGMENT_SHADER = (data: any = {}) => /* wgsl */`
struct SceneInfos {
  VP_MATRIX: mat4x4<f32>,
  CAMERA_POS: vec4<f32>,
  TIME_INFOS: vec4<f32>
};

struct WaterMeshInfos {
  MODEL_MATRIX: mat4x4<f32>,
  TAG: vec4<f32>,
  NORMAL_MAP_INFOS: vec4<f32>,
  SURFACE_COLOR: vec4<f32>,
  OPTICS: vec4<f32>,
  SUN_PARAMS: vec4<f32>,
  SUN_COLOR: vec4<f32>,
  WAVE_PARAMS: vec4<f32>,
  GRID_INFO: vec4<f32>,
  IMPACTS_A: array<vec4<f32>, ${WATER_MAX_IMPACTS}>,
  IMPACTS_B: array<vec4<f32>, ${WATER_MAX_IMPACTS}>
};

struct FragOutput {
  @location(0) Base: vec4<f32>,
  @location(1) Normal: vec4<f32>,
  @location(2) Tag: vec4<f32>,
  @location(3) Ch1: vec4<f32>
};

@group(0) @binding(0) var<uniform> SCENE: SceneInfos;
@group(1) @binding(0) var<uniform> MESH: WaterMeshInfos;
@group(2) @binding(0) var ENV_MAP_TEXTURE: texture_cube<f32>;
@group(2) @binding(1) var ENV_MAP_SAMPLER: sampler;
@group(2) @binding(2) var NORMAL_MAP_TEXTURE: texture_2d<f32>;
@group(2) @binding(3) var NORMAL_MAP_SAMPLER: sampler;

// Double-sampled scrolling tangent-space normal, returned as a unit vector.
fn CalcSurfaceNormal(uv: vec2<f32>, time: f32) -> vec3<f32> {
  let scrollA = vec2<f32>(MESH.NORMAL_MAP_INFOS.x, MESH.NORMAL_MAP_INFOS.y) * time;
  let scrollB = vec2<f32>(-MESH.NORMAL_MAP_INFOS.y, MESH.NORMAL_MAP_INFOS.x) * time * 0.7;
  let uvA = uv * MESH.NORMAL_MAP_INFOS.w + scrollA;
  let uvB = uv * MESH.NORMAL_MAP_INFOS.w * 1.7 + scrollB;
  let nmA = textureSample(NORMAL_MAP_TEXTURE, NORMAL_MAP_SAMPLER, uvA).rgb * 2.0 - 1.0;
  let nmB = textureSample(NORMAL_MAP_TEXTURE, NORMAL_MAP_SAMPLER, uvB).rgb * 2.0 - 1.0;
  return normalize(nmA + nmB);
}

// Schlick-style Fresnel with a base reflectivity floor (sky always at least this visible).
fn CalcFresnel(cosTheta: f32) -> f32 {
  let baseReflectivity = clamp(MESH.OPTICS.z, 0.0, 1.0);
  let power = max(MESH.OPTICS.y, 0.1);
  let grazing = pow(1.0 - cosTheta, power);
  return clamp(baseReflectivity + (1.0 - baseReflectivity) * grazing, 0.0, 1.0);
}

@fragment
fn main(@builtin(position) Position: vec4<f32>, @location(0) FragWorldPos: vec3<f32>, @location(1) FragNormal: vec3<f32>, @location(2) FragUV: vec2<f32>) -> FragOutput {
  let nm = CalcSurfaceNormal(FragUV, SCENE.TIME_INFOS.x);
  let perturb = vec3<f32>(nm.x, 0.0, nm.y) * MESH.NORMAL_MAP_INFOS.z;
  let n = normalize(normalize(FragNormal) + perturb);

  let viewDir = normalize(SCENE.CAMERA_POS.xyz - FragWorldPos);
  let cosTheta = clamp(dot(n, viewDir), 0.0, 1.0);
  let reflectAmount = CalcFresnel(cosTheta);

  let reflectDir = normalize(reflect(-viewDir, n) + vec3<f32>(nm.x, 0.0, nm.y) * MESH.OPTICS.w);
  let envSample = textureSample(ENV_MAP_TEXTURE, ENV_MAP_SAMPLER, reflectDir).rgb;

  let sunDir = normalize(-MESH.SUN_PARAMS.xyz);
  let sunDiffuse = max(dot(n, sunDir), 0.0);
  let halfDir = normalize(sunDir + viewDir);
  let specTerm = pow(max(dot(n, halfDir), 0.0), max(MESH.SUN_PARAMS.w, 1.0));
  let sunSpec = MESH.SUN_COLOR.rgb * (specTerm * MESH.SUN_COLOR.w);

  let waterTint = MESH.SURFACE_COLOR.rgb;
  let envColor = envSample * MESH.OPTICS.x * mix(vec3<f32>(1.0), waterTint * 2.0, 0.25);
  let lighting = vec3<f32>(0.35) + MESH.SUN_COLOR.rgb * (sunDiffuse * MESH.SUN_COLOR.w);

  var finalColor = mix(waterTint, envColor, reflectAmount) * lighting + sunSpec;

  var output: FragOutput;
  output.Base = vec4<f32>(finalColor, MESH.SURFACE_COLOR.w);
  output.Normal = vec4<f32>(n * 0.5 + 0.5, 1.0);
  output.Tag = MESH.TAG;
  output.Ch1 = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  return output;
}`;
