import { gfx3Manager } from '../gfx3/gfx3_manager';
import { Gfx3RendererAbstract } from '../gfx3/gfx3_renderer_abstract';
import { Gfx3StaticGroup, Gfx3DynamicGroup } from '../gfx3/gfx3_group';
import { Gfx3RenderingTexture } from '../gfx3/gfx3_texture';
import { Gfx3Water } from './gfx3_water';
import { WATER_PIPELINE_DESC, WATER_VERTEX_SHADER, WATER_FRAGMENT_SHADER } from './gfx3_water_shader';

/**
 * Singleton water renderer.
 * Renders queued Gfx3Water surfaces with shared scene-wide camera/time uniforms.
 */
export class Gfx3WaterRenderer extends Gfx3RendererAbstract {
  waters: Array<Gfx3Water>;
  grp0: Gfx3StaticGroup;
  scene: Float32Array;
  grp1: Gfx3DynamicGroup;
  meshInfos: Float32Array;

  constructor() {
    super('WATER_PIPELINE', WATER_VERTEX_SHADER, WATER_FRAGMENT_SHADER, WATER_PIPELINE_DESC);
    this.waters = [];

    this.grp0 = gfx3Manager.createStaticGroup('WATER_PIPELINE', 0);
    this.scene = this.grp0.setFloat(0, 'SCENE', 24); // vp(16) + camera(4) + time(4)

    this.grp1 = gfx3Manager.createDynamicGroup('WATER_PIPELINE', 1);
    this.meshInfos = this.grp1.setFloat(0, 'MESH', 112); // model(16) + tag(4) + waveParams(20) + wave(4) + grid(4) + impactsA(32) + impactsB(32)

    this.grp0.allocate();
    this.grp1.allocate();
  }

  /**
   * The render function.
   */
  render(destinationTexture: Gfx3RenderingTexture | null = null): void {
    const currentView = gfx3Manager.getCurrentView();
    const commandEncoder = gfx3Manager.getCommandEncoder();
    const passEncoder = destinationTexture ? commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: destinationTexture.gpuTextureView,
        loadOp: 'clear',
        storeOp: 'store'
      }]
    }) : gfx3Manager.getPassEncoder();

    passEncoder.setPipeline(this.pipeline);

    const vpMatrix = currentView.getViewProjectionClipMatrix();
    const cameraPos = currentView.getCameraPosition();
    const time = performance.now() / 1000;

    for (let m = 0; m < 16; m++) this.scene[m] = vpMatrix[m];
    this.scene[16] = cameraPos[0];
    this.scene[17] = cameraPos[1];
    this.scene[18] = cameraPos[2];
    this.scene[19] = 1.0;
    this.scene[20] = time;
    this.scene[21] = 0.0;
    this.scene[22] = 0.0;
    this.scene[23] = 0.0;

    this.grp0.beginWrite();
    this.grp0.write(0, this.scene);
    this.grp0.endWrite();
    passEncoder.setBindGroup(0, this.grp0.getBindGroup());

    if (this.grp1.getSize() < this.waters.length) {
      this.grp1.allocate(this.waters.length);
    }

    this.grp1.beginWrite();

    for (let i = 0; i < this.waters.length; i++) {
      const water = this.waters[i];
      const model = water.getTransformMatrix();
      const tag = water.getTag();

      for (let m = 0; m < 16; m++) this.meshInfos[m] = model[m];
      this.meshInfos[16] = tag[0];
      this.meshInfos[17] = tag[1];
      this.meshInfos[18] = tag[2];
      this.meshInfos[19] = tag[3];
      water.writeShaderData(this.meshInfos, 20);

      this.grp1.write(0, this.meshInfos);
      passEncoder.setBindGroup(1, this.grp1.getBindGroup(i));

      const grp2 = water.getGroup02();
      passEncoder.setBindGroup(2, grp2.getBindGroup());

      passEncoder.setVertexBuffer(0, gfx3Manager.getVertexBuffer(), water.getVertexSubBufferOffset(), water.getVertexSubBufferSize());
      passEncoder.draw(water.getVertexCount());
    }

    this.grp1.endWrite();
    this.waters = [];

    if (destinationTexture) {
      passEncoder.end();
    }
  }

  /**
   * Queue a water surface for rendering.
   *
   * @param {Gfx3Water} water - The water object.
   */
  drawWater(water: Gfx3Water): void {
    this.waters.push(water);
  }
}

export const gfx3WaterRenderer = new Gfx3WaterRenderer();
