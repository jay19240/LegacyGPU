import { gfx3Manager } from '../gfx3/gfx3_manager';
import { gfx3WaterRenderer } from './gfx3_water_renderer';
import { Gfx3StaticGroup } from '../gfx3/gfx3_group';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { WATER_SHADER_VERTEX_ATTR_COUNT, WATER_MAX_IMPACTS } from './gfx3_water_shader';

interface WaterImpact {
  x: number;
  z: number;
  strength: number;
  radius: number;
  lifetime: number;
  startTime: number;
};

/**
 * A water plane drawable. The grid surface is displaced in the vertex shader
 * by a 2-octave 2D Perlin noise field (drifting in two distinct directions to
 * avoid any preferred axis). Impacts locally boost the noise amplitude over a
 * smooth radial zone, preserving the underlying Perlin pattern. Per-vertex
 * normals are recomputed from the height field via central differences sampled
 * directly on the GPU. Shading combines environment cubemap reflection
 * (Fresnel-blended), a tangent-space normal map for fine detail, and a
 * directional sun.
 */
export class Gfx3Water extends Gfx3Drawable {
  texturesChanged: boolean;
  grp2: Gfx3StaticGroup;
  envMap: Gfx3Texture;
  normalMap: Gfx3Texture;
  waveParams: Float32Array; // 20 floats: nMap + color + optics + sunParams + sunColor
  wave: { amplitude: number, scale: number, speed: number, choppiness: number };
  impacts: Array<WaterImpact>;
  width: number;
  depth: number;
  segX: number;
  segZ: number;
  stepX: number;
  stepZ: number;
  gridX: Float32Array;
  gridZ: Float32Array;
  gridU: Float32Array;
  gridV: Float32Array;
  vertexData: Float32Array;

  constructor() {
    super(WATER_SHADER_VERTEX_ATTR_COUNT);
    this.texturesChanged = false;
    this.grp2 = gfx3Manager.createStaticGroup('WATER_PIPELINE', 2);
    this.envMap = this.grp2.setTexture(0, 'ENV_MAP_TEXTURE', gfx3Manager.createCubeMapFromBitmap(), { dimension: 'cube' });
    this.envMap = this.grp2.setSampler(1, 'ENV_MAP_SAMPLER', this.envMap);
    this.normalMap = this.grp2.setTexture(2, 'NORMAL_MAP_TEXTURE', gfx3Manager.createTextureFromBitmap());
    this.normalMap = this.grp2.setSampler(3, 'NORMAL_MAP_SAMPLER', this.normalMap);
    this.grp2.allocate();

    this.waveParams = new Float32Array(20);
    this.wave = { amplitude: 0.30, scale: 0.18, speed: 0.35, choppiness: 1.0 };
    this.setNormalMapInfos(0.04, 0.03, 0.5, 6.0);
    this.setSurfaceColor(0.04, 0.18, 0.28, 0.92);
    this.setOptics(1.0, 4.0, 0.4, 0.15);
    this.setSun(-0.4, -1.0, -0.3, 80.0);
    this.setSunColor(1.0, 0.95, 0.85, 1.0);

    this.impacts = [];
    this.width = 0;
    this.depth = 0;
    this.segX = 0;
    this.segZ = 0;
    this.stepX = 0;
    this.stepZ = 0;
    this.gridX = new Float32Array(0);
    this.gridZ = new Float32Array(0);
    this.gridU = new Float32Array(0);
    this.gridV = new Float32Array(0);
    this.vertexData = new Float32Array(0);

    this.buildGrid(20, 20, 32, 32);
  }

  /**
   * Free all resources.
   */
  delete(): void {
    this.grp2.delete();
    super.delete();
  }

  /**
   * The draw function.
   */
  draw(): void {
    gfx3WaterRenderer.drawWater(this);
  }

