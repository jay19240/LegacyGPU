import { gfx3Manager } from '@lib/legacygpu';
import { gfx3MeshRenderer } from '@lib/legacygpu';
import { gfx3ParticlesRenderer } from '@lib/legacygpu';
import { Screen } from '@lib/legacygpu';
import { Gfx3MeshJSM } from '@lib/legacygpu';
import { EnginePack3D } from '@lib/legacygpu';
// ---------------------------------------------------------------------------------------

class GameScreen extends Screen {
  pack: EnginePack3D;
  player: Gfx3MeshJSM;

  constructor() {
    super();
    this.pack = new EnginePack3D();
    this.player = new Gfx3MeshJSM();
  }

  async onEnter() {
    this.pack = await EnginePack3D.createFromFile('classic', './scene.blend.pak');
    this.player = this.pack.jsm.get('Player');

    this.player.setRotationY(0.4);
    gfx3MeshRenderer.setDirLight(true, [0, -1, -1], [1, 1, 1], [0.2, 0.2, 0.2]);
  }

  update(ts: number) {
    this.pack.update(ts);
    // this.player.rotate(0, ts * 0.001, 0);
  }

  draw() {
    gfx3Manager.beginDrawing();
    this.pack.draw();
    gfx3Manager.endDrawing();
  }

  render(ts: number) {
    gfx3Manager.beginRender();
    gfx3Manager.beginPassRender(0);
    gfx3MeshRenderer.render(ts);
    gfx3ParticlesRenderer.render();
    gfx3Manager.endPassRender();
    gfx3Manager.endRender();
  }
}

export { GameScreen };