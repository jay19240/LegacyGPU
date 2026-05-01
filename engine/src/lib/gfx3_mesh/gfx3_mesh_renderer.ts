import { gfx3Manager } from '../gfx3/gfx3_manager';
import { em } from '../engine/engine_manager';
import { gfx3MeshShadowRenderer } from './gfx3_mesh_shadow_renderer';
import { gfx3TextureManager } from '../gfx3/gfx3_texture_manager';
import { UT } from '../core/utils';
import { Gfx3RendererAbstract } from '../gfx3/gfx3_renderer_abstract';
import { Gfx3Texture, Gfx3RenderingTexture } from '../gfx3/gfx3_texture';
import { Gfx3StaticGroup } from '../gfx3/gfx3_group';
import { Gfx3Mesh } from './gfx3_mesh';
import { Gfx3SceneInfos, MESH_PIPELINE_DESC, MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER, MESH_MAX_POINT_LIGHTS, MESH_MAX_SPOT_LIGHTS, MESH_MAX_DECALS, MESH_STORAGE_SIZE, MESH_MAT_CUSTOM_PARAMS, MESH_SCENE_CUSTOM_PARAMS, MESH_SHADER_INSERTS } from './gfx3_mesh_shader';

/**
 * Singleton mesh renderer.
 */
export class Gfx3MeshRenderer extends Gfx3RendererAbstract {
  shadowEnabled: boolean;
  meshInstanceCommands: Map<Gfx3Mesh, mat4[]>;
  meshInstanceCount: number;
  mvpcMatrix: Float32Array;
  grp0: Gfx3StaticGroup;
  sceneInfos: Float32Array;
  lvpMatrix: Float32Array;
  dirLight: Float32Array;
  pointLights: Float32Array;
  spotLights: Float32Array;
  decals: Float32Array;
  fog: Float32Array;
  decalAtlas: Gfx3Texture;
  shadowMap: Gfx3Texture;
  grp1: Gfx3StaticGroup;
  meshInstances: Float32Array;