  /**
   * Build a planar grid mesh on the XZ plane centered at the origin.
   *
   * @param {number} width - Total size on X axis.
   * @param {number} depth - Total size on Z axis.
   * @param {number} segX - Number of subdivisions along X.
   * @param {number} segZ - Number of subdivisions along Z.
   */
  buildGrid(width: number, depth: number, segX: number, segZ: number): void {
    this.width = width;
    this.depth = depth;
    this.segX = segX;
    this.segZ = segZ;
    this.stepX = width / segX;
    this.stepZ = depth / segZ;

    const halfW = width * 0.5;
    const halfD = depth * 0.5;
    const cols = segX + 1;
    const rows = segZ + 1;
    const pointCount = cols * rows;

    this.gridX = new Float32Array(pointCount);
    this.gridZ = new Float32Array(pointCount);
    this.gridU = new Float32Array(pointCount);
    this.gridV = new Float32Array(pointCount);

    for (let iz = 0; iz < rows; iz++) {
      for (let ix = 0; ix < cols; ix++) {
        const k = iz * cols + ix;
        this.gridX[k] = -halfW + ix * this.stepX;
        this.gridZ[k] = -halfD + iz * this.stepZ;
        this.gridU[k] = ix / segX;
        this.gridV[k] = iz / segZ;
      }
    }

    const vertexCount = segX * segZ * 6;
    this.vertexData = new Float32Array(vertexCount * WATER_SHADER_VERTEX_ATTR_COUNT);
    this.beginVertices(vertexCount);
    this.fillVertexData();
    this.setVertices(Array.from(this.vertexData));
  }

  /**
   * Per-frame update: only manages impact lifecycle. Heights and normals are
   * computed entirely on the GPU in the vertex shader.
   */
  update(_ts: number): void {
    const time = performance.now() / 1000;
    this.impacts = this.impacts.filter(i => time - i.startTime < i.lifetime);
  }

  fillVertexData(): void {
    const cols = this.segX + 1;
    const stride = WATER_SHADER_VERTEX_ATTR_COUNT;
    let o = 0;
    for (let iz = 0; iz < this.segZ; iz++) {
      for (let ix = 0; ix < this.segX; ix++) {
        const k00 = iz * cols + ix;
        const k10 = k00 + 1;
        const k01 = k00 + cols;
        const k11 = k01 + 1;
        o = this.writeVertex(o, stride, k00); o = this.writeVertex(o, stride, k10); o = this.writeVertex(o, stride, k01);
        o = this.writeVertex(o, stride, k01); o = this.writeVertex(o, stride, k10); o = this.writeVertex(o, stride, k11);
      }
    }
  }

  writeVertex(o: number, stride: number, k: number): number {
    this.vertexData[o + 0] = this.gridX[k];
    this.vertexData[o + 1] = 0.0;
    this.vertexData[o + 2] = this.gridZ[k];
    this.vertexData[o + 3] = 0.0;
    this.vertexData[o + 4] = 1.0;
    this.vertexData[o + 5] = 0.0;
    this.vertexData[o + 6] = this.gridU[k];
    this.vertexData[o + 7] = this.gridV[k];
    return o + stride;
  }

  /**
   * Pack all per-frame shader data (waveParams + wave + grid + impacts) into the
   * supplied buffer at the given offset. Layout (92 floats):
   *   0..20   waveParams (nMap + color + optics + sun + sunColor)
   *   20..24  WAVE_PARAMS  (amp, scale, speed, choppiness)
   *   24..28  GRID_INFO    (stepX, stepZ, impactCount, _)
   *   28..60  IMPACTS_A[8] (x, z, strength, radius)
   *   60..92  IMPACTS_B[8] (age, lifetime, _, _)
   */
  writeShaderData(target: Float32Array, offset: number): void {
    for (let i = 0; i < 20; i++) target[offset + i] = this.waveParams[i];
    target[offset + 20] = this.wave.amplitude;
    target[offset + 21] = this.wave.scale;
    target[offset + 22] = this.wave.speed;
    target[offset + 23] = this.wave.choppiness;
    target[offset + 24] = this.stepX;
    target[offset + 25] = this.stepZ;
    target[offset + 27] = 0;

    const time = performance.now() / 1000;
    const aBase = offset + 28;
    const bBase = offset + 60;
    let count = 0;
    for (let i = 0; i < this.impacts.length && count < WATER_MAX_IMPACTS; i++) {
      const im = this.impacts[i];
      const age = time - im.startTime;
      if (age <= 0 || age >= im.lifetime) continue;
      target[aBase + count * 4 + 0] = im.x;
      target[aBase + count * 4 + 1] = im.z;
      target[aBase + count * 4 + 2] = im.strength;
      target[aBase + count * 4 + 3] = im.radius;
      target[bBase + count * 4 + 0] = age;
      target[bBase + count * 4 + 1] = im.lifetime;
      target[bBase + count * 4 + 2] = 0;
      target[bBase + count * 4 + 3] = 0;
      count++;
    }
    target[offset + 26] = count;
    for (let i = count; i < WATER_MAX_IMPACTS; i++) {
      for (let j = 0; j < 4; j++) {
        target[aBase + i * 4 + j] = 0;
        target[bBase + i * 4 + j] = 0;
      }
    }
  }

