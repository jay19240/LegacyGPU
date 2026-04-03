import { gfx3Manager } from '../gfx3/gfx3_manager';
import { Quaternion } from '../core/quaternion';
import { Gfx3View, Gfx3ProjectionMode } from '../gfx3/gfx3_view';
import { Gfx3Transformable } from '../gfx3/gfx3_transformable';

/**
 * A 3D camera object.
 */
class Gfx3Camera extends Gfx3Transformable {
  view: Gfx3View;
  clipOffset: vec2;
  minClipOffset: vec2;
  maxClipOffset: vec2;
  projectionMode: Gfx3ProjectionMode;
  perspectiveFovy: number;
  perspectiveNear: number;
  perspectiveFar: number;
  orthographicSize: number;
  orthographicDepth: number;

  /**
   * @param {number} viewIndex - The view you want to bind the camera.
   */
  constructor(viewIndex: number) {
    super();
    this.view = gfx3Manager.getView(viewIndex);
    this.clipOffset = this.view.getClipOffset();
    this.minClipOffset = this.view.getMinClipOffset();
    this.maxClipOffset = this.view.getMaxClipOffset();
    this.projectionMode = this.view.getProjectionMode();
    this.perspectiveFovy = this.view.getPerspectiveFovy();
    this.perspectiveNear = this.view.getPerspectiveNear();
    this.perspectiveFar = this.view.getPerspectiveFar();
    this.orthographicSize = this.view.getOrthographicSize();
    this.orthographicDepth = this.view.getOrthographicDepth();
  }

