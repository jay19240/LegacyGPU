import { eventManager } from '../core/event_manager';
import { FormatJAS, fromAseprite, fromEzSpriteSheet } from '../core/format_jas';
import { UIWidget } from '../ui/ui_widget';

export interface UIJASFrame {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface UIJASAnimation {
  name: string;
  frames: Array<UIJASFrame>;
  frameDuration: number;
};

/**
 * A UI widget displaying a sprite with animations.
 * It emit 'E_FINISHED'
 */
export class UISprite extends UIWidget {
  animations: Array<UIJASAnimation>;
  currentAnimation: UIJASAnimation | null;
  currentAnimationFrameIndex: number;
  looped: boolean;
  timeElapsed: number;
  finished: boolean;
  frameChanged: boolean;

  /**
   * @param options - Contains only class name.
   */
  constructor(options: { className?: string } = {}) {
    super({
      className: options.className ?? 'UISprite'
    });

    this.animations = [];
    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.looped = false;
    this.timeElapsed = 0;
    this.finished = false;
    this.frameChanged = false;
  }

  /**
   * Load asynchronously an image file.
   * 
   * @param {string} imageFile - The file path.
   */
  async loadTexture(imageFile: string): Promise<void> {
    return new Promise(resolve => {
      const img = new Image();
      img.src = imageFile;
      img.onload = () => {
        this.node.style.backgroundImage = 'url("' + img.src + '")';
        resolve();
      };
    });
  }

  /**
   * Load asynchronously sprite data from a json file (jas).
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
    this.animations = [];
    for (const obj of data['Animations']) {
      const animation: UIJASAnimation = { name: obj['Name'], frames: [], frameDuration: Number(obj['FrameDuration']) };
      for (const objFrame of obj['Frames']) {
        animation.frames.push({
          x: objFrame['X'],
          y: objFrame['Y'],
          width: objFrame['Width'],
          height: objFrame['Height']
        });
      }

      this.animations.push(animation);
    }

    this.currentAnimation = null;
    this.currentAnimationFrameIndex = 0;
    this.timeElapsed = 0;
    this.finished = false;
    this.frameChanged = false;
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

    if (this.frameChanged) {
      const currentFrame = this.currentAnimation.frames[this.currentAnimationFrameIndex];
      this.node.style.backgroundPositionX = -currentFrame.x + 'px';
      this.node.style.backgroundPositionY = -currentFrame.y + 'px';
      this.node.style.width = currentFrame.width + 'px';
      this.node.style.height = currentFrame.height + 'px';
      this.frameChanged = false;
    }

    if (this.timeElapsed >= this.currentAnimation.frameDuration) {
      if (this.currentAnimationFrameIndex == this.currentAnimation.frames.length - 1) {
        eventManager.emit(this, 'E_FINISHED');
        this.currentAnimationFrameIndex = this.looped ? 0 : this.currentAnimation.frames.length - 1;
        this.timeElapsed = 0;
        this.finished = this.looped ? false : true;
        this.frameChanged = true;
      }
      else {
        this.currentAnimationFrameIndex = this.currentAnimationFrameIndex + 1;
        this.timeElapsed = 0;
        this.frameChanged = true;
      }
    }
    else {
      this.timeElapsed += ts;
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
      throw new Error('UISprite::play: animation not found.');
    }

    this.currentAnimation = animation;
    this.currentAnimationFrameIndex = 0;
    this.looped = looped;
    this.timeElapsed = 0;
    this.finished = false;
    this.frameChanged = true;
  }

  /**
   * Returns the list of animation descriptors.
   */
  getAnimations(): Array<UIJASAnimation> {
    return this.animations;
  }

  /**
   * Set the animations descriptors.
   * 
   * @param animations - The animations data.
   */
  setAnimations(animations: Array<UIJASAnimation>): void {
    this.animations = animations;
  }

  /**
   * Returns the current animation or null if there is no current animation.
   */
  getCurrentAnimation(): UIJASAnimation | null {
    return this.currentAnimation;
  }

  /**
   * Returns the current animation frame index.
   */
  getCurrentAnimationFrameIndex(): number {
    return this.currentAnimationFrameIndex;
  }

  /**
   * Returns the finish state.
   */
  isFinished(): boolean {
    return this.finished;
  }
}