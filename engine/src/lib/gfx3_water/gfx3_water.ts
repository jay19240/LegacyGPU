import { gfx3Manager } from '../gfx3/gfx3_manager';
import { gfx3WaterRenderer } from './gfx3_water_renderer';
import { Gfx3StaticGroup } from '../gfx3/gfx3_group';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { Gfx3WaterParam, WATER_SHADER_VERTEX_ATTR_COUNT, WATER_MAX_IMPACTS } from './gfx3_water_shader';

export interface Gfx3WaterImpact {
  x: number;
  z: number;
  strength: number;
  radius: number;
  lifetime: number;
  startTime: number;
};

/**
 * A water plane drawable.
 */
export class Gfx3Water extends Gfx3Drawable {
  texturesChanged: boolean;
  dataChanged: boolean;
  impacts: Array<Gfx3WaterImpact>;
  impactsBuffer: Float32Array;
  params: Float32Array;  
  grp2: Gfx3StaticGroup;
  envMap: Gfx3Texture;
  normalMap: Gfx3Texture;

  constructor() {
    super(WATER_SHADER_VERTEX_ATTR_COUNT);
    this.texturesChanged = false;
    this.dataChanged = false;
    this.impacts = [];
    this.impactsBuffer = new Float32Array(8 * WATER_MAX_IMPACTS);

    this.params = new Float32Array(Gfx3WaterParam.COUNT);
    this.params[Gfx3WaterParam.WAVE_AMPLITUDE] = 0.3;
    this.params[Gfx3WaterParam.WAVE_SCALE] = 0.18;
    this.params[Gfx3WaterParam.WAVE_SPEED] = 0.35;
    this.params[Gfx3WaterParam.WAVE_CHOPPINESS] = 1.0;
    this.params[Gfx3WaterParam.WAVE_STEP_X] = 0.5;
    this.params[Gfx3WaterParam.WAVE_STEP_Z] = 0.5;
    // --------------------------------------------------------------------------------------------------------
    this.params[Gfx3WaterParam.NORMAL_MAP_ENABLED] = 1.0;
    this.params[Gfx3WaterParam.NORMAL_MAP_SCROLL_X] = 0.04;
    this.params[Gfx3WaterParam.NORMAL_MAP_SCROLL_Y] = 0.03;
    this.params[Gfx3WaterParam.NORMAL_MAP_INTENSITY] = 0.5;
    this.params[Gfx3WaterParam.NORMAL_MAP_SCALE] = 6.0;
    // --------------------------------------------------------------------------------------------------------
    this.params[Gfx3WaterParam.SURFACE_COLOR_ENABLED] = 1.0;
    this.params[Gfx3WaterParam.SURFACE_COLOR_R] = 0.04;
    this.params[Gfx3WaterParam.SURFACE_COLOR_G] = 0.18;
    this.params[Gfx3WaterParam.SURFACE_COLOR_B] = 0.28;
    this.params[Gfx3WaterParam.SURFACE_COLOR_FACTOR] = 0.92;
    // --------------------------------------------------------------------------------------------------------
    this.params[Gfx3WaterParam.OPTICS_ENV_MAP_ENABLED] = 1.0;
    this.params[Gfx3WaterParam.OPTICS_ENV_INTENSITY] = 1.0;
    this.params[Gfx3WaterParam.OPTICS_FRESNEL_POWER] = 4.0;
    this.params[Gfx3WaterParam.OPTICS_FRESNEL_BIAS] = 0.4;    
    // --------------------------------------------------------------------------------------------------------
    this.params[Gfx3WaterParam.SUN_ENABLED] = 1.0;
    this.params[Gfx3WaterParam.SUN_DIRECTION_X] = -0.4;
    this.params[Gfx3WaterParam.SUN_DIRECTION_Y] = -1.0;
    this.params[Gfx3WaterParam.SUN_DIRECTION_Z] = -0.3;
    this.params[Gfx3WaterParam.SUN_SPECULAR_POWER] = 1.0;
    this.params[Gfx3WaterParam.SUN_COLOR_R] = 1.0;
    this.params[Gfx3WaterParam.SUN_COLOR_G] = 0.95;
    this.params[Gfx3WaterParam.SUN_COLOR_B] = 0.85;
    this.params[Gfx3WaterParam.SUN_COLOR_FACTOR] = 1.0;
    

    this.grp2 = gfx3Manager.createStaticGroup('WATER_PIPELINE', 2);
    this.envMap = this.grp2.setTexture(0, 'ENV_MAP_TEXTURE', gfx3Manager.createCubeMapFromBitmap(), { dimension: 'cube' });
    this.envMap = this.grp2.setSampler(1, 'ENV_MAP_SAMPLER', this.envMap);
    this.normalMap = this.grp2.setTexture(2, 'NORMAL_MAP_TEXTURE', gfx3Manager.createTextureFromBitmap());
    this.normalMap = this.grp2.setSampler(3, 'NORMAL_MAP_SAMPLER', this.normalMap);
    this.grp2.allocate();
  }

