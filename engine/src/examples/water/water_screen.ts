import { gfx3Manager } from '@lib/gfx3/gfx3_manager';
import { gfx3TextureManager } from '@lib/gfx3/gfx3_texture_manager';
import { gfx3DebugRenderer } from '@lib/gfx3/gfx3_debug_renderer';
import { gfx3MeshRenderer } from '@lib/gfx3_mesh/gfx3_mesh_renderer';
import { gfx3SkyboxRenderer } from '@lib/gfx3_skybox/gfx3_skybox_renderer';
import { gfx3WaterRenderer } from '@lib/gfx3_water/gfx3_water_renderer';
import { eventManager } from '@lib/core/event_manager';
import { inputManager } from '@lib/input/input_manager';
import { uiManager } from '@lib/ui/ui_manager';
import { UT } from '@lib/core/utils';
import { Screen } from '@lib/screen/screen';
import { Gfx3CameraOrbit } from '@lib/gfx3_camera/gfx3_camera_orbit';
import { Gfx3Skybox } from '@lib/gfx3_skybox/gfx3_skybox';
import { Gfx3Water } from '@lib/gfx3_water/gfx3_water';
// ---------------------------------------------------------------------------------------

class WaterScreen extends Screen {
  camera: Gfx3CameraOrbit;
  skybox: Gfx3Skybox;
  water: Gfx3Water;
  infobox: HTMLElement | null;
  tweakPanel: HTMLElement | null;
  impactStrength: number;
  impactRadius: number;
  impactLifetime: number;
  handleMouseDownCb: (data: any) => void;
  handleContextMenuCb: (e: MouseEvent) => void;

  constructor() {
    super();
    this.camera = new Gfx3CameraOrbit(0);
    this.skybox = new Gfx3Skybox();
    this.water = new Gfx3Water();
    this.infobox = null;
    this.tweakPanel = null;
    this.impactStrength = 1.0;
    this.impactRadius = 6.0;
    this.impactLifetime = 3.0;
    this.handleMouseDownCb = this.handleMouseDown.bind(this);
    this.handleContextMenuCb = (e: MouseEvent) => e.preventDefault();
  }

  async onEnter() {
    const view = gfx3Manager.getView(0);
    view.setBgColor(0.4, 0.6, 0.8, 1.0);
    view.setPerspectiveFar(500);

    this.camera.target = [0, 0, 0];
    this.camera.distance = 35;
    this.camera.theta = 0.45;
    this.camera.phi = Math.PI * 0.5;

    this.skybox = new Gfx3Skybox();
    this.skybox.setCubemap(await gfx3TextureManager.loadCubemapTexture({
      right: './examples/viewer/skybox/sky_right.png',
      left: './examples/viewer/skybox/sky_left.png',
      top: './examples/viewer/skybox/sky_top.png',
      bottom: './examples/viewer/skybox/sky_bottom.png',
      front: './examples/viewer/skybox/sky_front.png',
      back: './examples/viewer/skybox/sky_back.png'
    }));

    this.water = new Gfx3Water();
    this.water.buildGrid(60, 60, 80, 80);
    this.water.setEnvMap(await gfx3TextureManager.loadCubemapTexture({
      right: './examples/viewer/skybox/sky_right.png',
      left: './examples/viewer/skybox/sky_left.png',
      top: './examples/viewer/skybox/sky_top.png',
      bottom: './examples/viewer/skybox/sky_bottom.png',
      front: './examples/viewer/skybox/sky_front.png',
      back: './examples/viewer/skybox/sky_back.png'
    }));
    this.water.setNormalMap(await gfx3TextureManager.loadTexture('./textures/waternormals.jpg', { addressModeU: 'repeat', addressModeV: 'repeat' }));

    this.water.setWave(0.30, 0.18, 0.35, 1.0);
    this.water.setNormalMapInfos(0.04, 0.03, 0.5, 6.0);
    this.water.setSurfaceColor(0.04, 0.18, 0.28, 0.92);
    this.water.setOptics(1.0, 5.0, 0.7, 0.15);
    this.water.setSun(-0.4, -1.0, -0.3, 80.0);
    this.water.setSunColor(1.0, 0.95, 0.85, 1.0);

    gfx3MeshRenderer.setDirLight(true, [0, -1, -0.3], [1, 1, 1], [0.2, 0.25, 0.3]);

    this.infobox = CREATE_UI_INFOBOX();
    uiManager.addNode(this.infobox, 'position:absolute; bottom:10px; right:10px');
    this.tweakPanel = CREATE_UI_TWEAK_PANEL(this.water, {
      getStrength: () => this.impactStrength,
      setStrength: (v: number) => { this.impactStrength = v; },
      getRadius: () => this.impactRadius,
      setRadius: (v: number) => { this.impactRadius = v; },
      getLifetime: () => this.impactLifetime,
      setLifetime: (v: number) => { this.impactLifetime = v; },
      dropRandom: () => this.dropRandomImpact()
    });
    uiManager.addNode(this.tweakPanel, 'position:absolute; top:10px; left:10px');
    eventManager.subscribe(inputManager, 'E_MOUSE_DOWN_ONCE', this, this.handleMouseDownCb);
    document.addEventListener('contextmenu', this.handleContextMenuCb);
  }

