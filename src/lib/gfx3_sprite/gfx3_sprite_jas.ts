import { eventManager } from '../core/event_manager';
import { FormatJAS, fromAseprite, fromEzSpriteSheet } from '../core/format_jas';
import { UT } from '../core/utils';
import { Poolable } from '../core/object_pool';
import { Gfx3BoundingBox } from '../gfx3/gfx3_bounding_box';
import { Gfx3Sprite } from './gfx3_sprite';
import { Gfx3BoundingCylinder } from '../gfx3/gfx3_bounding_cylinder';

export interface Gfx3JASFrame {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface Gfx3JASAnimation {
  name: string;
  frames: Array<Gfx3JASFrame>;
  frameDuration: number;
  boundingBoxes: Array<Gfx3BoundingBox>;
  boundingCylinders: Array<Gfx3BoundingCylinder>;
};

/**
 * A 3D animated sprite.
 * It emit 'E_FINISHED'
 */
export class Gfx3SpriteJAS extends Gfx3Sprite implements Poolable<Gfx3SpriteJAS> {
  animations: Array<Gfx3JASAnimation>;
  currentAnimation: Gfx3JASAnimation | null;
  currentAnimationFrameIndex: number;
  looped: boolean;
  frameProgress: number;
  finished: boolean;
  boundingShapesDynamicMode: boolean;

  constructor() {
    super();
    this.animations = [];
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.looped = false;
    this.frameProgress = 0;
    this.finished = false;
    this.boundingShapesDynamicMode = false;
  }

  /**
   * Load asynchronously animated sprite data from a json file (jas).
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
      throw new Error('Gfx3SpriteJAS::loadFromData(): Data not valid !');
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
      const animation: Gfx3JASAnimation = {
        name: obj['Name'],
        frames: [],
        frameDuration: Number(obj['FrameDuration']),
        boundingBoxes: [],
        boundingCylinders: []
      };

      for (const frame of obj['Frames']) {
        animation.frames.push({
          x: frame['X'],
          y: frame['Y'],
          width: frame['Width'],
          height: frame['Height']
        });

        const bb = Gfx3BoundingBox.createFromCoord(frame['X'], frame['Y'], 0, frame['Width'], frame['Height'], 0);
        animation.boundingBoxes.push(bb);
        animation.boundingCylinders.push(Gfx3BoundingCylinder.createFromBoundingBox(bb));
      }

      this.animations.push(animation);
    }

    this.beginVertices(6);
    this.endVertices();

    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.frameProgress = 0;
    this.finished = false;
    this.frameChanged = false;
  }

  /**
   * The update function.
   * 
   * @param {number} ts - The timestep.
   */
  update(ts: number): void {
    if (!this.currentAnimation || !this.texture || this.finished) {
      return;
    }

    const currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];

    if (this.frameChanged || this.textureChanged) {
      const minX = 0;
      const minY = 0;
      const maxX = currentFrame.width;
      const maxY = currentFrame.height;
      const ux = (currentFrame.x / this.texture.gpuTexture.width);
      const uy = (currentFrame.y / this.texture.gpuTexture.height);
      const vx = (currentFrame.x + currentFrame.width) / this.texture.gpuTexture.width;
      const vy = (currentFrame.y + currentFrame.height) / this.texture.gpuTexture.height;
      const fux = this.flip[0] ? 1 - ux : ux;
      const fuy = this.flip[1] ? 1 - uy : uy;
      const fvx = this.flip[0] ? 1 - vx : vx;
      const fvy = this.flip[1] ? 1 - vy : vy;

      this.setVertices([
        minX, maxY, 0, fux, fuy,
        minX, minY, 0, fux, fvy,
        maxX, minY, 0, fvx, fvy,
        maxX, minY, 0, fvx, fvy,
        maxX, maxY, 0, fvx, fuy,
        minX, maxY, 0, fux, fuy
      ]);

      this.frameChanged = false;
    }

    if (this.offsetFactorEnabled) {
      this.offset[0] = currentFrame.width * this.offsetFactor[0];
      this.offset[1] = currentFrame.height * this.offsetFactor[1];
    }

    if (this.frameProgress >= this.currentAnimation.frameDuration) {
      if (this.currentAnimationFrameIndex == this.currentAnimation.frames.length - 1) {
        eventManager.emit(this, 'E_FINISHED');
        this.currentAnimationFrameIndex = this.looped ? 0 : this.currentAnimation.frames.length - 1;
        this.frameProgress = 0;
        this.finished = this.looped ? false : true;
        this.frameChanged = true;
      }
      else {
        this.currentAnimationFrameIndex = this.currentAnimationFrameIndex + 1;
        this.frameProgress = 0;
        this.frameChanged = true;
      }

      if (this.boundingShapesDynamicMode) {
        this.boundingBox = this.currentAnimation.boundingBoxes[this.currentAnimationFrameIndex];
        this.boundingCylinder = this.currentAnimation.boundingCylinders[this.currentAnimationFrameIndex];
      }
    }
    else {
      this.frameProgress += ts;
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
      throw new Error('Gfx3SpriteJAS::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.looped = looped;
    this.frameProgress = 0;
    this.finished = false;
    this.frameChanged = true;
  }

  /**
   * Returns the list of animation descriptors.
   */
  getAnimations(): Array<Gfx3JASAnimation> {
    return this.animations;
  }

  /**
   * Set the animation descriptors.
   * 
   * @param animations - The animations data.
   */
  setAnimations(animations: Array<Gfx3JASAnimation>): void {
    this.animations = animations;
    this.currentAnimation = null;
  }

  /**
   * Returns the current animation or null if there is no current animation.
   */
  getCurrentAnimation(): Gfx3JASAnimation | null {
    return this.currentAnimation;
  }

  /**
   * Returns the current animation frame index.
   */
  getCurrentAnimationFrameIndex(): number {
    return this.currentAnimationFrameIndex;
  }

  /**
   * Bounding shapes fit the sprite size in realtime.
   * 
   * @param {boolean} [dynamicMode] - Determines if bounding shapes fit the current animation.
   */
  setBoundingShapesDynamicMode(dynamicMode: boolean) {
    if (dynamicMode == false) {
      this.boundingBox = this.animations[0].boundingBoxes[0];
      this.boundingCylinder = this.animations[0].boundingCylinders[0];
    }

    this.boundingShapesDynamicMode = dynamicMode;
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
   * @param {Gfx3SpriteJAS} jas - The copy object.
   * @param {mat4} transformMatrix - The transformation matrix.
   */
  clone(jas: Gfx3SpriteJAS = new Gfx3SpriteJAS(), transformMatrix: mat4 = UT.MAT4_IDENTITY()): Gfx3SpriteJAS {
    super.clone(jas, transformMatrix);
    jas.animations = this.animations;
    jas.currentAnimation = null;
    jas.currentAnimationFrameIndex = 0;
    jas.looped = false;
    jas.frameProgress = 0;
    jas.finished = this.finished;
    return jas;
  }
}