  constructor() {
    super('MESH_PIPELINE', MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER, MESH_PIPELINE_DESC, {
      ...MESH_MAT_CUSTOM_PARAMS,
      ...MESH_SCENE_CUSTOM_PARAMS,
      ...MESH_SHADER_INSERTS
    });

    this.shadowEnabled = false;
    this.meshInstanceCommands = new Map();
    this.meshInstanceCount = 0;
    this.mvpcMatrix = new Float32Array(16);

    this.grp0 = gfx3Manager.createStaticGroup('MESH_PIPELINE', 0);
    this.sceneInfos = this.grp0.setFloat(0, 'SCENE_INFOS', Gfx3SceneInfos.COUNT + 16);
    this.sceneInfos[Gfx3SceneInfos.CAMERA_POS_X] = 0.0;
    this.sceneInfos[Gfx3SceneInfos.CAMERA_POS_Y] = 0.0;
    this.sceneInfos[Gfx3SceneInfos.CAMERA_POS_Z] = 0.0;
    this.sceneInfos[Gfx3SceneInfos.AMBIENT_R] = 0.5;
    this.sceneInfos[Gfx3SceneInfos.AMBIENT_G] = 0.5;
    this.sceneInfos[Gfx3SceneInfos.AMBIENT_B] = 0.5;
    this.sceneInfos[Gfx3SceneInfos.POINT_LIGHT_COUNT] = 0;
    this.sceneInfos[Gfx3SceneInfos.SPOT_LIGHT_COUNT] = 0;
    this.sceneInfos[Gfx3SceneInfos.DECAL_COUNT] = 0;
    this.sceneInfos[Gfx3SceneInfos.DELTA_TIME] = 0;
    this.sceneInfos[Gfx3SceneInfos.TIME] = 0;
    this.lvpMatrix = this.grp0.setFloat(1, 'LVP_MATRIX', 16);
    this.dirLight = this.grp0.setFloat(2, 'DIR_LIGHT', 16);
    this.pointLights = this.grp0.setFloat(3, 'POINT_LIGHTS', 20 * MESH_MAX_POINT_LIGHTS);
    this.spotLights = this.grp0.setFloat(4, 'SPOT_LIGHTS', 24 * MESH_MAX_SPOT_LIGHTS);
    this.decals = this.grp0.setFloat(5, 'DECALS', 24 * MESH_MAX_DECALS);
    this.fog = this.grp0.setFloat(6, 'FOG', 12);
    this.decalAtlas = this.grp0.setTexture(7, 'DECAL_ATLAS_TEXTURE', gfx3Manager.createTextureFromBitmap());
    this.decalAtlas = this.grp0.setSampler(8, 'DECAL_ATLAS_SAMPLER', this.decalAtlas);
    this.shadowMap = this.grp0.setTexture(9, 'SHADOW_MAP_TEXTURE', gfx3MeshShadowRenderer.getDepthTexture());
    this.shadowMap = this.grp0.setSampler(10, 'SHADOW_MAP_SAMPLER', this.shadowMap);

    this.grp1 = gfx3Manager.createStaticGroup('MESH_PIPELINE', 1, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    this.meshInstances = this.grp1.setStorageFloat(0, 'MESHES', MESH_STORAGE_SIZE);

    this.grp0.allocate();
    this.grp1.allocate();
  }

  /**
   * Load asynchronously animated mesh data from a json file (jam).
   * 
   * @param {string} path - The file path.
   */
  async loadFromFile(path: string, textureDir: string = ''): Promise<void> {
    const response = await fetch(path);
    const json = await response.json();

    if (!json.hasOwnProperty('Ident') || json['Ident'] != 'WRD') {
      throw new Error('Gfx3MeshRenderer::loadFromFile(): File not valid !');
    }

    if (json['SunEnabled']) {
      this.setDirLight(
        true,
        [json['SunDirectionX'], json['SunDirectionY'], json['SunDirectionZ']],
        [json['SunDiffuseColorR'], json['SunDiffuseColorG'], json['SunDiffuseColorB']],
        [json['SunSpecularColorR'], json['SunSpecularColorG'], json['SunSpecularColorB']],
        json['SunIntensity'],
        json['SunGroupId']
      );
    }
    else {
      this.setDirLight(false, [0, -1, 0], [0.7, 0.7, 0.7], [1, 1, 1], 1, 0);
    }

    if (json['ShadowEnabled']) {
      this.enableShadow(true);
      gfx3MeshShadowRenderer.setShadowPosition(json['ShadowPositionX'], json['ShadowPositionY'], json['ShadowPositionZ']);
      gfx3MeshShadowRenderer.setShadowTarget(json['ShadowTargetX'], json['ShadowTargetY'], json['ShadowTargetZ']);
      gfx3MeshShadowRenderer.setShadowSize(json['ShadowSize']);
      gfx3MeshShadowRenderer.setShadowDepth(json['ShadowDepth']);
      gfx3MeshShadowRenderer.setDepthTextureSize(json['ShadowTextureSize']);
    }
    else {
      this.enableShadow(false);
    }

    if (json['FogEnabled']) {
      this.enableFog(true);
      this.setFogNear(json['FogNear']);
      this.setFogFar(json['FogFar']);
      this.setFogColor([json['FogColorR'], json['FogColorG'], json['FogColorB']]);
    }
    else {
      this.enableFog(false);
    }

    this.setAmbientColor([json['AmbientR'], json['AmbientG'], json['AmbientB']]);

    if (json['DecalAtlas']) {
      const atlas = await gfx3TextureManager.loadTexture(textureDir + json['DecalAtlas']);
      this.setDecalAtlas(atlas);
    }

    for (const obj of json['CustomParams']) {
      this.setCustomParamValue(obj['Name'], obj['Value']);
    }
  }

  /**
   * The render function.
   */
  render(ts: number, destinationTexture: Gfx3RenderingTexture | null = null): void {
    const currentView = gfx3Manager.getCurrentView();
    const commandEncoder = gfx3Manager.getCommandEncoder();
    const passEncoder = destinationTexture ? commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: destinationTexture.gpuTextureView,
        loadOp: 'clear',
        storeOp: 'store'
      }]
    }) : gfx3Manager.getPassEncoder();

    const viewMatrix = currentView.getCameraViewMatrix();
    const bpcMatrix = currentView.getBillboardProjectionClipMatrix();
    const vpcMatrix = currentView.getViewProjectionClipMatrix();
    const invMatrix = UT.MAT4_INVERT(UT.MAT4_TRANSLATE(viewMatrix[12], viewMatrix[13], viewMatrix[14]));
    const bpciMatrix = UT.MAT4_MULTIPLY(bpcMatrix, invMatrix);
    const vpciMatrix = UT.MAT4_MULTIPLY(vpcMatrix, invMatrix);

    passEncoder.setPipeline(this.pipeline);

    const cameraPos = currentView.getCameraPosition();
    const timeStamp = em.getTimeStamp();

    this.sceneInfos[Gfx3SceneInfos.CAMERA_POS_X] = cameraPos[0];
    this.sceneInfos[Gfx3SceneInfos.CAMERA_POS_Y] = cameraPos[1];
    this.sceneInfos[Gfx3SceneInfos.CAMERA_POS_Z] = cameraPos[2];
    this.sceneInfos[Gfx3SceneInfos.DELTA_TIME] = ts;
    this.sceneInfos[Gfx3SceneInfos.TIME] = timeStamp;

    this.grp0.beginWrite();
    this.grp0.write(0, this.sceneInfos);
    this.grp0.write(1, gfx3MeshShadowRenderer.getLVPMatrix());
    this.grp0.write(2, this.dirLight);
    this.grp0.write(3, this.pointLights);
    this.grp0.write(4, this.spotLights);
    this.grp0.write(5, this.decals);
    this.grp0.write(6, this.fog);
    this.grp0.endWrite();
    passEncoder.setBindGroup(0, this.grp0.getBindGroup());

    if (this.meshInstances.length < this.meshInstanceCount * MESH_STORAGE_SIZE) {
      this.meshInstances = this.grp1.setStorageFloat(0, 'MESHES', this.meshInstanceCount * MESH_STORAGE_SIZE);
      this.grp1.allocate();
    }

    let globalInstanceIndex = 0;
    for (const [mesh, matrices] of this.meshInstanceCommands) {
      const instanceCount = matrices.length;
      const tag = mesh.getTag();
      const matrix = mesh.billboard ?
      (mesh.hasViewInversion() ? bpciMatrix : bpcMatrix) :
      (mesh.hasViewInversion() ? vpciMatrix : vpcMatrix);

      for (let j = 0; j < instanceCount; j++) {
        const mMatrix = matrices[j];
        const offset = globalInstanceIndex * MESH_STORAGE_SIZE;

        UT.MAT4_MULTIPLY(matrix, mMatrix, this.mvpcMatrix);
        this.meshInstances[offset + 0] = this.mvpcMatrix[0];
        this.meshInstances[offset + 1] = this.mvpcMatrix[1];
        this.meshInstances[offset + 2] = this.mvpcMatrix[2];
        this.meshInstances[offset + 3] = this.mvpcMatrix[3];
        this.meshInstances[offset + 4] = this.mvpcMatrix[4];
        this.meshInstances[offset + 5] = this.mvpcMatrix[5];
        this.meshInstances[offset + 6] = this.mvpcMatrix[6];
        this.meshInstances[offset + 7] = this.mvpcMatrix[7];
        this.meshInstances[offset + 8] = this.mvpcMatrix[8];
        this.meshInstances[offset + 9] = this.mvpcMatrix[9];
        this.meshInstances[offset + 10] = this.mvpcMatrix[10];
        this.meshInstances[offset + 11] = this.mvpcMatrix[11];
        this.meshInstances[offset + 12] = this.mvpcMatrix[12];
        this.meshInstances[offset + 13] = this.mvpcMatrix[13];
        this.meshInstances[offset + 14] = this.mvpcMatrix[14];
        this.meshInstances[offset + 15] = this.mvpcMatrix[15];

        this.meshInstances[offset + 16] = mMatrix[0];
        this.meshInstances[offset + 17] = mMatrix[1];
        this.meshInstances[offset + 18] = mMatrix[2];
        this.meshInstances[offset + 19] = mMatrix[3];
        this.meshInstances[offset + 20] = mMatrix[4];
        this.meshInstances[offset + 21] = mMatrix[5];
        this.meshInstances[offset + 22] = mMatrix[6];
        this.meshInstances[offset + 23] = mMatrix[7];
        this.meshInstances[offset + 24] = mMatrix[8];
        this.meshInstances[offset + 25] = mMatrix[9];
        this.meshInstances[offset + 26] = mMatrix[10];
        this.meshInstances[offset + 27] = mMatrix[11];
        this.meshInstances[offset + 28] = mMatrix[12];
        this.meshInstances[offset + 29] = mMatrix[13];
        this.meshInstances[offset + 30] = mMatrix[14];
        this.meshInstances[offset + 31] = mMatrix[15];

        this.meshInstances[offset + 32] = mMatrix[0];
        this.meshInstances[offset + 33] = mMatrix[1];
        this.meshInstances[offset + 34] = mMatrix[2];
        this.meshInstances[offset + 35] = mMatrix[4];
        this.meshInstances[offset + 36] = mMatrix[5];
        this.meshInstances[offset + 37] = mMatrix[6];
        this.meshInstances[offset + 38] = mMatrix[8];
        this.meshInstances[offset + 39] = mMatrix[9];
        this.meshInstances[offset + 40] = mMatrix[10];

        this.meshInstances[offset + 41] = tag[0];
        this.meshInstances[offset + 42] = tag[1];
        this.meshInstances[offset + 43] = tag[2];
        this.meshInstances[offset + 44] = tag[3];

        globalInstanceIndex++;
      }
    }

    this.grp1.beginWrite();
    this.grp1.writeStorage(0, this.meshInstances.subarray(0, this.meshInstanceCount * MESH_STORAGE_SIZE));
    this.grp1.endWrite();

    passEncoder.setBindGroup(1, this.grp1.getBindGroup());

    let currentFirstInstance = 0;
    for (const [mesh, matrices] of this.meshInstanceCommands) {
      const grp2 = mesh.mat.getGroup02();
      const grp3 = mesh.mat.getGroup03();
      passEncoder.setBindGroup(2, grp2.getBindGroup());
      passEncoder.setBindGroup(3, grp3.getBindGroup());
      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), mesh.getVertexSubBufferOffset(), mesh.getVertexSubBufferSize());
      passEncoder.draw(mesh.getVertexCount(), matrices.length, 0, currentFirstInstance);
      currentFirstInstance += matrices.length;
    }

    this.sceneInfos[Gfx3SceneInfos.POINT_LIGHT_COUNT] = 0;
    this.pointLights.fill(0);
    this.sceneInfos[Gfx3SceneInfos.SPOT_LIGHT_COUNT] = 0;
    this.spotLights.fill(0);
    this.sceneInfos[Gfx3SceneInfos.DECAL_COUNT] = 0;
    this.decals.fill(0);
    this.meshInstanceCommands.clear();
    this.meshInstanceCount = 0;

    if (destinationTexture) {
      passEncoder.end();
    }
  }

  /**
   * Set insertion in shaders code.
   * This method will reload the pipeline.
   * 
   * @param {Partial<typeof MESH_SHADER_INSERTS>} data - The custom data used by the shader template.
   */
  setShaderInserts(data: Partial<typeof MESH_SHADER_INSERTS> = {}): void {
    Object.assign(MESH_SHADER_INSERTS, data);
    super.reload(MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER, MESH_PIPELINE_DESC, { ...MESH_MAT_CUSTOM_PARAMS, ...MESH_SCENE_CUSTOM_PARAMS, ...MESH_SHADER_INSERTS });
    this.grp0.setPipeline(this.pipeline);
    this.grp1.setPipeline(this.pipeline);
    this.grp0.allocate();
    this.grp1.allocate();
  }

  /**
   * Set custom scene params vars in shaders code.
   * This method will reload the pipeline.
   * 
   * @param {Partial<typeof MESH_SCENE_CUSTOM_PARAMS>} data - The custom data used by the shader template.
   */
  setSceneCustomParams(data: Partial<typeof MESH_SCENE_CUSTOM_PARAMS> = {}): void {
    Object.assign(MESH_SCENE_CUSTOM_PARAMS, data);
    super.reload(MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER, MESH_PIPELINE_DESC, { ...MESH_MAT_CUSTOM_PARAMS, ...MESH_SCENE_CUSTOM_PARAMS, ...MESH_SHADER_INSERTS });
    this.grp0.setPipeline(this.pipeline);
    this.grp1.setPipeline(this.pipeline);
    this.grp0.allocate();
    this.grp1.allocate();
  }

  /**
   * Set custom material params vars in shaders code.
   * This method will reload the pipeline.
   * 
   * @param {Partial<typeof MESH_MAT_CUSTOM_PARAMS>} data - The custom data used by the shader template.
   */
  setMaterialCustomParams(data: Partial<typeof MESH_MAT_CUSTOM_PARAMS> = {}): void {
    Object.assign(MESH_MAT_CUSTOM_PARAMS, data);
    super.reload(MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER, MESH_PIPELINE_DESC, { ...MESH_MAT_CUSTOM_PARAMS, ...MESH_SCENE_CUSTOM_PARAMS, ...MESH_SHADER_INSERTS });
    this.grp0.setPipeline(this.pipeline);
    this.grp1.setPipeline(this.pipeline);
    this.grp0.allocate();
    this.grp1.allocate();
  }

  /**
   * Enable the shadowing projection.
   * 
   * @param {boolean} enabled - Indicating whether the shadow should be enabled or disabled.
   */
  enableShadow(enabled: boolean): void {
    this.shadowEnabled = enabled;
  }

  /**
   * Set shadow depth texture map.
   * 
   * @param {Gfx3Texture} depthTexture - The shadow depth texture.
   */
  setShadowMap(depthTexture: Gfx3Texture): void {
    this.shadowMap = this.grp0.setTexture(9, 'SHADOW_MAP_TEXTURE', depthTexture);
    this.shadowMap = this.grp0.setSampler(10, 'SHADOW_MAP_SAMPLER', this.shadowMap);
    this.grp0.allocate();
  }

  /**
   * Set the decal texture atlas.
   * 
   * @param {Gfx3Texture} decalAtlas - The decal texture atlas.
   */
  setDecalAtlas(decalAtlas: Gfx3Texture): void {
    this.decalAtlas = this.grp0.setTexture(7, 'DECAL_ATLAS_TEXTURE', decalAtlas);
    this.decalAtlas = this.grp0.setSampler(8, 'DECAL_ATLAS_SAMPLER', this.decalAtlas);
    this.grp0.allocate();
  }

  /**
   * Enable the fog.
   * 
   * @param {boolean} enabled - Indicating whether the fog is enabled or not.
   * @param {vec3} from - The fog origin point.
   * @param {vec3} color - The fog color.
   * @param {number} [near=3.0] - The distance from the camera at which the fog starts to appear.
   * @param {number} [far=15.0] - The distance from the camera at which the fog effect should start to fade out.
   */
  enableFog(enabled: boolean, from: vec3 = [0, 0, 0], color: vec3 = [0.5, 0.5, 0.5], near: number = 3.0, far: number = 15.0): void {
    this.fog[0] = enabled ? 1.0 : 0.0;
    this.fog[1] = near;
    this.fog[2] = far;
    this.fog[3] = 0;
    this.fog[4] = color[0];
    this.fog[5] = color[1];
    this.fog[6] = color[2];
    this.fog[7] = 0;
    this.fog[8] = from[0];
    this.fog[9] = from[1];
    this.fog[10] = from[2];
    this.fog[11] = 0;
  }

  /**
   * Set the fog origin point.
   * 
   * @param {vec3} from - The fog origin point.
   */
  setFogFrom(from: vec3): void {
    this.fog[8] = from[0];
    this.fog[9] = from[1];
    this.fog[10] = from[2];
    this.fog[11] = 0;
  }

  /**
   * Set the fog color.
   * 
   * @param {vec3} color - The fog color.
   */
  setFogColor(color: vec3): void {
    this.fog[4] = color[0];
    this.fog[5] = color[1];
    this.fog[6] = color[2];
    this.fog[7] = 0;
  }

  /**
   * Set the fog near distance.
   * 
   * @param {number} near - The distance from the camera at which the fog starts to appear.
   */
  setFogNear(near: number): void {
    this.fog[1] = near;
  }

  /**
   * Set the fog far distance.
   * 
   * @param {number} far - The distance from the camera at which the fog effect should start to fade out.
   */
  setFogFar(far: number): void {
    this.fog[2] = far;
  }

  /**
   * Draw a mesh.
   * 
   * @param {Gfx3Mesh} mesh - The mesh.
   * @param {mat4 | null} [matrix=null] - The transformation matrix.
   */
  drawMesh(mesh: Gfx3Mesh, matrix: mat4 | null = null): void {
    const meshMatrix = matrix ?? mesh.getTransformMatrix();
    this.drawInstanceMesh(mesh, [meshMatrix]);
  }

  drawInstanceMesh(mesh: Gfx3Mesh, matrices: mat4[]): void {
    if (!this.meshInstanceCommands.has(mesh)) {
      this.meshInstanceCommands.set(mesh, matrices);
    }
    else {
      const command = this.meshInstanceCommands.get(mesh)!;
      command.push(...matrices);
    }

    if (this.shadowEnabled && mesh.mat.isShadowCasting()) {
      for (const matrix of matrices) {
        gfx3MeshShadowRenderer.drawMesh(mesh, matrix);
      }
    }

    this.meshInstanceCount += matrices.length;
  }

  /**
   * Set the ambient color.
   * 
   * @param {vec3} ambientColor - The ambient color.
   */
  setAmbientColor(ambientColor: vec3): void {
    this.sceneInfos[Gfx3SceneInfos.AMBIENT_R] = ambientColor[0];
    this.sceneInfos[Gfx3SceneInfos.AMBIENT_G] = ambientColor[1];
    this.sceneInfos[Gfx3SceneInfos.AMBIENT_B] = ambientColor[2];
  }

  /**
   * Set a custom parameter value.
   * 
   * @param {string} name - The param name.
   * @param {number} value - The param value.
   */
  setCustomParamValue(name: string, value: number): void {
    const paramIndex = Object.values(MESH_SCENE_CUSTOM_PARAMS).findIndex(n => n == name);
    if (paramIndex == -1) {
      throw new Error('Gfx3MeshRenderer::setCustomParam(): Custom param name not found !');
    }

    this.sceneInfos[Gfx3SceneInfos.COUNT + paramIndex] = value;
  }

  /**
   * Returns the specified custom param value.
   * 
   * @param {string} name - The param name.
   */
  getCustomParamValue(name: string): number {
    const paramIndex = Object.values(MESH_SCENE_CUSTOM_PARAMS).findIndex(n => n == name);
    if (paramIndex == -1) {
      throw new Error('Gfx3MeshRenderer::getCustomParam(): Custom param name not found !');
    }

    return this.sceneInfos[Gfx3SceneInfos.COUNT + paramIndex];
  }

  /**
   * Set a directional light.
   * 
   * @param {boolean} enable - Enable or not the sun light.
   * @param {vec3} direction - The direction.
   * @param {vec3} diffuse - The diffuse color.
   * @param {vec3} specular - The specular color.
   * @param {number} [intensity=1] - The strength or brightness.
   * @param {number} [groupId=0] - The mesh id targeted (0 affect all mesh).
   */
  setDirLight(enable: boolean, direction: vec3, diffuse: vec3, specular: vec3, intensity: number = 1, groupId: number = 0): void {
    this.dirLight[0] = direction[0];
    this.dirLight[1] = direction[1];
    this.dirLight[2] = direction[2];
    this.dirLight[3] = enable ? 1.0 : 0.0;
    this.dirLight[4] = diffuse[0];
    this.dirLight[5] = diffuse[1];
    this.dirLight[6] = diffuse[2];
    this.dirLight[7] = 0;
    this.dirLight[8] = specular[0];
    this.dirLight[9] = specular[1];
    this.dirLight[10] = specular[2];
    this.dirLight[11] = intensity;
    this.dirLight[12] = groupId;
    this.dirLight[13] = 0;
    this.dirLight[14] = 0;
    this.dirLight[15] = 0;
  }

  /**
   * Draw a point light.
   * 
   * @param {vec3} position - The position.
   * @param {vec3} diffuse - The diffuse color.
   * @param {vec3} specular - The specular color.
   * @param {number} [intensity=1] - The brightness or strength.
   * @param {number} [groupId=0] - The mesh id targeted (0 affect all mesh).
   * @param {number} [constant=1] - The constant attenuation factor of the point light.
   * @param {number} [linear=0] - The linear attenuation factor of the point light.
   * @param {number} [exp=0] - The exponent of the attenuation equation for the point light.
   */
  drawPointLight(position: vec3, diffuse: vec3, specular: vec3, intensity: number = 1, groupId: number = 0, constant: number = 1, linear: number = 0, exp: number = 0): void {
    const count = this.sceneInfos[6];
    if (count >= MESH_MAX_POINT_LIGHTS) {
      throw new Error('Gfx3MeshRenderer::drawPointLight(): Max point lights number exceeded !');
    }

    this.pointLights[count * 20 + 0] = position[0];
    this.pointLights[count * 20 + 1] = position[1];
    this.pointLights[count * 20 + 2] = position[2];
    this.pointLights[count * 20 + 3] = 0;
    this.pointLights[count * 20 + 4] = diffuse[0];
    this.pointLights[count * 20 + 5] = diffuse[1];
    this.pointLights[count * 20 + 6] = diffuse[2];
    this.pointLights[count * 20 + 7] = 0;
    this.pointLights[count * 20 + 8] = specular[0];
    this.pointLights[count * 20 + 9] = specular[1];
    this.pointLights[count * 20 + 10] = specular[2];
    this.pointLights[count * 20 + 11] = 0;
    this.pointLights[count * 20 + 12] = constant;
    this.pointLights[count * 20 + 13] = linear;
    this.pointLights[count * 20 + 14] = exp;
    this.pointLights[count * 20 + 15] = intensity;
    this.pointLights[count * 20 + 16] = groupId;
    this.pointLights[count * 20 + 17] = 0;
    this.pointLights[count * 20 + 18] = 0;
    this.pointLights[count * 20 + 19] = 0;
    this.sceneInfos[6]++;
  }

  /**
   * Draw a spot light.
   * 
   * @param {vec3} position - The position.
   * @param {vec3} direction - The direction.
   * @param {number} cutoff - The aperture angle of light.
   * @param {vec3} diffuse - The diffuse color.
   * @param {vec3} specular - The specular color.
   * @param {number} [intensity=1] - The brightness or strength.
   * @param {number} [groupId=0] - The mesh id targeted (0 affect all mesh).
   * @param {number} [constant=1] - The constant attenuation factor of the point light.
   * @param {number} [linear=0] - The linear attenuation factor of the point light.
   * @param {number} [exp=0] - The exponent of the attenuation equation for the point light.
   */
  drawSpotLight(position: vec3, direction: vec3, cutoff: number, diffuse: vec3, specular: vec3, intensity: number = 1, groupId: number = 0, constant: number = 1, linear: number = 0, exp: number = 0): void {
    const count = this.sceneInfos[7];
    if (count >= MESH_MAX_SPOT_LIGHTS) {
      throw new Error('Gfx3MeshRenderer::drawSpotLight(): Max spot lights number exceeded !');
    }

    this.spotLights[count * 24 + 0] = position[0];
    this.spotLights[count * 24 + 1] = position[1];
    this.spotLights[count * 24 + 2] = position[2];
    this.spotLights[count * 24 + 3] = 0;
    this.spotLights[count * 24 + 4] = direction[0];
    this.spotLights[count * 24 + 5] = direction[1];
    this.spotLights[count * 24 + 6] = direction[2];
    this.spotLights[count * 24 + 7] = 0;
    this.spotLights[count * 24 + 8] = diffuse[0];
    this.spotLights[count * 24 + 9] = diffuse[1];
    this.spotLights[count * 24 + 10] = diffuse[2];
    this.spotLights[count * 24 + 11] = 0;
    this.spotLights[count * 24 + 12] = specular[0];
    this.spotLights[count * 24 + 13] = specular[1];
    this.spotLights[count * 24 + 14] = specular[2];
    this.spotLights[count * 24 + 15] = 0;
    this.spotLights[count * 24 + 16] = constant;
    this.spotLights[count * 24 + 17] = linear;
    this.spotLights[count * 24 + 18] = exp;
    this.spotLights[count * 24 + 19] = intensity;
    this.spotLights[count * 24 + 20] = groupId;
    this.spotLights[count * 24 + 21] = Math.cos(cutoff);
    this.spotLights[count * 24 + 22] = 0;
    this.spotLights[count * 24 + 23] = 0;
    this.sceneInfos[7]++;
  }

  /**
   * Draw a decal.
   * 
   * @param {number} group - The group target (mesh is identified by its 'g' id component).
   * @param {number} sx - The x-coordinate of the decal sprite in the atlas texture.
   * @param {number} sy - The y-coordinate of the decal sprite in the atlas texture.
   * @param {number} sw - The width of the decal sprite in the atlas texture.
   * @param {number} sh - The height of the decal sprite in the atlas texture.
   * @param {vec3} position - The position of projector (center).
   * @param {vec3} orientationX - The x-axis orientation of the projector.
   * @param {vec3} orientationY - The y-axis orientation of the projector.
   * @param {vec3} orientationZ - The z-axis orientation of the projector.
   * @param {vec3} size - The size (width, height, depth) of the projector.
   * @param {number} opacity - The opacity or transparency of the decal.
   */
  drawDecal(group: number, sx: number, sy: number, sw: number, sh: number, position: vec3, orientationX: vec3, orientationY: vec3, orientationZ: vec3, size: vec3, opacity: number): void {
    const count = this.sceneInfos[8];
    if (count >= MESH_MAX_DECALS) {
      throw new Error('Gfx3MeshRenderer::drawDecal(): Max decals number exceeded !');
    }

    const projectorM: mat4 = [
      orientationX[0],
      orientationX[1],
      orientationX[2],
      0,
      orientationY[0],
      orientationY[1],
      orientationY[2],
      0,
      orientationZ[0],
      orientationZ[1],
      orientationZ[2],
      0,
      position[0],
      position[1],
      position[2],
      1
    ];

    const aspectRatio: vec2 = [
      sw > sh ? 1.0 : sh / sw,
      sw > sh ? sw / sh : 1.0
    ];

    const projectorV = UT.MAT4_INVERT(projectorM);
    const projectorP = UT.MAT4_ORTHOGRAPHIC(size[0], size[1], size[2]);
    const projectorVP = UT.MAT4_MULTIPLY(projectorP, projectorV);

    this.decals[count * 24 + 0] = projectorVP[0];
    this.decals[count * 24 + 1] = projectorVP[1];
    this.decals[count * 24 + 2] = projectorVP[2];
    this.decals[count * 24 + 3] = projectorVP[3];
    this.decals[count * 24 + 4] = projectorVP[4];
    this.decals[count * 24 + 5] = projectorVP[5];
    this.decals[count * 24 + 6] = projectorVP[6];
    this.decals[count * 24 + 7] = projectorVP[7];
    this.decals[count * 24 + 8] = projectorVP[8];
    this.decals[count * 24 + 9] = projectorVP[9];
    this.decals[count * 24 + 10] = projectorVP[10];
    this.decals[count * 24 + 11] = projectorVP[11];
    this.decals[count * 24 + 12] = projectorVP[12];
    this.decals[count * 24 + 13] = projectorVP[13];
    this.decals[count * 24 + 14] = projectorVP[14];
    this.decals[count * 24 + 15] = projectorVP[15];
    this.decals[count * 24 + 16] = sx / this.decalAtlas.gpuTexture.width;
    this.decals[count * 24 + 17] = sy / this.decalAtlas.gpuTexture.height;
    this.decals[count * 24 + 18] = sw / this.decalAtlas.gpuTexture.width;
    this.decals[count * 24 + 19] = sh / this.decalAtlas.gpuTexture.height;
    this.decals[count * 24 + 20] = aspectRatio[0];
    this.decals[count * 24 + 21] = aspectRatio[1];
    this.decals[count * 24 + 22] = opacity;
    this.decals[count * 24 + 23] = group;
    this.sceneInfos[8]++;
  }
}

export const gfx3MeshRenderer = new Gfx3MeshRenderer();