  onExit() {
    eventManager.unsubscribe(inputManager, 'E_MOUSE_DOWN_ONCE', this);
    document.removeEventListener('contextmenu', this.handleContextMenuCb);
    if (this.infobox) uiManager.removeNode(this.infobox);
    if (this.tweakPanel) uiManager.removeNode(this.tweakPanel);
  }

  dropRandomImpact() {
    const halfW = 60 * 0.5;
    const halfD = 60 * 0.5;
    const wx = (Math.random() * 2 - 1) * halfW * 0.85;
    const wz = (Math.random() * 2 - 1) * halfD * 0.85;
    this.water.addImpact(wx, wz, this.impactStrength, this.impactRadius, this.impactLifetime);
  }

  update(ts: number) {
    this.camera.update(ts);
    this.water.update(ts);
  }

  draw() {
    gfx3Manager.beginDrawing();
    this.skybox.draw();
    this.water.draw();
    gfx3DebugRenderer.drawGrid(UT.MAT4_ROTATE_X(Math.PI * 0.5), 30, 1);
    gfx3Manager.endDrawing();
  }

  render(ts: number) {
    gfx3Manager.beginRender();
    gfx3Manager.beginPassRender(0);
    gfx3SkyboxRenderer.render();
    gfx3MeshRenderer.render(ts);
    gfx3WaterRenderer.render();
    gfx3DebugRenderer.render();
    gfx3Manager.endPassRender();
    gfx3Manager.endRender();
  }

  handleMouseDown(data: any) {
    if ((data.buttons & 2) === 0) {
      return;
    }

    const view = gfx3Manager.getView(0);
    const clientSize = view.getViewportClientSize();
    const ndcX = (data.x / clientSize[0]) * 2 - 1;
    const ndcY = 1 - (data.y / clientSize[1]) * 2;

    const invVP = UT.MAT4_INVERT(view.getViewProjectionClipMatrix());
    const near = UT.MAT4_MULTIPLY_BY_VEC4(invVP, [ndcX, ndcY, -1, 1]);
    const far = UT.MAT4_MULTIPLY_BY_VEC4(invVP, [ndcX, ndcY, 1, 1]);
    const nx = near[0] / near[3], ny = near[1] / near[3], nz = near[2] / near[3];
    const fx = far[0] / far[3], fy = far[1] / far[3], fz = far[2] / far[3];
    const dx = fx - nx, dy = fy - ny, dz = fz - nz;

    if (Math.abs(dy) < 0.0001) {
      return;
    }

    const t = -ny / dy;
    if (t < 0 || t > 1) {
      return;
    }

    const wx = nx + t * dx;
    const wz = nz + t * dz;
    this.water.addImpact(wx, wz, this.impactStrength, this.impactRadius, this.impactLifetime);
  }
}

export { WaterScreen };

/******************************************************************* */
// HELPFUL
/******************************************************************* */

function CREATE_UI_INFOBOX(): HTMLElement {
  const box = document.createElement('div');
  box.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
  box.style.padding = '10px';
  box.style.color = '#fff';
  box.style.fontFamily = 'monospace';
  box.style.backdropFilter = 'blur(3px)';

  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.padding = '0';
  ul.style.margin = '0';
  box.appendChild(ul);

  const lines = [
    '[Left Drag] => Orbit camera',
    '[Wheel] => Zoom',
    '[Right Click on water] => Drop impact at cursor',
    '[Drop Random button] => Drop impact at random position'
  ];

  for (const txt of lines) {
    const li = document.createElement('li');
    li.textContent = txt;
    ul.appendChild(li);
  }

  return box;
}