  /**
   * Configure the Perlin-noise driven wave field.
   *
   * @param {number} amplitude - Vertical amplitude in world units.
   * @param {number} scale - Spatial frequency of the noise (smaller = larger waves).
   * @param {number} speed - Drift speed of the noise field over time.
   * @param {number} choppiness - Peak sharpness exponent (1 = smooth, >1 = sharper crests).
   */
  setWave(amplitude: number, scale: number, speed: number, choppiness: number): void {
    this.wave.amplitude = amplitude;
    this.wave.scale = scale;
    this.wave.speed = speed;
    this.wave.choppiness = choppiness;
  }

  /**
   * Configure the normal map scrolling and intensity.
   */
  setNormalMapInfos(scrollX: number, scrollY: number, intensity: number, scale: number): void {
    this.waveParams[0] = scrollX;
    this.waveParams[1] = scrollY;
    this.waveParams[2] = intensity;
    this.waveParams[3] = scale;
  }

  /**
   * Set the base water color.
   */
  setSurfaceColor(r: number, g: number, b: number, opacity: number): void {
    this.waveParams[4] = r;
    this.waveParams[5] = g;
    this.waveParams[6] = b;
    this.waveParams[7] = opacity;
  }

  /**
   * Set the env map intensity, Fresnel parameters and reflection distortion.
   */
  setOptics(envIntensity: number, fresnelPower: number, fresnelBias: number, distortion: number): void {
    this.waveParams[8] = envIntensity;
    this.waveParams[9] = fresnelPower;
    this.waveParams[10] = fresnelBias;
    this.waveParams[11] = distortion;
  }

  /**
   * Set the sun direction (pointing from sun towards surface) and specular sharpness.
   */
  setSun(dirX: number, dirY: number, dirZ: number, specularPower: number): void {
    this.waveParams[12] = dirX;
    this.waveParams[13] = dirY;
    this.waveParams[14] = dirZ;
    this.waveParams[15] = specularPower;
  }

  /**
   * Set the sun color and specular intensity multiplier.
   */
  setSunColor(r: number, g: number, b: number, intensity: number): void {
    this.waveParams[16] = r;
    this.waveParams[17] = g;
    this.waveParams[18] = b;
    this.waveParams[19] = intensity;
  }

  /**
   * Register a new impact at the given local XZ coordinates. The impact adds an
   * additive amplitude boost over a smooth radial zone, modulating the existing
   * Perlin noise rather than overwriting it.
   *
   * @param {number} x - Local X coordinate.
   * @param {number} z - Local Z coordinate.
   * @param {number} strength - Additive amplitude (in world units) at the center.
   * @param {number} radius - Spatial extent of the boost zone (world units).
   * @param {number} lifetime - Total duration of the impact in seconds.
   */
  addImpact(x: number, z: number, strength: number, radius: number = 6.0, lifetime: number = 3.0): void {
    if (this.impacts.length >= WATER_MAX_IMPACTS) {
      this.impacts.shift();
    }

    this.impacts.push({ x, z, strength, radius, lifetime, startTime: performance.now() / 1000 });
  }

  /**
   * Set the environment cubemap texture.
   */
  setEnvMap(texture: Gfx3Texture): void {
    this.envMap = texture;
    this.texturesChanged = true;
  }

  /**
   * Set the tangent-space normal map texture.
   */
  setNormalMap(texture: Gfx3Texture): void {
    this.normalMap = texture;
    this.texturesChanged = true;
  }

  /**
   * Returns the bindgroup(2).
   */
  getGroup02(): Gfx3StaticGroup {
    if (this.texturesChanged) {
      this.grp2.setTexture(0, 'ENV_MAP_TEXTURE', this.envMap, { dimension: 'cube' });
      this.grp2.setSampler(1, 'ENV_MAP_SAMPLER', this.envMap);
      this.grp2.setTexture(2, 'NORMAL_MAP_TEXTURE', this.normalMap);
      this.grp2.setSampler(3, 'NORMAL_MAP_SAMPLER', this.normalMap);
      this.grp2.allocate();
      this.texturesChanged = false;
    }

    return this.grp2;
  }
}
