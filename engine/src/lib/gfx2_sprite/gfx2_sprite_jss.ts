import { gfx2Manager } from '../gfx2/gfx2_manager';
import { Poolable } from '../core/object_pool';
import { Gfx2Drawable } from '../gfx2/gfx2_drawable';
import { Gfx2BoundingRect } from '../gfx2/gfx2_bounding_rect';

/**
 * A 2D static sprite (without animations).
 */
export class Gfx2SpriteJSS extends Gfx2Drawable implements Poolable<Gfx2SpriteJSS> {
  texture: ImageBitmap | HTMLImageElement;
  tintedTexture: ImageBitmap | HTMLImageElement;
  textureRect: vec4;
  blendColor: vec3;
  blendColorMode: GlobalCompositeOperation | '';

  constructor() {
    super();
    this.texture = gfx2Manager.getDefaultTexture();
    this.tintedTexture = gfx2Manager.getDefaultTexture();
    this.textureRect = [0, 0, 0, 0];
    this.blendColor = [1, 1, 1];
    this.blendColorMode = '';
  }

  /**
   * Load asynchronously sprite data from a json file (jss).
   * 
   * @param {string} path - The file path.
   */
  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'JSS') {
      throw new Error('Gfx2SpriteJSS::loadFromFile(): File not valid !');
    }

    this.textureRect[0] = json['X'];
    this.textureRect[1] = json['Y'];
    this.textureRect[2] = json['Width'];
    this.textureRect[3] = json['Height'];

    this.offset[0] = json['OffsetX'] ?? 0;
    this.offset[1] = json['OffsetY'] ?? 0;

    this.flip[0] = json['FlipX'] ?? false;
    this.flip[1] = json['FlipY'] ?? false;

    this.offsetFactor[0] = json['OffsetFactorX'] ?? 0;
    this.offsetFactor[1] = json['OffsetFactorY'] ?? 0;
    this.offsetFactorEnabled = json['OffsetFactorEnabled'] ? true : false;

    this.boundingRect = Gfx2BoundingRect.createFromCoord(
      json['X'],
      json['Y'],
      json['Width'],
      json['Height']
    );
  }

  /**
   * The paint function.
   */
  onRender(): void {
    const ctx = gfx2Manager.getContext();
    ctx.scale(this.flip[0] ? -1 : 1, this.flip[1] ? -1 : 1);

    if (this.offsetFactorEnabled) {
      this.offset[0] = this.textureRect[2] * this.offsetFactor[0];
      this.offset[1] = this.textureRect[3] * this.offsetFactor[1];
    }

    if (this.blendColorMode == '') {
      ctx.drawImage(
        this.texture,
        this.textureRect[0],
        this.textureRect[1],
        this.textureRect[2],
        this.textureRect[3],
        this.flip[0] ? this.textureRect[2] * -1 : 0,
        this.flip[1] ? this.textureRect[3] * -1 : 0,
        this.textureRect[2],
        this.textureRect[3]
      );
    }
    else {
      ctx.drawImage(
        this.tintedTexture,
        this.textureRect[0],
        this.textureRect[1],
        this.textureRect[2],
        this.textureRect[3],
        this.flip[0] ? this.textureRect[2] * -1 : 0,
        this.flip[1] ? this.textureRect[3] * -1 : 0,
        this.textureRect[2],
        this.textureRect[3]
      );
    }
  }

  /**
   * Returns the texture rectangle.
   */
  getTextureRect(): vec4 {
    return this.textureRect;
  }

  /**
   * Returns the texture rect width.
   */
  getTextureRectWidth(): number {
    return this.textureRect[2];
  }

  /**
   * Returns the texture rect height.
   */
  getTextureRectHeight(): number {
    return this.textureRect[3];
  }

  /**
   * Set the texture rectangle.
   * 
   * @param {number} left - The x-coordinate of the top-left texture rectangle corner.
   * @param {number} top - The y-coordinate of the top-left texture rectangle corner.
   * @param {number} width - The width of the texture rectangle.
   * @param {number} height - The height of the texture rectangle.
   */
  setTextureRect(left: number, top: number, width: number, height: number): void {
    this.textureRect = [left, top, width, height];
    this.boundingRect = Gfx2BoundingRect.createFromCoord(left, top, width, height);
  }

  /**
   * Set the sprite texture.
   * 
   * @param {ImageBitmap | HTMLImageElement} texture - The sprite texture.
   */
  setTexture(texture: ImageBitmap | HTMLImageElement): void {
    if (this.textureRect[2] == 0 && this.textureRect[3] == 0) {
      this.textureRect[2] = texture.width;
      this.textureRect[3] = texture.height;
      this.boundingRect = Gfx2BoundingRect.createFromCoord(this.textureRect[0], this.textureRect[1], this.textureRect[2], this.textureRect[3]);
    }

    this.texture = texture;
  }

  /**
   * Returns the sprite texture.
   */
  getTexture(): ImageBitmap | HTMLImageElement {
    return this.texture;
  }

  /**
   * Returns the blend color.
   */
  getBlendColor(): vec3 {
    return this.blendColor;
  }

  /**
   * Returns the blend color mode.
   */
  getBlendColorMode(): GlobalCompositeOperation | '' {
    return this.blendColorMode;
  }

  /**
   * Set the color filter.
   * 
   * @param {number} r - The red channel.
   * @param {number} g - The green channel.
   * @param {number} b - The blue channel.
   */
  setBlendColor(r: number, g: number, b: number): void {
    this.blendColor = [r, g, b];
    this.blendColorMode = 'multiply';
    this.tintedTexture = gfx2Manager.getTintedTexture(this.texture, r, g, b);
  }

  /**
   * Clone the object.
   * 
   * @param {Gfx2SpriteJSS} jss - The copy object.
   */
  clone(jss: Gfx2SpriteJSS = new Gfx2SpriteJSS()): Gfx2SpriteJSS {
    super.clone(jss);
    jss.texture = this.texture;
    jss.tintedTexture = this.tintedTexture;
    jss.textureRect = [this.textureRect[0], this.textureRect[1], this.textureRect[2], this.textureRect[3]];
    jss.blendColor = [this.blendColor[0], this.blendColor[1], this.blendColor[2]];
    jss.blendColorMode = this.blendColorMode;
    return jss;
  }
}