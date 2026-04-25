import { UT } from '../core/utils';

enum Gfx3Axis {
  FORWARD = 'FORWARD',
  BACKWARD = 'BACKWARD',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  UP = 'UP',
  DOWN = 'DOWN'
};

/**
 * A transformable object with position, rotation, scale and more.
 */
export class Gfx3Transformable {
  position: vec3;
  rotation: vec3;
  scale: vec3;
  lookTarget: vec3 | null;
  lookUp: vec3;
  transformMatrix: mat4;
  useTransformMatrix: boolean;

  constructor() {
    this.position = [0.0, 0.0, 0.0];
    this.rotation = [0.0, 0.0, 0.0];
    this.scale = [1.0, 1.0, 1.0];
    this.lookTarget = null;
    this.lookUp = [0, 1, 0];
    this.transformMatrix = UT.MAT4_IDENTITY();
    this.useTransformMatrix = false;
  }

  /**
   * Returns the position.
   */
  getPosition(): vec3 {
    return this.position;
  }

  /**
   * Returns the x-coordinate of the position.
   */
  getPositionX(): number {
    return this.position[0];
  }

  /**
   * Returns the y-coordinate of the position.
   */
  getPositionY(): number {
    return this.position[1];
  }

  /**
   * Returns the z-coordinate of the position.
   */
  getPositionZ(): number {
    return this.position[2];
  }

 /**
   * Set the position with the given x, y and z coordinates.
   * 
   * @param {number} x - The X coordinate of the position.
   * @param {number} y - The Y coordinate of the position.
   * @param {number} z - The Z coordinate of the position.
   */
  setPosition(x: number, y: number, z: number): void {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
  }

  setPositionX(x: number) {
    this.position[0] = x;
  }

  setPositionY(y: number) {
    this.position[1] = y;
  }

  setPositionZ(z: number) {
    this.position[2] = z;
  }

  /**
   * Translate the position.
   * 
   * @param {number} x - The amount of translation in the x-axis direction.
   * @param {number} y - The amount of translation in the y-axis direction.
   * @param {number} z - The amount of translation in the z-axis direction.
   */
  translate(x: number, y: number, z: number): void {
    this.position[0] += x;
    this.position[1] += y;
    this.position[2] += z;
  }

  /**
   * Returns the euler rotation in radians.
   */
  getRotation(): vec3 {
    return this.rotation;
  }

  /**
   * Returns the euler rotation on x-axis in radians.
   */
  getRotationX(): number {
    return this.rotation[0];
  }

  /**
   * Returns the euler rotation on y-axis in radians.
   */
  getRotationY(): number {
    return this.rotation[1];
  }

  /**
   * Returns the euler rotation on z-axis in radians.
   */
  getRotationZ(): number {
    return this.rotation[2];
  }

  /**
   * Set euler rotation angles in radians.
   * 
   * @param {number} x - The rotation angle on x-axis in radians.
   * @param {number} y - The rotation angle on y-axis in radians.
   * @param {number} z - The rotation angle on z-axis in radians.
   */
  setRotation(x: number, y: number, z: number): void {
    this.rotation[0] = x;
    this.rotation[1] = y;
    this.rotation[2] = z;
    this.lookTarget = null;
  }

  setRotationX(x: number) {
    this.rotation[0] = x;
    this.lookTarget = null;
  }

  setRotationY(y: number) {
    this.rotation[1] = y;
    this.lookTarget = null;
  }

  setRotationZ(z: number) {
    this.rotation[2] = z;
    this.lookTarget = null;
  }

  /**
   * Add euler rotation values in radians.
   * 
   * @param {number} x - The rotation angle on x-axis in radians.
   * @param {number} y - The rotation angle on y-axis in radians.
   * @param {number} z - The rotation angle on z-axis in radians.
   */
  rotate(x: number, y: number, z: number): void {
    this.rotation[0] += x;
    this.rotation[1] += y;
    this.rotation[2] += z;
    this.lookTarget = null;
  }

  /**
   * Returns the scale.
   */
  getScale(): vec3 {
    return this.scale;
  }

  /**
   * Returns the scale factor on x-axis.
   */
  getScaleX(): number {
    return this.scale[0];
  }

  /**
   * Returns the scale factor on y-axis.
   */
  getScaleY(): number {
    return this.scale[1];
  }

  /**
   * Returns the scale factor on z-axis.
   */
  getScaleZ(): number {
    return this.scale[2];
  }

  /**
   * Set the scale with the given x, y and z factors.
   * 
   * @param {number} x - The x factor in the x-axis direction.
   * @param {number} y - The y factor in the y-axis direction.
   * @param {number} z - The z factor in the z-axis direction.
   */
  setScale(x: number, y: number, z: number): void {
    this.scale[0] = x;
    this.scale[1] = y;
    this.scale[2] = z;
  }

  /**
   * Set the scale on x-axis.
   * 
   * @param {number} x - The x factor in the x-axis direction.
   */
  setScaleX(x: number) {
    this.scale[0] = x;
  }

