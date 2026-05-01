import { eventManager } from '../core/event_manager';
import { gfx2Manager } from '../gfx2/gfx2_manager';
import { FormatJAS, fromAseprite, fromEzSpriteSheet } from '../core/format_jas';
import { Poolable } from '../core/object_pool';
import { Gfx2Drawable } from '../gfx2/gfx2_drawable';
import { Gfx2BoundingRect } from '../gfx2/gfx2_bounding_rect';

export interface Gfx2JASFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Gfx2JASAnimation {
  name: string;
  frames: Array<Gfx2JASFrame>;
  frameDuration: number;
  boundingRects: Array<Gfx2BoundingRect>;
}

/**
 * A 2D sprite with animations.
 * It emit 'E_FINISHED'
 */
export class Gfx2SpriteJAS extends Gfx2Drawable implements Poolable<Gfx2SpriteJAS> {
  animations: Array<Gfx2JASAnimation>;
  texture: ImageBitmap | HTMLImageElement;
  tintedTexture: ImageBitmap | HTMLImageElement;
  blendColor: vec3;
  blendColorMode: GlobalCompositeOperation | '';
  currentAnimation: Gfx2JASAnimation | null;
  currentAnimationFrameIndex: number;
  looped: boolean;
  frameProgress: number;
  finished: boolean;
  boundingRectDynamicMode: boolean;

  constructor() {
    super();
    this.animations = [];
    this.texture = gfx2Manager.getDefaultTexture();
    this.tintedTexture = gfx2Manager.getDefaultTexture();
    this.blendColor = [1, 1, 1];
    this.blendColorMode = '';
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.looped = false;
    this.frameProgress = 0;
    this.finished = false;
    this.boundingRectDynamicMode = false;
  }

