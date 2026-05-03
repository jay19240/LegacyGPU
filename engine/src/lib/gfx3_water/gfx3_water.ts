import { gfx3Manager } from '../gfx3/gfx3_manager';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { gfx3WaterRenderer } from './gfx3_water_renderer';
import { Gfx3StaticGroup } from '../gfx3/gfx3_group';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { Gfx3WaterParam, Gfx3WaterImpact, WATER_SHADER_VERTEX_ATTR_COUNT, WATER_MAX_IMPACTS } from './gfx3_water_shader';

interface WaterImpact {
  x: number;
  z: number;
  strength: number;
  radius: number;
  lifetime: number;
  startTime: number;
}

/**
 * A water plane drawable.
 */
export class Gfx3Water extends Gfx3Drawable {
  texturesChanged: boolean;
  impacts: Array<WaterImpact>;
  impactsBuffer: Float32Array;
  params: Float32Array;
  grp2: Gfx3StaticGroup;
  envMap: Gfx3Texture;
  normalMap: Gfx3Texture;

  constructor() {
    super(WATER_SHADER_VERTEX_ATTR_COUNT);
    this.texturesChanged = false;
    this.impacts = [];
    this.impactsBuffer = new Float32Array(Gfx3WaterImpact.COUNT * WATER_MAX_IMPACTS);
    this.params = new Float32Array(Gfx3WaterParam.COUNT);

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
  async loadFromFile(path: string, textureDir: string = ''): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JWA') {
      throw new Error('Gfx3Water::loadFromFile(): File not valid !');
    }

    let envMap = undefined;
    if (json['EnvMapRight'] && json['EnvMapLeft'] && json['EnvMapTop'] && json['EnvMapBottom'] && json['EnvMapFront'] && json['EnvMapBack']) {
      envMap = await gfx3TextureManager.loadCubemapTexture({
        right: textureDir + json['EnvMapRight'],
        left: textureDir + json['EnvMapLeft'],
        top: textureDir + json['EnvMapTop'],
        bottom: textureDir + json['EnvMapBottom'],
        front: textureDir + json['EnvMapFront'],
        back: textureDir + json['EnvMapBack']
      }, json['EnvMapRight'] + json['EnvMapLeft'] + json['EnvMapTop'] + json['EnvMapBottom'] + json['EnvMapFront'] + json['EnvMapBack']);
    }

    this.params[Gfx3WaterParam.WAVE_AMPLITUDE] = json['WaveAmplitude'];
    this.params[Gfx3WaterParam.WAVE_SCALE] = json['WaveScale'];
    this.params[Gfx3WaterParam.WAVE_SPEED] = json['WaveSpeed'];
    this.params[Gfx3WaterParam.WAVE_CHOPPINESS] = json['WaveChoppiness'];
    this.params[Gfx3WaterParam.WAVE_STEP_X] = json['WaveStepX'];
    this.params[Gfx3WaterParam.WAVE_STEP_Z] = json['WaveStepZ'];
    this.params[Gfx3WaterParam.NORMAL_MAP_ENABLED] = json['NormalMap'] ? 1.0 : 0.0;
    this.params[Gfx3WaterParam.NORMAL_MAP_SCROLL_X] = json['NormalMapScrollX'];
    this.params[Gfx3WaterParam.NORMAL_MAP_SCROLL_Y] = json['NormalMapScrollY'];
    this.params[Gfx3WaterParam.NORMAL_MAP_INTENSITY] = json['NormalMapIntensity'];
    this.params[Gfx3WaterParam.NORMAL_MAP_SCALE] = json['NormalMapScale'];
    this.params[Gfx3WaterParam.SURFACE_COLOR_ENABLED] = json['SurfaceColorEnabled'];
    this.params[Gfx3WaterParam.SURFACE_COLOR_R] = json['SurfaceColorR'];
    this.params[Gfx3WaterParam.SURFACE_COLOR_G] = json['SurfaceColorG'];
    this.params[Gfx3WaterParam.SURFACE_COLOR_B] = json['SurfaceColorB'];
    this.params[Gfx3WaterParam.SURFACE_COLOR_FACTOR] = json['SurfaceColorFactor'];
    this.params[Gfx3WaterParam.OPTICS_ENV_MAP_ENABLED] = envMap ? 1.0 : 0.0;
    this.params[Gfx3WaterParam.OPTICS_ENV_INTENSITY] = json['EnvMapIntensity'];
    this.params[Gfx3WaterParam.OPTICS_FRESNEL_POWER] = json['FresnelPower'];
    this.params[Gfx3WaterParam.OPTICS_FRESNEL_BIAS] = json['FresnelBiais'];
    this.params[Gfx3WaterParam.SUN_ENABLED] = json['SunEnabled'];
    this.params[Gfx3WaterParam.SUN_DIRECTION_X] = json['SunDirectionX'];
    this.params[Gfx3WaterParam.SUN_DIRECTION_Y] = json['SunDirectionY'];
    this.params[Gfx3WaterParam.SUN_DIRECTION_Z] = json['SunDirectionZ'];
    this.params[Gfx3WaterParam.SUN_COLOR_R] = json['SunColorR'];
    this.params[Gfx3WaterParam.SUN_COLOR_G] = json['SunColorG'];
    this.params[Gfx3WaterParam.SUN_COLOR_B] = json['SunColorB'];
    this.params[Gfx3WaterParam.SUN_COLOR_FACTOR] = json['SunColorFactor'];

