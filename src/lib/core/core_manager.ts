import { eventManager } from './event_manager';

enum SizeMode {
  FIT = 0, // Fit the page with scale/distortion
  ADJUST = 1, // Fit the page without distortion (with borders)
  FIXED = 2, // Fixed size without scale/distortion
  FULL = 3 // Full page
};

/**
 * Singleton core manager.
 * Used to set the size and resolution of the top-level container.
 * It emit 'E_RESIZE'
 */
class CoreManager {
  container: HTMLElement;
  resWidth: number;
  resHeight: number;
  sizeMode: SizeMode;

  constructor() {
    this.container = document.getElementById('APP')!;

    if (!this.container) {
      throw new Error('Application::Application: APP element not found !');
    }

    this.resWidth = this.container.clientWidth;
    this.resHeight = this.container.clientHeight;
    this.sizeMode = SizeMode.FIXED;
    window.addEventListener('resize', () => eventManager.emit(this, 'E_RESIZE'));
  }

  /**
   * Set the size strategy of the container. It emit a 'E_RESIZE' event.
   * 
   * @param {number} resWidth - The width of the container in pixels.
   * @param {number} resHeight - The height of the container in pixels.
   * @param sizeMode - Determines how the container fit the browser window (in some cases, there is desynchro between container size and resolution size).
   */
  setSize(resWidth: number, resHeight: number, sizeMode = SizeMode.FIXED): void {
    this.container.style.width = resWidth + 'px';
    this.container.style.height = resHeight + 'px';

    if (sizeMode == SizeMode.FIT) {
      this.container.style.transform = 'scale(' + window.innerWidth / resWidth + ',' + window.innerHeight / resHeight + ')';
      this.container.style.margin = '0';
    }
    else if (sizeMode == SizeMode.ADJUST) {
      this.container.style.transform = 'scale(' + Math.min(window.innerWidth / resWidth, window.innerHeight / resHeight) + ')';
      this.container.style.margin = '0';
    }
    else if (sizeMode == SizeMode.FIXED) {
      this.container.style.transform = 'none';
      this.container.style.margin = '0 auto';
    }
    else if (sizeMode == SizeMode.FULL) {
      this.container.style.width = '100vw';
      this.container.style.height = '100vh';
      this.container.style.margin = '0';
    }

    this.resWidth = resWidth;
    this.resHeight = resHeight;
    this.sizeMode = sizeMode;

    eventManager.emit(this, 'E_RESIZE');
  }

  /**
   * Returns the client-width and client-height of the container element.
   */
  getSize(): vec2 {
    return [
      this.container.clientWidth,
      this.container.clientHeight
    ];
  }

  /**
   * Returns the client-width of the container element.
   */
  getWidth(): number {
    return this.container.clientWidth;
  }

  /**
   * Returns the half client-width of the container element.
   */
  getHalfWidth(): number {
    return this.container.clientWidth / 2;
  }

  /**
   * Returns the client-height of the container element.
   */
  getHeight(): number {
    return this.container.clientHeight;
  }

  /**
   * Returns the half client-height of the container element.
   */
  getHalfHeight(): number {
    return this.container.clientHeight / 2;
  }

  /**
   * Returns the resolution size.
   */
  getResolution(): vec2 {
    return [
      this.resWidth,
      this.resHeight
    ];
  }

  /*
   * Return container-space position with origin to center from client-space position.
   * Return Infinity if client coords is out of container.
   */
  getContainerPosFromDocument(clientX: number, clientY: number): vec2 {
    const rect = this.container.getBoundingClientRect();
    const leftR = clientX - rect.left;
    const topR = clientY - rect.top;
    if (leftR < 0 || leftR > this.container.clientWidth || topR < 0 || topR > this.container.clientHeight) {
      return [Infinity, Infinity];
    }

    const x = leftR - (this.container.clientWidth / 2);
    const y = topR - (this.container.clientHeight / 2);
    return [x, y];
  }

  /*
   * Return container-space position normalized between [-1, +1] with origin to center from client-space position.
   * Return Infinity if client coords is out of container.
   */
  getContainerNormalizedPosFromDocument(clientX: number, clientY: number): vec2 {
    const [x, y] = this.getContainerPosFromDocument(clientX, clientY);
    return [
      x / (this.container.clientWidth / 2),
      y / (this.container.clientHeight / 2)
    ];
  }

  /**
   * Returns the resolution width.
   */
  getResWidth(): number {
    return this.resWidth;
  }

  /**
   * Returns the resolution height.
   */
  getResHeight(): number {
    return this.resHeight;
  }

  /**
   * Returns the size mode.
   */
  getSizeMove(): SizeMode {
    return this.sizeMode;
  }

  /**
   * Adds a class to the container element.
   * 
   * @param {string} className - The class name.
   */
  addClass(className: string): void {
    this.container.classList.add(className);
  }

  /**
   * Removes a class from the container element.
   * 
   * @param {string} className - The class name.
   */
  removeClass(className: string): void {
    this.container.classList.remove(className);
  }

  /**
   * Toggles the presence of a class on the container element.
   * 
   * @param {string} className - The class name.
   */
  toggleClass(className: string): void {
    this.container.classList.toggle(className);
  }

  /**
   * Enable scanlines.
   * 
   * @param {boolean} enabled - Indicating whether scanlines should be enabled or disable.
   */
  enableScanlines(enabled: boolean): void {
    this.container.classList.toggle('scanlines', enabled);
  }
}

const coreManager = new CoreManager();
export { CoreManager };
export { coreManager, SizeMode };
