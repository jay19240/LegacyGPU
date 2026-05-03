import { gfx3Manager } from '../gfx3/gfx3_manager';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { gfx3SkyboxRenderer } from './gfx3_skybox_renderer';
import { Gfx3StaticGroup } from '../gfx3/gfx3_group';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { SKYBOX_SHADER_VERTEX_ATTR_COUNT } from './gfx3_skybox_shader';

/**
 * A cubemap skybox.
 */
export class Gfx3Skybox extends Gfx3Drawable {
  cubemapChanged: boolean;
  grp1: Gfx3StaticGroup;
  cubemap: Gfx3Texture;

  constructor() {
    super(SKYBOX_SHADER_VERTEX_ATTR_COUNT);
    this.cubemapChanged = false;
    this.grp1 = gfx3Manager.createStaticGroup('SKYBOX_PIPELINE', 1);
    this.cubemap = this.grp1.setTexture(0, 'CUBEMAP_TEXTURE', gfx3Manager.createCubeMapFromBitmap(), { dimension: 'cube' });
    this.cubemap = this.grp1.setSampler(1, 'CUBEMAP_SAMPLER', this.cubemap);

    this.beginVertices(6);
    this.defineVertex(-1, -1, -1, -1, -1, -1);
    this.defineVertex(+1, -1, -1, -1, -1, +1);
    this.defineVertex(-1, +1, -1, +1, -1, +1);
    this.defineVertex(-1, +1, -1, -1, -1, -1);
    this.defineVertex(+1, -1, -1, +1, -1, +1);
    this.defineVertex(+1, +1, -1, +1, -1, -1);
    this.endVertices();

    this.grp1.allocate();
  }

  /**
   * Load asynchronously skybox data from a json file (sky).
   * 
   * @param {string} path - The file path.
   */
  async loadFromFile(path: string, textureDir: string = ''): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'SKY') {
      throw new Error('Gfx3Skybox::loadFromData(): Data not valid !');
    }

    if (!json['Name'] || !json['Right'] || !json['Left'] || !json['Top'] || !json['Bottom'] || !json['Front'] || !json['Back']) {
      throw new Error('Gfx3Skybox::loadFromFile(): File not correctly formated !');
    }

    this.setCubemap(await gfx3TextureManager.loadCubemapTexture({
      right: textureDir + json['Right'],
      left: textureDir + json['Left'],
      top: textureDir + json['Top'],
      bottom: textureDir + json['Bottom'],
      front: textureDir + json['Front'],
      back: textureDir + json['Back']
    }, json['Right'] + json['Left'] + json['Top'] + json['Bottom'] + json['Front'] + json['Back']));
  }

  /**
   * Free all resources.
   * Warning: You need to call this method to free allocation for this object.
   */
  delete(): void {
    this.grp1.delete();
    super.delete();
  }

  /**
   * The draw function.
   */
  draw(): void {
    gfx3SkyboxRenderer.draw(this);
  }

  /**
   * Set the cubemap texture.
   * 
   * @param {Gfx3Texture} cubemap - The cubemap texture.
   */
  setCubemap(cubemap: Gfx3Texture): void {
    this.cubemap = cubemap;
    this.cubemapChanged = true;
  }

  /**
   * Returns the cubemap texture.
   */
  getCubemap(): Gfx3Texture {
    return this.cubemap;
  }

  /**
   * Returns the bindgroup(1).
   */
  getGroup01(): Gfx3StaticGroup {
    if (this.cubemapChanged) {
      this.grp1.setTexture(0, 'CUBEMAP_TEXTURE', this.cubemap, { dimension: 'cube' });
      this.grp1.allocate();
      this.cubemapChanged = false;
    }

    return this.grp1;
  }
}