  /**
   * Set the scale on y-axis.
   * 
   * @param {number} y - The y factor in the y-axis direction.
   */
  setScaleY(y: number) {
    this.scale[1] = y;
  }

  /**
   * Set the scale on z-axis.
   * 
   * @param {number} z - The z factor in the z-axis direction.
   */
  setScaleZ(z: number) {
    this.scale[2] = z;
  }

  /**
   * Add scale values.
   * 
   * @param {number} x - The x factor in the x-axis direction.
   * @param {number} y - The y factor in the y-axis direction.
   * @param {number} z - The z factor in the z-axis direction.
   */
  zoom(x: number, y: number, z: number): void {
    this.scale[0] += x;
    this.scale[1] += y;
    this.scale[2] += z;
  }

  /**
   * Returns the transformation matrix from position, rotation, scale and quaternion values.
   */
  getTransformMatrix(): mat4 {
    if (this.useTransformMatrix) {
      return this.transformMatrix;
    }

    if (this.lookTarget) {
      UT.MAT4_LOOKAT(this.position, this.lookTarget, this.lookUp, this.transformMatrix);
      UT.MAT4_MULTIPLY(this.transformMatrix, UT.MAT4_SCALE(this.scale[0], this.scale[1], this.scale[2]), this.transformMatrix);  
    }
    else {
      UT.MAT4_TRANSFORM(this.position, this.rotation, this.scale, this.transformMatrix);
    }

    return this.transformMatrix;
  }

  /**
   * Set the transformation matrix.
   * 
   * @param {mat4 | null} matrix - The transformation matrix.
   */
  enableManualTransform(matrix: mat4): void {
    this.transformMatrix = matrix;
    this.useTransformMatrix = true;
  }

  /**
   * Disable the manual transformation matrix.
   */
  disableManualTransform(): void {
    this.useTransformMatrix = false;
  }

  /**
   * Rotate to look at the specified coordinates.
   * Note: Avoid euler rotation and quaternion rotation.
   * 
   * @param {number} x - The x-coordinate of the target position that the transformable should look at.
   * @param {number} y - The y-coordinate of the target position that the transformable should look at.
   * @param {number} z - The z-coordinate of the target position that the transformable should look at.
   */
  lookAt(x: number, y: number, z:number, up: vec3 = [0, 1, 0]): void {
    this.lookTarget = [x, y, z];
    this.lookUp = up;
  }

  /**
   * Returns three local axies of the transformable.
   */
  getAxies(): Array<vec3> {
    const matrix = this.getTransformMatrix();
    return [
      [matrix[0], matrix[1], matrix[2]],
      [matrix[4], matrix[5], matrix[6]],
      [matrix[8], matrix[9], matrix[10]]
    ];
  }

  /**
   * Returns three local axies of the transformable.
   */
  getNormalizedAxies(): Array<vec3> {
    const matrix = this.getTransformMatrix();
    return [
      UT.VEC3_NORMALIZE([matrix[0], matrix[1], matrix[2]]),
      UT.VEC3_NORMALIZE([matrix[4], matrix[5], matrix[6]]),
      UT.VEC3_NORMALIZE([matrix[8], matrix[9], matrix[10]])
    ];
  }

  /**
   * Returns the specified local axis of the transformable.
   */
  getAxis(axis: Gfx3Axis): vec3 {
    const axies = this.getAxies();

    if (axis == Gfx3Axis.FORWARD) {
      return [-axies[2][0], -axies[2][1], -axies[2][2]];
    }
    else if (axis == Gfx3Axis.BACKWARD) {
      return [axies[2][0], axies[2][1], axies[2][2]];
    }
    else if (axis == Gfx3Axis.LEFT) {
      return [-axies[0][0], -axies[0][1], -axies[0][2]];
    }
    else if (axis == Gfx3Axis.RIGHT) {
      return [axies[0][0], axies[0][1], axies[0][2]];
    }
    else if (axis == Gfx3Axis.UP) {
      return [axies[1][0], axies[1][1], axies[1][2]];
    }
    else {
      return [-axies[1][0], -axies[1][1], -axies[1][2]];
    }
  }

  /**
   * Clone the object.
   * 
   * @param {Gfx3Transformable} transformable - The copy object.
   */
  clone(transformable: Gfx3Transformable = new Gfx3Transformable()): Gfx3Transformable {
    transformable.position = [this.position[0], this.position[1], this.position[2]];
    transformable.rotation = [this.rotation[0], this.rotation[1], this.rotation[2]];
    transformable.scale = [this.scale[0], this.scale[1], this.scale[2]];
    transformable.lookTarget = this.lookTarget ? [this.lookTarget[0], this.lookTarget[1], this.lookTarget[2]] : null;
    transformable.lookUp = [this.lookUp[0], this.lookUp[1], this.lookUp[2]];
    transformable.transformMatrix = UT.MAT4_COPY(this.transformMatrix, transformable.transformMatrix);
    transformable.useTransformMatrix = this.useTransformMatrix;
    return transformable;
  }
}