type WaterTweakState = {
  wave: { a: number, sc: number, sp: number, ch: number };
  normal: { sx: number, sy: number, i: number, sc: number };
  surface: { r: number, g: number, b: number, o: number };
  optics: { ei: number, fp: number, fb: number, dt: number };
  sun: { dx: number, dy: number, dz: number, sp: number };
  sunColor: { r: number, g: number, b: number, i: number };
};

type ImpactCtrl = {
  getStrength: () => number;
  setStrength: (v: number) => void;
  getRadius: () => number;
  setRadius: (v: number) => void;
  getLifetime: () => number;
  setLifetime: (v: number) => void;
  dropRandom: () => void;
};

function CREATE_UI_TWEAK_PANEL(water: Gfx3Water, impact: ImpactCtrl): HTMLElement {
  const state: WaterTweakState = {
    wave: { a: 0.30, sc: 0.18, sp: 0.35, ch: 1.0 },
    normal: { sx: 0.04, sy: 0.03, i: 0.5, sc: 6.0 },
    surface: { r: 0.04, g: 0.18, b: 0.28, o: 0.92 },
    optics: { ei: 1.0, fp: 5.0, fb: 0.7, dt: 0.15 },
    sun: { dx: -0.4, dy: -1.0, dz: -0.3, sp: 80.0 },
    sunColor: { r: 1.0, g: 0.95, b: 0.85, i: 1.0 }
  };

  const panel = document.createElement('div');
  panel.style.cssText = 'background:rgba(0,0,0,0.55); padding:8px 10px; color:#fff; font-family:monospace; font-size:11px; backdrop-filter:blur(4px); width:320px; max-height:90vh; overflow-y:auto; border-radius:4px;';

  const title = document.createElement('div');
  title.textContent = 'Water Tweaks';
  title.style.cssText = 'font-weight:bold; font-size:13px; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid #555;';
  panel.appendChild(title);

  const refreshWave = () => water.setWave(state.wave.a, state.wave.sc, state.wave.sp, state.wave.ch);
  const refreshNormal = () => water.setNormalMapInfos(state.normal.sx, state.normal.sy, state.normal.i, state.normal.sc);
  const refreshSurface = () => water.setSurfaceColor(state.surface.r, state.surface.g, state.surface.b, state.surface.o);
  const refreshOptics = () => water.setOptics(state.optics.ei, state.optics.fp, state.optics.fb, state.optics.dt);
  const refreshSun = () => water.setSun(state.sun.dx, state.sun.dy, state.sun.dz, state.sun.sp);
  const refreshSunColor = () => water.setSunColor(state.sunColor.r, state.sunColor.g, state.sunColor.b, state.sunColor.i);

  const gWave = ADD_GROUP(panel, 'Wave (Perlin)');
  ADD_SLIDER(gWave, 'amplitude', 0, 1.5, 0.01, state.wave.a, v => { state.wave.a = v; refreshWave(); });
  ADD_SLIDER(gWave, 'scale', 0.01, 1.0, 0.005, state.wave.sc, v => { state.wave.sc = v; refreshWave(); });
  ADD_SLIDER(gWave, 'speed', 0, 2, 0.01, state.wave.sp, v => { state.wave.sp = v; refreshWave(); });
  ADD_SLIDER(gWave, 'choppiness', 1, 4, 0.05, state.wave.ch, v => { state.wave.ch = v; refreshWave(); });

  const gNormal = ADD_GROUP(panel, 'Normal Map');
  ADD_SLIDER(gNormal, 'scrollX', -0.2, 0.2, 0.005, state.normal.sx, v => { state.normal.sx = v; refreshNormal(); });
  ADD_SLIDER(gNormal, 'scrollY', -0.2, 0.2, 0.005, state.normal.sy, v => { state.normal.sy = v; refreshNormal(); });
  ADD_SLIDER(gNormal, 'intensity', 0, 2, 0.01, state.normal.i, v => { state.normal.i = v; refreshNormal(); });
  ADD_SLIDER(gNormal, 'scale', 0.1, 30, 0.1, state.normal.sc, v => { state.normal.sc = v; refreshNormal(); });

  const gSurf = ADD_GROUP(panel, 'Surface');
  ADD_SLIDER(gSurf, 'red', 0, 1, 0.01, state.surface.r, v => { state.surface.r = v; refreshSurface(); });
  ADD_SLIDER(gSurf, 'green', 0, 1, 0.01, state.surface.g, v => { state.surface.g = v; refreshSurface(); });
  ADD_SLIDER(gSurf, 'blue', 0, 1, 0.01, state.surface.b, v => { state.surface.b = v; refreshSurface(); });
  ADD_SLIDER(gSurf, 'opacity', 0, 1, 0.01, state.surface.o, v => { state.surface.o = v; refreshSurface(); });

  const gOpt = ADD_GROUP(panel, 'Optics');
  ADD_SLIDER(gOpt, 'envIntensity', 0, 3, 0.01, state.optics.ei, v => { state.optics.ei = v; refreshOptics(); });
  ADD_SLIDER(gOpt, 'fresnelPower', 0.1, 10, 0.1, state.optics.fp, v => { state.optics.fp = v; refreshOptics(); });
  ADD_SLIDER(gOpt, 'reflectivity', 0, 1, 0.01, state.optics.fb, v => { state.optics.fb = v; refreshOptics(); });
  ADD_SLIDER(gOpt, 'distortion', 0, 1, 0.01, state.optics.dt, v => { state.optics.dt = v; refreshOptics(); });

  const gSun = ADD_GROUP(panel, 'Sun');
  ADD_SLIDER(gSun, 'dirX', -1, 1, 0.05, state.sun.dx, v => { state.sun.dx = v; refreshSun(); });
  ADD_SLIDER(gSun, 'dirY', -1, 1, 0.05, state.sun.dy, v => { state.sun.dy = v; refreshSun(); });
  ADD_SLIDER(gSun, 'dirZ', -1, 1, 0.05, state.sun.dz, v => { state.sun.dz = v; refreshSun(); });
  ADD_SLIDER(gSun, 'specPower', 1, 500, 1, state.sun.sp, v => { state.sun.sp = v; refreshSun(); });

  const gSunCol = ADD_GROUP(panel, 'Sun Color');
  ADD_SLIDER(gSunCol, 'red', 0, 1, 0.01, state.sunColor.r, v => { state.sunColor.r = v; refreshSunColor(); });
  ADD_SLIDER(gSunCol, 'green', 0, 1, 0.01, state.sunColor.g, v => { state.sunColor.g = v; refreshSunColor(); });
  ADD_SLIDER(gSunCol, 'blue', 0, 1, 0.01, state.sunColor.b, v => { state.sunColor.b = v; refreshSunColor(); });
  ADD_SLIDER(gSunCol, 'intensity', 0, 5, 0.05, state.sunColor.i, v => { state.sunColor.i = v; refreshSunColor(); });

  const gImp = ADD_GROUP(panel, 'Impact');
  ADD_SLIDER(gImp, 'strength', 0, 5, 0.05, impact.getStrength(), v => impact.setStrength(v));
  ADD_SLIDER(gImp, 'radius', 0.5, 30, 0.5, impact.getRadius(), v => impact.setRadius(v));
  ADD_SLIDER(gImp, 'lifetime', 0.2, 10, 0.1, impact.getLifetime(), v => impact.setLifetime(v));
  ADD_BUTTON(gImp, 'Drop Random', () => impact.dropRandom());

  return panel;
}