  /**
   * Loads asynchronously sprite data from a json file (jas).
   * 
   * @param {string} path - The file path.
   */
  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();
    this.loadFromData(json);
  }

  /**
   * Loads asynchronously sprite data from a aseprite file (ase).
   * 
   * @param {string} path - The file path.
   */
  async loadFromAsepriteFile(path: string): Promise<void> {
    const data = await fromAseprite(path);
    this.loadFromData(data);
  }

  /**
   * Loads asynchronously sprite data from a ez-sprite-sheet file (json).
   * 
   * @param {string} path - The file path.
   */
  async loadFromEzSpriteSheet(path: string): Promise<void> {
    const data = await fromEzSpriteSheet(path);
    this.loadFromData(data);
  }

  /**
   * Loads sprite data from a jas formatted data.
   * 
   * @param {FormatJAS} data - The jas formatted data.
   */
  loadFromData(data: FormatJAS): void {
    if (!data.hasOwnProperty('Ident') || data['Ident'] != 'JAS') {
      throw new Error('Gfx2SpriteJAS::loadFromData(): Data not valid !');
    }

    this.offset[0] = data['OffsetX'] ?? 0;
    this.offset[1] = data['OffsetY'] ?? 0;

    this.flip[0] = data['FlipX'] ?? false;
    this.flip[1] = data['FlipY'] ?? false;

    this.offsetFactor[0] = data['OffsetFactorX'] ?? 0;
    this.offsetFactor[1] = data['OffsetFactorY'] ?? 0;
    this.offsetFactorEnabled = data['OffsetFactorEnabled'] ? true : false;

    this.animations = [];
    for (const obj of data['Animations']) {
      const animation: Gfx2JASAnimation = {
        name: obj['Name'],
        frames: [],
        frameDuration: Number(obj['FrameDuration']),
        boundingRects: []
      };

      for (const frame of obj['Frames']) {
        animation.frames.push({
          x: frame['X'],
          y: frame['Y'],
          width: frame['Width'],
          height: frame['Height']
        });

        animation.boundingRects.push(Gfx2BoundingRect.createFromCoord(
          frame['X'],
          frame['Y'],
          frame['Width'],
          frame['Height']
        ));
      }

      this.animations.push(animation);
    }

    this.boundingRect = this.animations[0].boundingRects[0];
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.frameProgress = 0;
    this.finished = false;
  }

  /**
   * The update function.
   * 
   * @param {number} ts - The timestep.
   */
  update(ts: number): void {
    if (!this.currentAnimation || this.finished) {
      return;
    }

    if (this.frameProgress >= this.currentAnimation.frameDuration) {
      if (this.currentAnimationFrameIndex == this.currentAnimation.frames.length - 1) {
        eventManager.emit(this, 'E_FINISHED');
        this.currentAnimationFrameIndex = this.looped ? 0 : this.currentAnimation.frames.length - 1;
        this.frameProgress = 0;
        this.finished = this.looped ? false : true;
      }
      else {
        this.currentAnimationFrameIndex = this.currentAnimationFrameIndex + 1;
        this.frameProgress = 0;
      }

      if (this.boundingRectDynamicMode) {
        this.boundingRect = this.currentAnimation.boundingRects[this.currentAnimationFrameIndex];
      }
    }
    else {
      this.frameProgress += ts;
    }
  }

  /**
   * The draw function.
   */
  onRender(): void {
    if (!this.currentAnimation) {
      return;
    }

    const ctx = gfx2Manager.getContext();
    const currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];
    const destX = this.flip[0] ? currentFrame.width * -1 : 0;
    const destY = this.flip[1] ? currentFrame.height * -1 : 0;

    ctx.scale(this.flip[0] ? -1 : 1, this.flip[1] ? -1 : 1);

    if (this.offsetFactorEnabled) {
      this.offset[0] = currentFrame.width * this.offsetFactor[0];
      this.offset[1] = currentFrame.height * this.offsetFactor[1];
    }

    if (this.blendColorMode == '') {
      ctx.drawImage(
        this.texture,
        currentFrame.x,
        currentFrame.y,
        currentFrame.width,
        currentFrame.height,
        destX,
        destY,
        currentFrame.width,
        currentFrame.height
      );
    }
    else {
      ctx.drawImage(
        this.tintedTexture,
        currentFrame.x,
        currentFrame.y,
        currentFrame.width,
        currentFrame.height,
        destX,
        destY,
        currentFrame.width,
        currentFrame.height
      );
    }
  }

  /**
   * Play a specific animation.
   * 
   * @param {string} animationName - The name of the animation to be played.
   * @param {boolean} [looped=false] - Determines whether the animation should loop or not.
   * @param {boolean} [preventSameAnimation=false] - Determines whether the same animation should be prevented from playing again.
   */
  play(animationName: string, looped: boolean = false, preventSameAnimation: boolean = false): void {
    if (preventSameAnimation && this.currentAnimation && animationName == this.currentAnimation.name) {
      return;
    }

    const animation = this.animations.find(animation => animation.name == animationName);
    if (!animation) {
      throw new Error('Gfx2SpriteJAS::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.looped = looped;
    this.frameProgress = 0;
    this.finished = false;
  }

  /**
   * Returns the list of animation descriptors.
   */
  getAnimations(): Array<Gfx2JASAnimation> {
    return this.animations;
  }

  /**
   * Set the animation descriptors.
   * 
   * @param animations - The animations data.
   */
  setAnimations(animations: Array<Gfx2JASAnimation>): void {
    this.animations = animations;
  }

  /**
   * Returns the current animation or null if there is no current animation.
   */
  getCurrentAnimation(): Gfx2JASAnimation | null {
    return this.currentAnimation;
  }

  /**
   * Returns the current animation frame index.
   */
  getCurrentAnimationFrameIndex(): number {
    return this.currentAnimationFrameIndex;
  }

  /**
   * Returns the sprite texture.
   */
  getTexture(): ImageBitmap | HTMLImageElement {
    return this.texture;
  }

  /**
   * Set the sprite texture.
   * 
   * @param {ImageBitmap} texture - The sprite texture.
   */
  setTexture(texture: ImageBitmap): void {
    this.texture = texture;
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
   * Bounding rect fit the sprite size in realtime.
   * 
   * @param {boolean} [dynamicMode] - Determines if bounding rect fit the current animation.
   */
  setBoundingRectDynamicMode(dynamicMode: boolean) {
    if (dynamicMode == false) {
      this.boundingRect = this.animations[0].boundingRects[0];
    }

    this.boundingRectDynamicMode = dynamicMode;
  }

  /**
   * Checks if animation is finished or not.
   */
  isFinished(): boolean {
    return this.finished;
  }

  /**
   * Clone the object.
   * 
   * @param {Gfx2SpriteJAS} jas - The copy object.
   */
  clone(jas: Gfx2SpriteJAS = new Gfx2SpriteJAS()): Gfx2SpriteJAS {
    super.clone(jas);
    jas.animations = this.animations;
    jas.texture = this.texture;
    jas.tintedTexture = this.tintedTexture;
    jas.blendColor = [this.blendColor[0], this.blendColor[1], this.blendColor[2]];
    jas.blendColorMode = this.blendColorMode;
    jas.currentAnimation = null;
    jas.currentAnimationFrameIndex = 0;
    jas.looped = false;
    jas.frameProgress = 0;
    jas.finished = false;
    return jas;
  }
}