  /**
   * Load asynchronously camera data from a json file (jcm).
   */
  async loadFromFile(path: string): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'CAM') {
      throw new Error('Gfx3Camera::loadFromFile(): File not valid !');
    }

    if (json['ClipOffsetX']) {
      this.setClipOffsetX(json['ClipOffsetX']);
    }
    if (json['ClipOffsetY']) {
      this.setClipOffsetY(json['ClipOffsetY']);
    }
    if (json['MinClipOffsetX']) {
      this.setMinClipOffsetX(json['MinClipOffsetX']);
    }
    if (json['MinClipOffsetY']) {
      this.setMinClipOffsetY(json['MinClipOffsetY']);
    }
    if (json['MaxClipOffsetX']) {
      this.setMaxClipOffsetX(json['MaxClipOffsetX']);
    }
    if (json['MaxClipOffsetY']) {
      this.setMaxClipOffsetY(json['MaxClipOffsetY']);
    }

    if (json['ProjectionMode'] == 'PERSPECTIVE') {
      this.setProjectionMode(Gfx3ProjectionMode.PERSPECTIVE);
    }
    else if (json['ProjectionMode'] == 'ORTHOGRAPHIC') {
      this.setProjectionMode(Gfx3ProjectionMode.ORTHOGRAPHIC);
    }

    if (json['PositionX']) {
      this.setPositionX(json['PositionX']);
    }
    if (json['PositionY']) {
      this.setPositionY(json['PositionY']);
    }
    if (json['PositionZ']) {
      this.setPositionZ(json['PositionZ']);
    }

    if (json['RotationX']) {
      this.setRotationX(json['RotationX']);
    }
    if (json['RotationY']) {
      this.setRotationY(json['RotationY']);
    }
    if (json['RotationZ']) {
      this.setRotationZ(json['RotationZ']);
    }

    if (json['ScaleX']) {
      this.setScaleX(json['ScaleX']);
    }
    if (json['ScaleY']) {
      this.setScaleY(json['ScaleY']);
    }
    if (json['ScaleZ']) {
      this.setScaleZ(json['ScaleZ']);
    }

    if (json['PerspectiveFovy']) {
      this.setPerspectiveFovy(json['PerspectiveFovy']);
    }
    if (json['PerspectiveNear']) {
      this.setPerspectiveNear(json['PerspectiveNear']);
    }
    if (json['PerspectiveFar']) {
      this.setPerspectiveFar(json['PerspectiveFar']);
    }

    if (json['OrthographicSize']) {
      this.setOrthographicSize(json['OrthographicSize']);
    }

    if (json['OrthographicDepth']) {
      this.setOrthographicDepth(json['OrthographicDepth']);
    }

    if (json['CameraMatrix']) {
      this.view.setCameraMatrix(json['CameraMatrix']);
    }
  }

  /**
   * Returns the clip offset.
   */
  getClipOffset(): vec2 {
    return this.clipOffset;
  }

  /**
   * Set the clip offset with the given x coordinates.
   * 
   * @param {number} x - The X coordinate of the clip offset.
   */
  setClipOffsetX(x: number): void {
    this.clipOffset[0] = x;
    this.view.setClipOffsetX(this.clipOffset[0]);
  }

  /**
   * Set the clip offset with the given y coordinates.
   * 
   * @param {number} y - The Y coordinate of the clip offset.
   */
  setClipOffsetY(y: number): void {
    this.clipOffset[1] = y;
    this.view.setClipOffsetY(this.clipOffset[1]);
  }

  /**
   * Returns the min clip offset.
   */
  getMinClipOffset(): vec2 {
    return this.minClipOffset;
  }

  /**
   * Set the min clip offset.
   * 
   * @param {number} x - The X coordinate of the min clip offset.
   */
  setMinClipOffsetX(x: number): void {
    this.minClipOffset[0] = x;
    this.view.setMinClipOffsetX(this.minClipOffset[0]);
  }

  /**
   * Set the min clip offset.
   * 
   * @param {number} y - The Y coordinate of the min clip offset.
   */
  setMinClipOffsetY(y: number): void {
    this.minClipOffset[1] = y;
    this.view.setMinClipOffsetY(this.minClipOffset[1]);
  }

  /**
   * Returns the max clip offset.
   */
  getMaxClipOffset(): vec2 {
    return this.maxClipOffset;
  }

  /**
   * Set the max clip offset.
   * 
   * @param {number} x - The X coordinate of the max clip offset.
   */
  setMaxClipOffsetX(x: number): void {
    this.maxClipOffset[0] = x;
    this.view.setMaxClipOffsetX(this.maxClipOffset[0]);
  }

  /**
   * Set the max clip offset.
   * 
   * @param {number} y - The Y coordinate of the max clip offset.
   */
  setMaxClipOffsetY(y: number): void {
    this.maxClipOffset[1] = y;
    this.view.setMaxClipOffsetY(this.maxClipOffset[1]);
  }

  /**
   * Returns the projection mode.
   */
  getProjectionMode(): Gfx3ProjectionMode {
    return this.projectionMode;
  }

  /**
   * Set the projection mode.
   * 
   * @param {Gfx3ProjectionMode} projectionMode - The projection mode.
   */
  setProjectionMode(projectionMode: Gfx3ProjectionMode): void {
    this.projectionMode = projectionMode;
    this.view.setProjectionMode(projectionMode);
  }

  /**
   * Returns the fovy angle (perspective eye-angle).
   */
  getPerspectiveFovy(): number {
    return this.perspectiveFovy;
  }

  /**
   * Set the fovy angle.
   * 
   * @param {number} perspectiveFovy - The fovy angle.
   */
  setPerspectiveFovy(perspectiveFovy: number): void {
    this.perspectiveFovy = perspectiveFovy;
    this.view.setPerspectiveFovy(this.perspectiveFovy);
  }

  /**
   * Returns the near limit.
   */
  getPerspectiveNear(): number {
    return this.perspectiveNear;
  }

  /**
   * Set the near limit.
   * 
   * @param {number} perspectiveNear - The distance to the near clipping plane of a perspective projection.
   */
  setPerspectiveNear(perspectiveNear: number): void {
    this.perspectiveNear = perspectiveNear;
    this.view.setPerspectiveNear(perspectiveNear);
  }

  /**
   * Returns the far limit.
   */
  getPerspectiveFar(): number {
    return this.perspectiveFar;
  }

  /**
   * Set the far limit.
   * 
   * @param {number} perspectiveFar - The maximum distance from the camera at which objects will be rendered.
   */
  setPerspectiveFar(perspectiveFar: number): void {
    this.perspectiveFar = perspectiveFar;
    this.view.setPerspectiveFar(perspectiveFar);
  }

  /**
   * Returns the orthographic size.
   */
  getOrthographicSize(): number {
    return this.orthographicSize;
  }

  /**
   * Set orthographic size.
   * 
   * @param {number} orthographicSize - Determines how much of the scene is visible within the camera's view frustum.
   */
  setOrthographicSize(orthographicSize: number): void {
    this.orthographicSize = orthographicSize;
    this.view.setOrthographicSize(orthographicSize);
  }

  /**
   * Returns the orthographic depth.
   */
  getOrthographicDepth(): number {
    return this.orthographicDepth;
  }

  /**
   * Set orthographic depth.
   * 
   * @param {number} orthographicDepth - The depth of the orthographic view.
   */
  setOrthographicDepth(orthographicDepth: number): void {
    this.orthographicDepth = orthographicDepth;
    this.view.setOrthographicDepth(orthographicDepth);
  }

  /**
   * Set the position with the given x, y and z coordinates.
   * 
   * @param {number} x - The X coordinate of the position.
   * @param {number} y - The Y coordinate of the position.
   * @param {number} z - The Z coordinate of the position.
   */
  setPosition(x: number, y: number, z: number): void {
    super.setPosition(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the x-coordinate of the position.
   * 
   * @param {number} x - The X coordinate of the position.
   */
  setPositionX(x: number): void {
    super.setPositionX(x);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the y-coordinate of the position.
   * 
   * @param {number} y - The Y coordinate of the position.
   */
  setPositionY(y: number): void {
    super.setPositionY(y);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the z-coordinate of the position.
   * 
   * @param {number} z - The Z coordinate of the position.
   */
  setPositionZ(z: number): void {
    super.setPositionZ(z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Translate the position.
   * 
   * @param {number} x - The amount of translation in the x-axis direction.
   * @param {number} y - The amount of translation in the y-axis direction.
   * @param {number} z - The amount of translation in the z-axis direction.
   */
  translate(x: number, y: number, z: number): void {
    super.translate(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set euler rotation in radians.
   * 
   * @param {number} x - The rotation angle on x-axis in radians.
   * @param {number} y - The rotation angle on y-axis in radians.
   * @param {number} z - The rotation angle on z-axis in radians.
   */
  setRotation(x: number, y: number, z: number): void {
    super.setRotation(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the rotation on x-axis in radians.
   * 
   * @param {number} x - The rotation angle on x-axis in radians.
   */
  setRotationX(x: number): void {
    super.setRotationX(x);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the rotation on y-axis in radians.
   * 
   * @param {number} y - The rotation angle on y-axis in radians.
   */
  setRotationY(y: number): void {
    super.setRotationY(y);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the rotation on z-axis in radians.
   * 
   * @param {number} z - The rotation angle on z-axis in radians.
   */
  setRotationZ(z: number): void {
    super.setRotationZ(z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Add euler rotation in radians.
   * 
   * @param {number} x - The rotation angle on x-axis in radians.
   * @param {number} y - The rotation angle on y-axis in radians.
   * @param {number} z - The rotation angle on z-axis in radians.
   */
  rotate(x: number, y: number, z: number): void {
    super.rotate(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the Quaternion rotation.
   * 
   * @param {vec4} quaternion - The quaternion.
   */
  setQuaternion(quaternion: Quaternion) : void {
    super.setQuaternion(quaternion);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the scale with the given x, y and z factors.
   * 
   * @param {number} x - The x factor in the x-axis direction.
   * @param {number} y - The y factor in the y-axis direction.
   * @param {number} z - The z factor in the z-axis direction.
   */
  setScale(x: number, y: number, z: number): void {
    super.setScale(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the scale on x-axis.
   * 
   * @param {number} x - The x factor in the x-axis direction.
   */
  setScaleX(x: number): void {
    super.setScaleX(x);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the scale on y-axis.
   * 
   * @param {number} y - The y factor in the y-axis direction.
   */
  setScaleY(y: number): void {
    super.setScaleY(y);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Set the scale on z-axis.
   * 
   * @param {number} z - The z factor in the z-axis direction.
   */
  setScaleZ(z: number): void {
    super.setScaleZ(z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Add scale values.
   * 
   * @param {number} x - The x factor in the x-axis direction.
   * @param {number} y - The y factor in the y-axis direction.
   * @param {number} z - The z factor in the z-axis direction.
   */
  zoom(x: number, y: number, z: number): void {
    super.zoom(x, y, z);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Change the view attached to the camera.
   * @param {number} viewIndex - The view index.
   */
  changeView(viewIndex: number): void {
    this.view = gfx3Manager.getView(viewIndex);

    this.view.setClipOffsetX(this.clipOffset[0]);
    this.view.setClipOffsetY(this.clipOffset[1]);
    this.view.setMinClipOffsetX(this.minClipOffset[0]);
    this.view.setMinClipOffsetY(this.minClipOffset[1]);
    this.view.setMaxClipOffsetX(this.maxClipOffset[0]);
    this.view.setMaxClipOffsetY(this.maxClipOffset[1]);

    this.view.setProjectionMode(this.projectionMode);
    this.view.setPerspectiveFovy(this.perspectiveFovy);
    this.view.setPerspectiveNear(this.perspectiveNear);
    this.view.setPerspectiveFar(this.perspectiveFar);
    this.view.setOrthographicSize(this.orthographicSize);
    this.view.setOrthographicDepth(this.orthographicDepth);
    this.view.setCameraMatrix(this.getTransformMatrix());    
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
    super.lookAt(x, y, z, up);
    this.view.setCameraMatrix(this.getTransformMatrix());
  }

  /**
   * Returns the camera matrix.
   */
  getCameraMatrix(): mat4 {
    return this.view.getCameraMatrix();
  }

  /**
   * Returns the view.
   */
  getView(): Gfx3View {
    return this.view;
  }
}

export { Gfx3Camera };