function ADD_GROUP(parent: HTMLElement, title: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'margin-top:6px;';
  const hdr = document.createElement('div');
  hdr.textContent = title;
  hdr.style.cssText = 'font-weight:bold; color:#9cf; margin-bottom:2px;';
  wrap.appendChild(hdr);
  parent.appendChild(wrap);
  return wrap;
}

function ADD_SLIDER(parent: HTMLElement, label: string, min: number, max: number, step: number, initial: number, onChange: (v: number) => void): void {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex; align-items:center; gap:6px; margin-bottom:1px;';

  const lbl = document.createElement('span');
  lbl.textContent = label;
  lbl.style.cssText = 'flex:0 0 90px; font-size:10px;';

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(initial);
  input.style.cssText = 'flex:1 1 auto; min-width:0;';

  const val = document.createElement('span');
  val.textContent = initial.toFixed(3);
  val.style.cssText = 'flex:0 0 50px; font-size:10px; text-align:right;';

  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    val.textContent = v.toFixed(3);
    onChange(v);
  });

  row.appendChild(lbl);
  row.appendChild(input);
  row.appendChild(val);
  parent.appendChild(row);
}

function ADD_BUTTON(parent: HTMLElement, label: string, onClick: () => void): void {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = 'width:100%; margin-top:3px; padding:4px 6px; background:#234; color:#fff; border:1px solid #456; border-radius:3px; font-family:monospace; font-size:11px; cursor:pointer;';
  btn.addEventListener('mouseenter', () => { btn.style.background = '#345'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#234'; });
  btn.addEventListener('click', onClick);
  parent.appendChild(btn);
}
