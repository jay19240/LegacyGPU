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
import { Gfx3WaterParam } from '@lib/gfx3_water/gfx3_water_shader';
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
    await this.water.loadFromFile('./Water.jwa');
    this.water.setEnvMap(await gfx3TextureManager.loadCubemapTexture({
      right: './examples/viewer/skybox/sky_right.png',
      left: './examples/viewer/skybox/sky_left.png',
      top: './examples/viewer/skybox/sky_top.png',
      bottom: './examples/viewer/skybox/sky_bottom.png',
      front: './examples/viewer/skybox/sky_front.png',
      back: './examples/viewer/skybox/sky_back.png'
    }));
    this.water.setNormalMap(await gfx3TextureManager.loadTexture('./textures/waternormals.jpg', { addressModeU: 'repeat', addressModeV: 'repeat' }));

    gfx3MeshRenderer.setDirLight(true, [0, -1, -0.3], [1, 1, 1], [0.2, 0.25, 0.3]);

    const infobox = CREATE_UI_INFOBOX();
    uiManager.addNode(infobox, 'position:absolute; bottom:10px; right:10px');
    this.infobox = infobox;
    const tweakPanel = CREATE_UI_TWEAK_PANEL(this.water, {
      getStrength: () => this.impactStrength,
      setStrength: (v: number) => { this.impactStrength = v; },
      getRadius: () => this.impactRadius,
      setRadius: (v: number) => { this.impactRadius = v; },
      getLifetime: () => this.impactLifetime,
      setLifetime: (v: number) => { this.impactLifetime = v; },
      dropRandom: () => this.dropRandomImpact()
    });
    uiManager.addNode(tweakPanel, 'position:absolute; top:10px; left:10px');
    this.tweakPanel = tweakPanel;
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
  const panel = document.createElement('div');
  panel.style.cssText = 'background:rgba(0,0,0,0.55); padding:8px 10px; color:#fff; font-family:monospace; font-size:11px; backdrop-filter:blur(4px); width:320px; max-height:90vh; overflow-y:auto; border-radius:4px;';

  const title = document.createElement('div');
  title.textContent = 'Water Tweaks';
  title.style.cssText = 'font-weight:bold; font-size:13px; margin-bottom:6px; padding-bottom:4px; border-bottom:1px solid #555;';
  panel.appendChild(title);

  const bind = (key: number, min: number, max: number, step: number, label: string, group: HTMLElement) => {
    ADD_SLIDER(group, label, min, max, step, water.getParam(key), v => water.setParam(key, v));
  };

  const gWave = ADD_GROUP(panel, 'Wave (Perlin)');
  bind(Gfx3WaterParam.WAVE_AMPLITUDE, 0, 1.5, 0.01, 'amplitude', gWave);
  bind(Gfx3WaterParam.WAVE_SCALE, 0.01, 1.0, 0.005, 'scale', gWave);
  bind(Gfx3WaterParam.WAVE_SPEED, 0, 2, 0.01, 'speed', gWave);
  bind(Gfx3WaterParam.WAVE_CHOPPINESS, 1, 4, 0.05, 'choppiness', gWave);
  bind(Gfx3WaterParam.WAVE_STEP_X, 0.05, 5, 0.05, 'stepX', gWave);
  bind(Gfx3WaterParam.WAVE_STEP_Z, 0.05, 5, 0.05, 'stepZ', gWave);

  const gNormal = ADD_GROUP(panel, 'Normal Map');
  bind(Gfx3WaterParam.NORMAL_MAP_ENABLED, 0, 1, 1, 'enabled', gNormal);
  bind(Gfx3WaterParam.NORMAL_MAP_SCROLL_X, -0.2, 0.2, 0.005, 'scrollX', gNormal);
  bind(Gfx3WaterParam.NORMAL_MAP_SCROLL_Y, -0.2, 0.2, 0.005, 'scrollY', gNormal);
  bind(Gfx3WaterParam.NORMAL_MAP_INTENSITY, 0, 2, 0.01, 'intensity', gNormal);
  bind(Gfx3WaterParam.NORMAL_MAP_SCALE, 0.1, 30, 0.1, 'scale', gNormal);

  const gSurf = ADD_GROUP(panel, 'Surface');
  bind(Gfx3WaterParam.SURFACE_COLOR_ENABLED, 0, 1, 1, 'enabled', gSurf);
  bind(Gfx3WaterParam.SURFACE_COLOR_R, 0, 1, 0.01, 'red', gSurf);
  bind(Gfx3WaterParam.SURFACE_COLOR_G, 0, 1, 0.01, 'green', gSurf);
  bind(Gfx3WaterParam.SURFACE_COLOR_B, 0, 1, 0.01, 'blue', gSurf);
  bind(Gfx3WaterParam.SURFACE_COLOR_FACTOR, 0, 1, 0.01, 'opacity', gSurf);

  const gOpt = ADD_GROUP(panel, 'Optics');
  bind(Gfx3WaterParam.OPTICS_ENV_MAP_ENABLED, 0, 1, 1, 'envEnabled', gOpt);
  bind(Gfx3WaterParam.OPTICS_ENV_INTENSITY, 0, 3, 0.01, 'envIntensity', gOpt);
  bind(Gfx3WaterParam.OPTICS_FRESNEL_POWER, 0.1, 10, 0.1, 'fresnelPower', gOpt);
  bind(Gfx3WaterParam.OPTICS_FRESNEL_BIAS, 0, 1, 0.01, 'reflectivity', gOpt);

  const gSun = ADD_GROUP(panel, 'Sun');
  bind(Gfx3WaterParam.SUN_ENABLED, 0, 1, 1, 'enabled', gSun);
  bind(Gfx3WaterParam.SUN_DIRECTION_X, -1, 1, 0.05, 'dirX', gSun);
  bind(Gfx3WaterParam.SUN_DIRECTION_Y, -1, 1, 0.05, 'dirY', gSun);
  bind(Gfx3WaterParam.SUN_DIRECTION_Z, -1, 1, 0.05, 'dirZ', gSun);
  bind(Gfx3WaterParam.SUN_SPECULAR_POWER, 1, 500, 1, 'specPower', gSun);

  const gSunCol = ADD_GROUP(panel, 'Sun Color');
  bind(Gfx3WaterParam.SUN_COLOR_R, 0, 1, 0.01, 'red', gSunCol);
  bind(Gfx3WaterParam.SUN_COLOR_G, 0, 1, 0.01, 'green', gSunCol);
  bind(Gfx3WaterParam.SUN_COLOR_B, 0, 1, 0.01, 'blue', gSunCol);
  bind(Gfx3WaterParam.SUN_COLOR_FACTOR, 0, 5, 0.05, 'intensity', gSunCol);

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
