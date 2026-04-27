import { inputManager } from '../input/input_manager';
import { eventManager } from '../core/event_manager';
import { Gfx3Camera } from './gfx3_camera';
import { UT } from '../core/utils';

/**
 * A 3D camera orbiting around a target.
 */
export class Gfx3CameraOrbit extends Gfx3Camera {
  rotationSpeed: number;
  frictionCoefficient: number;
  maxPitch: number;
  minPitch: number;
  target: vec3;
  distance: number;
  zoomSpeed: number;
  velocityPhi: number;
  velocityTheta: number;
  phi: number;
  theta: number;
  lastDragTimestamp: number;
  // ----------------------------------------------
  modeCardinal: boolean;
  phiTarget: number;
  phiOrigin: number;
  thetaTarget: number;
  transitionSpeed: number;
  targetPitch: number;
  targetRoll: number;

  /**
   * @param {number} viewIndex - The view you want to bind the camera.
   */
  constructor(viewIndex: number) {
    super(viewIndex);
    this.rotationSpeed = 2;
    this.frictionCoefficient = 0.99;
    this.maxPitch = Math.PI * 0.5 - 0.01;
    this.minPitch = Math.PI * -0.5 + 0.01;
    this.target = [0, 0, 0];
    this.distance = 10;
    this.zoomSpeed = 0.1;
    this.velocityPhi = 0;
    this.velocityTheta = 0;
    this.phi = Math.PI * 0.5;
    this.theta = 0;
    this.lastDragTimestamp = 0;
    // cardinal ----------------------------------------------
    this.modeCardinal = false;
    this.phiTarget = Math.PI * 0.5;
    this.phiOrigin = Math.PI * 0.5;
    this.thetaTarget = this.theta;
    this.transitionSpeed = 0.12;
    this.targetPitch = 0;
    this.targetRoll = 0;

    eventManager.subscribe(inputManager, 'E_MOUSE_WHEEL', this, this.#handleMouseWheel);
    eventManager.subscribe(inputManager, 'E_MOUSE_UP', this, this.#handleMouseUp);
    eventManager.subscribe(inputManager, 'E_MOUSE_DOWN', this, this.#handleMouseDown);
    eventManager.subscribe(inputManager, 'E_MOUSE_DRAG', this, this.#handleMouseDrag);
  }

  /**
   * Free all resources.
   * Warning: You need to call this method to free allocation for this object.
   */
  delete(): void {
    eventManager.unsubscribe(inputManager, 'E_MOUSE_WHEEL', this);
    eventManager.unsubscribe(inputManager, 'E_MOUSE_UP', this);
    eventManager.unsubscribe(inputManager, 'E_MOUSE_DOWN', this);
    eventManager.unsubscribe(inputManager, 'E_MOUSE_DRAG', this);
  }

  /**
   * The update function.
   * 
   * @param {number} ts - The timestep.
   */
  update(ts: number): void {
    if (this.modeCardinal) {
      this.phi = UT.LERP(this.phi, this.phiTarget, this.transitionSpeed);
      this.theta = UT.LERP(this.theta, this.thetaTarget, this.transitionSpeed);
    }

    const pos = UT.VEC3_ROTATE_AROUND(this.target, this.distance, this.phi, this.theta);

    if (this.modeCardinal) {
      this.#applyTargetRotation(pos, this.targetPitch, this.targetRoll);
    }
    
    this.setPosition(pos[0], pos[1], pos[2]);
    this.lookAt(this.target[0], this.target[1], this.target[2]);

    if (!this.modeCardinal && !inputManager.isMouseDown()) {
      this.velocityTheta *= Math.pow(1 - this.frictionCoefficient, ts / 1000);
      this.velocityPhi *= Math.pow(1 - this.frictionCoefficient, ts / 1000);
      this.theta -= this.velocityTheta;
      this.phi -= this.velocityPhi;
    }
  }

  /**
   * Set the rotation speed.
   * 
   * @param {number} rotationSpeed - The speed.
   */
  setRotationSpeed(rotationSpeed: number): void {
    this.rotationSpeed = rotationSpeed;
  }

  /**
   * Set the friction coefficient.
   * High value for strong friction.
   * 
   * @param {number} frictionCoefficient - The friction coef.
   */
  setFrictionCoefficient(frictionCoefficient: number): void {
    this.frictionCoefficient = frictionCoefficient;
  }

  /**
   * Set the max rotation angle on x-axis.
   * 
   * @param {number} maxPitch - The max pitch angle.
   */
  setMaxPitch(maxPitch: number): void {
    this.maxPitch = maxPitch;
  }

  /**
   * Set the min rotation angle on x-axis.
   * 
   * @param {number} minPitch - The min pitch angle.
   */
  setMinPitch(minPitch: number): void {
    this.minPitch = minPitch;
  }

  /**
   * Set the target position you want looking for.
   * 
   * @param {vec3} target - The target position.
   */
  setTarget(target: vec3): void {
    this.target = target;
  }

  /**
   * Set the distance between target and camera.
   * 
   * @param {number} distance - The distance.
   */
  setDistance(distance: number): void {
    this.distance = distance;
  }

  /**
   * Set the zoom speed.
   * 
   * @param {number} zoomSpeed - The zoom speed.
   */
  setZoomSpeed(zoomSpeed: number): void {
    this.zoomSpeed = this.zoomSpeed;
  }

  /**
   * Returns the rotation speed.
   */
  getRotationSpeed(): number {
    return this.rotationSpeed;
  }

  /**
   * Returns the friction coefficient.
   */
  getFrictionCoefficient(): number {
    return this.frictionCoefficient;
  }

  /**
   * Returns the max rotation angle on x-axis.
   */
  getMaxPitch(): number {
    return this.maxPitch;
  }

  /**
   * Returns the min rotation angle on x-axis.
   */
  getMinPitch(): number {
    return this.minPitch;
  }

  /**
   * Returns the target position.
   */
  getTarget(): vec3 {
    return this.target;
  }

  /**
   * Returns the distance between target and camera.
   */
  getDistance(): number {
    return this.distance;
  }

  /**
   * Returns the zoom speed.
   */
  getZoomSpeed(): number {
    return this.zoomSpeed;
  }

  /**
   * Returns the theta angle (vertical).
   */
  getTheta(): number {
    return this.theta;
  }

  /**
   * Returns the phi angle (horizontal).
   */
  getPhi(): number {
    return this.phi;
  }

  /**
   * Look the left side of the target relative to the camera.
   */
  lookLeft() {
    this.phiTarget = this.phiOrigin + Math.PI * 0.5;
    this.modeCardinal = true;
  }

  /**
   * Look the right side of the target relative to the camera.
   */
  lookRight() {
    this.phiTarget = this.phiOrigin - Math.PI * 0.5;
    this.modeCardinal = true;
  }

  /**
   * Look the back side of the target relative to the camera.
   */
  lookBack() {
    this.phiTarget = this.phiOrigin + Math.PI;
    this.modeCardinal = true;
  }

  /**
   * Look the front side of the target relative to the camera.
   */
  lookFront() {
    this.phiTarget = this.phiOrigin;
    this.modeCardinal = true;
  }

  /**
   * Disables cardinal constraints to allow free camera movement.
   */
  lookFree() {
    this.modeCardinal = false;
  }

  /**
   * Set the origin reference horizontal angle (phi) and snap the camera to it.
   * This resets the origin, current angle, and target angle simultaneously.
   */
  setPhiOrigin(phiOrigin: number): void {
    this.phiOrigin = phiOrigin;
    this.phi = phiOrigin;
    this.phiTarget = phiOrigin;
  }

  /**
   * Set the vertical angle (theta) between minPitch and maxPitch.
   * The camera will smoothly transition toward this tilt value.
   */
  setTheta(theta: number): void {
    this.thetaTarget = UT.CLAMP(theta, this.minPitch, this.maxPitch);
  }

  /**
   * Adjust the interpolation speed for camera transitions.
   * Higher values result in faster, more reactive camera movements.
   */
  setTransitionSpeed(transitionSpeed: number): void {
    this.transitionSpeed = transitionSpeed;
  }

  /**
   * Set the target pitch (longitudinal tilt) for the camera's orbital plane.
   * This aligns the camera's vertical axis with the front-to-back inclination of the vehicle.
   * 
   * @param targetPitch - The tilt angle in radians.
   */
  setTargetPitch(targetPitch: number): void {
    this.targetPitch = targetPitch;
  }

  /**
   * Set the target roll (lateral inclination) for the camera's orbital plane.
   * This ensures the camera's horizontal orbit stays synchronized with the vehicle's side-to-side tilt.
   * 
   * @param targetRoll - The roll angle in radians.
   */
  setTargetRoll(targetRoll: number): void {
    this.targetRoll = targetRoll;
  }

  #applyTargetRotation(position: vec3, pitch: number, roll: number): void {
    // Rotate X (Assiette / Pitch)
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const y1 = position[1] * cosP - position[2] * sinP;
    const z1 = position[1] * sinP + position[2] * cosP;

    // Rotate Z (Roulis / Roll)
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);
    const x2 = position[0] * cosR - y1 * sinR;
    const y2 = position[0] * sinR + y1 * cosR;

    // Update position
    position[0] = x2;
    position[1] = y2;
    position[2] = z1;
  }

  #handleMouseUp(): void {
    if (this.modeCardinal) {
      return;
    }

    const delta = Date.now()  - this.lastDragTimestamp;
    if (delta >= 100) {
      this.velocityTheta = 0;
      this.velocityPhi = 0;
    }
  }

  #handleMouseDown(): void {
    if (this.modeCardinal) {
      return;
    }

    this.velocityPhi = 0;
    this.velocityTheta = 0;
  }

  #handleMouseDrag(data: any): void {
    if (this.modeCardinal) {
      return;
    }

    this.velocityTheta = data.movementY * this.rotationSpeed / 1000;
    this.velocityPhi = data.movementX * this.rotationSpeed / 1000;

    this.theta -= this.velocityTheta;
    this.phi -= this.velocityPhi;
    this.theta = UT.CLAMP(this.theta, this.minPitch, this.maxPitch);
    this.lastDragTimestamp = Date.now();
  }

  #handleMouseWheel(data: any): void {
    this.distance *= 1 + data.delta * this.zoomSpeed;
  }
}