  /**
   * Load asynchronously water data from a json file (jwa).
   * 
   * @param {string} path - The file path.
   */
  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JWA') {
      throw new Error('Gfx3Water::loadFromFile(): File not valid !');
    }

    this.beginVertices(json['NumVertices']);

    for (let i = 0; i < json['NumVertices']; i++) {
      this.defineVertex(
        json['Vertices'][i * 3 + 0],
        json['Vertices'][i * 3 + 1],
        json['Vertices'][i * 3 + 2],
        json['TextureCoords'][i * 2 + 0],
        json['TextureCoords'][i * 2 + 1],
        json['Colors'][i * 3 + 0],
        json['Colors'][i * 3 + 1],
        json['Colors'][i * 3 + 2]
      );
    }

    this.endVertices();
  }

  /**
   * Load asynchronously water data from a binary file (bwa).
   * 
   * @param {string} path - The file path.
   */
  async loadFromBinaryFile(path: string): Promise<void> {
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    const data = new Float32Array(buffer);
    const dataInt = new Int32Array(buffer);
    let offset = 0;

    const numVertices = dataInt[0];
    offset += 1;

    const vertices = [];
    for (let i = 0; i < numVertices; i++) {
      vertices.push(data[offset + (i * 3) + 0], data[offset + (i * 3) + 1], data[offset + (i * 3) + 2]);
    }

    offset += numVertices * 3;

    const texcoords = [];
    for (let i = 0; i < numVertices; i++) {
      texcoords.push(data[offset + (i * 2) + 0], data[offset + (i * 2) + 1]);
    }

    offset += numVertices * 2;

    const colors = [];
    for (let i = 0; i < numVertices; i++) {
      colors.push(data[offset + (i * 3) + 0], data[offset + (i * 3) + 1], data[offset + (i * 3) + 2]);
    }

    this.beginVertices(numVertices);

    for (let i = 0; i < numVertices; i++) {
      this.defineVertex(
        vertices[i * 3 + 0],
        vertices[i * 3 + 1],
        vertices[i * 3 + 2],
        texcoords[i * 2 + 0],
        texcoords[i * 2 + 1],
        0,
        1,
        0,
        colors[i * 3 + 0],
        colors[i * 3 + 1],
        colors[i * 3 + 2]
      );
    }

    this.endVertices();
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
   * The update function.
   */
  update(_ts: number): void {
    const time = performance.now() / 1000;
    this.impacts = this.impacts.filter(i => time - i.startTime < i.lifetime);
    this.#fillImpactsBuffer(time);
  }

  /**
   * Set a parameter value.
   * 
   * @param {number} key - The param key.
   * @param {number} value - The param value.
   */
  setParam(key: number, value: number): void {
    this.params[key] = value;
    this.dataChanged = true;
  }

  /**
   * Returns the specified param value.
   * 
   * @param {number} key - The param key.
   */
  getParam(key: number): number {
    return this.params[key];
  }

  /**
   * Register a new impact at the given local XZ coordinates.
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
   * Returns the bindgroup(1).
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

  #fillImpactsBuffer(time: number): void {
    let count = 0;

    for (let i = 0; i < this.impacts.length && count < WATER_MAX_IMPACTS; i++) {
      const im = this.impacts[i];
      const age = time - im.startTime;
      if (age <= 0 || age >= im.lifetime) {
        continue;
      }

      const base = count * 8;
      this.impactsBuffer[base + 0] = im.x;
      this.impactsBuffer[base + 1] = im.z;
      this.impactsBuffer[base + 2] = im.strength;
      this.impactsBuffer[base + 3] = im.radius;
      this.impactsBuffer[base + 4] = age;
      this.impactsBuffer[base + 5] = im.lifetime;
      this.impactsBuffer[base + 6] = 0;
      this.impactsBuffer[base + 7] = 0;
      count++;
    }

    this.params[Gfx3WaterParam.WAVE_IMPACT_COUNT] = count;
 
    for (let i = count * 8; i < this.impactsBuffer.length; i++) {
      this.impactsBuffer[i] = 0;
    }
  }
}