import { gfx3TrailRenderer } from './gfx3_trail_renderer';
import { gfx3Manager } from '../gfx3/gfx3_manager';
import { UT } from '../core/utils';
import { Gfx3Drawable } from '../gfx3/gfx3_drawable';
import { Gfx3Texture } from '../gfx3/gfx3_texture';
import { Gfx3StaticGroup } from '../gfx3/gfx3_group';
import { SHADER_VERTEX_ATTR_COUNT } from './gfx3_trail_shader';

class TrailPoint {
  position: vec3;
  age: number;
  lifetime: number;

  constructor(position: vec3, lifetime: number) {
    this.position = [position[0], position[1], position[2]];
    this.age = 0;
    this.lifetime = lifetime;
  }
}

interface Gfx3TrailOptions {
  texture: Gfx3Texture;
  maxPoints: number;
  width: number;
  color: vec3;
  opacity: number;
  defaultPointLifetime: number;
};

/**
 * A 3D ribbon trail.
 * Add points each frame to create a trail effect.
 */
class Gfx3Trail extends Gfx3Drawable {
  maxPoints: number;
  width: number;
  color: vec3;
  opacity: number;
  defaultPointLifetime: number;
  points: Array<TrailPoint>;
  grp2: Gfx3StaticGroup;
  texture: Gfx3Texture;
  textureChanged: boolean;

  /**
   * @param options - Options to configure the trail.
   */
  constructor(options: Partial<Gfx3TrailOptions> = {}) {
    super(SHADER_VERTEX_ATTR_COUNT);
    this.maxPoints = options.maxPoints ?? 32;
    this.width = options.width ?? 1.0;
    this.color = options.color ?? [1, 1, 1];
    this.opacity = options.opacity ?? 1.0;
    this.defaultPointLifetime = options.defaultPointLifetime ?? 1.0;
    this.points = [];
    this.textureChanged = false;

    this.grp2 = gfx3Manager.createStaticGroup('TRAIL_PIPELINE', 2);
    this.texture = this.grp2.setTexture(0, 'TEXTURE', options.texture ?? gfx3Manager.createTextureFromBitmap());
    this.texture = this.grp2.setSampler(1, 'SAMPLER', this.texture);
    this.grp2.allocate();
  }

  /**
   * Free all resources.
   * Warning: You need to call this method to free allocation for this object.
   */
  delete(): void {
    this.grp2.delete();
    super.delete();
  }

  /**
   * The update function. Ages existing points and rebuilds geometry.
   *
   * @param {number} ts - The timestep in milliseconds.
   */
  update(ts: number): void {
    const dt = ts / 1000.0;

    for (let i = this.points.length - 1; i >= 0; i--) {
      this.points[i].age += dt;
      if (this.points[i].age >= this.points[i].lifetime) {
        this.points.splice(i, 1);
      }
    }

    this.#updateGeometry();
  }

  /**
   * The draw function.
   */
  draw(): void {
    gfx3TrailRenderer.drawTrail(this);
  }

  /**
   * Add a new point at the head of the trail.
   *
   * @param {vec3} position - The world-space position.
   * @param {number} [lifetime] - How long (in seconds) the point lives before disappearing.
   */
  addPoint(position: vec3, lifetime?: number): void {
    this.points.unshift(new TrailPoint(position, lifetime ?? this.defaultPointLifetime));
    if (this.points.length > this.maxPoints) {
      this.points.pop();
    }
  }

  /**
   * Set the trail texture.
   *
   * @param {Gfx3Texture} texture - The new texture.
   */
  setTexture(texture: Gfx3Texture): void {
    this.texture = texture;
    this.textureChanged = true;
  }

  /**
   * Set the ribbon width.
   *
   * @param {number} width - The width in world units.
   */
  setWidth(width: number): void {
    this.width = width;
  }

  /**
   * Set the base color of the trail.
   *
   * @param {vec3} color - The RGB color (0..1).
   */
  setColor(color: vec3): void {
    this.color = color;
  }