    this.normalMap = json['NormalMap'] ?
    await gfx3TextureManager.loadTexture(textureDir + json['NormalMap'], { addressModeU: 'repeat', addressModeV: 'repeat' }) :
    gfx3Manager.createTextureFromBitmap();

    this.envMap = envMap ? envMap : gfx3Manager.createCubeMapFromBitmap();
    this.texturesChanged = true;

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
  async loadFromBinaryFile(path: string, textureDir: string = ''): Promise<void> {
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    const view = new DataView(buffer);
    let offset = 0;

    const numVertices = view.getFloat32(offset, true);
    offset += 4;

    this.params[Gfx3WaterParam.WAVE_AMPLITUDE] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.WAVE_SCALE] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.WAVE_SPEED] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.WAVE_CHOPPINESS] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.WAVE_STEP_X] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.WAVE_STEP_Z] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.NORMAL_MAP_SCROLL_X] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.NORMAL_MAP_SCROLL_Y] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.NORMAL_MAP_INTENSITY] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.NORMAL_MAP_SCALE] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SURFACE_COLOR_ENABLED] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SURFACE_COLOR_R] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SURFACE_COLOR_G] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SURFACE_COLOR_B] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SURFACE_COLOR_FACTOR] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.OPTICS_ENV_INTENSITY] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.OPTICS_FRESNEL_POWER] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.OPTICS_FRESNEL_BIAS] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_ENABLED] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_DIRECTION_X] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_DIRECTION_Y] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_DIRECTION_Z] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_COLOR_R] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_COLOR_G] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_COLOR_B] = view.getFloat32(offset, true); offset += 4;
    this.params[Gfx3WaterParam.SUN_COLOR_FACTOR] = view.getFloat32(offset, true); offset += 4;

    const decoder = new TextDecoder('utf-8');
    const readString = (): string => {
      const len = view.getInt32(offset, true);
      offset += 4;
      const str = decoder.decode(new Uint8Array(buffer, offset, len));
      offset += len;
      return str;
    };

    const normalMap = readString();
    const envMapRight = readString();
    const envMapLeft = readString();
    const envMapTop = readString();
    const envMapBottom = readString();
    const envMapFront = readString();
    const envMapBack = readString();

    let envMapTexture = undefined;
    if (envMapRight && envMapLeft && envMapTop && envMapBottom && envMapFront && envMapBack) {
      envMapTexture = await gfx3TextureManager.loadCubemapTexture({
        right: textureDir + envMapRight,
        left: textureDir + envMapLeft,
        top: textureDir + envMapTop,
        bottom: textureDir + envMapBottom,
        front: textureDir + envMapFront,
        back: textureDir + envMapBack
      }, envMapRight + envMapLeft + envMapTop + envMapBottom + envMapFront + envMapBack);
    }

    this.normalMap = normalMap ?
    await gfx3TextureManager.loadTexture(textureDir + normalMap, { addressModeU: 'repeat', addressModeV: 'repeat' }) :
    gfx3Manager.createTextureFromBitmap();
    
    this.envMap = envMapTexture ? envMapTexture : gfx3Manager.createCubeMapFromBitmap();
    this.texturesChanged = true;

    this.params[Gfx3WaterParam.NORMAL_MAP_ENABLED] = normalMap ? 1.0 : 0.0;
    this.params[Gfx3WaterParam.OPTICS_ENV_MAP_ENABLED] = envMapTexture ? 1.0 : 0.0;

    const vertices: Array<number> = [];
    for (let i = 0; i < numVertices * 3; i++) {
      vertices.push(view.getFloat32(offset, true));
      offset += 4;
    }

    const texcoords: Array<number> = [];
    for (let i = 0; i < numVertices * 2; i++) {
      texcoords.push(view.getFloat32(offset, true));
      offset += 4;
    }

    const colors: Array<number> = [];
    for (let i = 0; i < numVertices * 3; i++) {
      colors.push(view.getFloat32(offset, true));
      offset += 4;
    }

    this.beginVertices(numVertices);

    for (let i = 0; i < numVertices; i++) {
      this.defineVertex(
        vertices[i * 3 + 0],
        vertices[i * 3 + 1],
        vertices[i * 3 + 2],
        texcoords[i * 2 + 0],
        texcoords[i * 2 + 1],
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
  update(ts: number): void {
    const time = performance.now() / 1000;
    this.impacts = this.impacts.filter(im => time - im.startTime < im.lifetime);

    let count = 0;

    for (let i = 0; i < this.impacts.length && count < WATER_MAX_IMPACTS; i++) {
      const im = this.impacts[i];
      const age = time - im.startTime;
      if (age <= 0 || age >= im.lifetime) {
        continue;
      }

      const base = count * Gfx3WaterImpact.COUNT;
      this.impactsBuffer[base + Gfx3WaterImpact.X] = im.x;
      this.impactsBuffer[base + Gfx3WaterImpact.Z] = im.z;
      this.impactsBuffer[base + Gfx3WaterImpact.STRENGTH] = im.strength;
      this.impactsBuffer[base + Gfx3WaterImpact.RADIUS] = im.radius;
      this.impactsBuffer[base + Gfx3WaterImpact.LIFETIME] = im.lifetime;
      this.impactsBuffer[base + Gfx3WaterImpact.AGE] = age;
      count++;
    }

    this.params[Gfx3WaterParam.WAVE_IMPACT_COUNT] = count;
 
    for (let i = count * Gfx3WaterImpact.COUNT; i < this.impactsBuffer.length; i++) {
      this.impactsBuffer[i] = 0;
    }
  }

  /**
   * Set a parameter value.
   * 
   * @param {number} key - The param key.
   * @param {number} value - The param value.
   */
  setParam(key: number, value: number): void {
    this.params[key] = value;
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

    this.impacts.push({
      x: x,
      z: z,
      strength: strength,
      radius: radius,
      lifetime: lifetime,
      startTime: performance.now() / 1000
    });
  }

  /**
   * Set the environment cubemap texture.
   */
  setEnvMap(texture: Gfx3Texture): void {
    this.envMap = texture;
    this.params[Gfx3WaterParam.OPTICS_ENV_MAP_ENABLED] = 1;
    this.texturesChanged = true;
  }

  /**
   * Set the tangent-space normal map texture.
   */
  setNormalMap(texture: Gfx3Texture): void {
    this.normalMap = texture;
    this.params[Gfx3WaterParam.NORMAL_MAP_ENABLED] = 1;
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