  /**
   * Set the base opacity.
   *
   * @param {number} opacity - The opacity (0..1).
   */
  setOpacity(opacity: number): void {
    this.opacity = opacity;
  }

  /**
   * Returns the bind group (2) containing the texture.
   */
  getGroup02(): Gfx3StaticGroup {
    if (this.textureChanged) {
      this.grp2.setTexture(0, 'TEXTURE', this.texture);
      this.grp2.allocate();
      this.textureChanged = false;
    }

    return this.grp2;
  }

  #updateGeometry(): void {
    const count = this.points.length;

    if (count < 2) {
      this.beginVertices(0);
      this.endVertices();
      return;
    }

    const currentView = gfx3Manager.getCurrentView();
    const camPos: vec3 = currentView.getCameraPosition();

    // Pre-compute a side vector PER POINT using the averaged direction (prev→next).
    // This guarantees that the end-edge of segment i and the start-edge of segment i+1
    // use the EXACT same world positions → no gaps / breaks at joints.
    const sides: Array<vec3> = new Array(count);
    for (let i = 0; i < count; i++) {
      const prev = this.points[i > 0 ? i - 1 : i];
      const next = this.points[i < count - 1 ? i + 1 : i];
      const dir: vec3 = UT.VEC3_NORMALIZE(UT.VEC3_SUBSTRACT(next.position, prev.position));
      const toCamera: vec3 = UT.VEC3_NORMALIZE(UT.VEC3_SUBSTRACT(camPos, this.points[i].position));
      let side: vec3 = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(dir, toCamera));
      if (UT.VEC3_LENGTH(side) < 0.001) {
        side = UT.VEC3_NORMALIZE(UT.VEC3_CROSS(dir, [0, 1, 0]));
      }
      sides[i] = side;
    }

    const segmentCount = count - 1;
    this.beginVertices(segmentCount * 6);

    for (let i = 0; i < segmentCount; i++) {
      const p0 = this.points[i];
      const p1 = this.points[i + 1];
      const side0 = sides[i];
      const side1 = sides[i + 1];

      const half = this.width * 0.5;
      const a0L: vec3 = [p0.position[0] - side0[0] * half, p0.position[1] - side0[1] * half, p0.position[2] - side0[2] * half];
      const a0R: vec3 = [p0.position[0] + side0[0] * half, p0.position[1] + side0[1] * half, p0.position[2] + side0[2] * half];
      const a1L: vec3 = [p1.position[0] - side1[0] * half, p1.position[1] - side1[1] * half, p1.position[2] - side1[2] * half];
      const a1R: vec3 = [p1.position[0] + side1[0] * half, p1.position[1] + side1[1] * half, p1.position[2] + side1[2] * half];

      const u0 = i / segmentCount;
      const u1 = (i + 1) / segmentCount;
      const op0 = this.opacity * (1.0 - p0.age / p0.lifetime);
      const op1 = this.opacity * (1.0 - p1.age / p1.lifetime);
      const c = this.color;

      // Tri 1
      this.defineVertex(a0L[0], a0L[1], a0L[2], u0, 0, c[0], c[1], c[2], op0);
      this.defineVertex(a1L[0], a1L[1], a1L[2], u1, 0, c[0], c[1], c[2], op1);
      this.defineVertex(a0R[0], a0R[1], a0R[2], u0, 1, c[0], c[1], c[2], op0);
      
      // Tri 2
      this.defineVertex(a1L[0], a1L[1], a1L[2], u1, 0, c[0], c[1], c[2], op1);
      this.defineVertex(a1R[0], a1R[1], a1R[2], u1, 1, c[0], c[1], c[2], op1);
      this.defineVertex(a0R[0], a0R[1], a0R[2], u0, 1, c[0], c[1], c[2], op0);
    }

    this.endVertices();
  }
}

export type { Gfx3TrailOptions };
export { Gfx3Trail };

