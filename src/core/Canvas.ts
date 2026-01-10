import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

export class Canvas {
  public readonly element: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  private readonly container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    
    this.element = document.createElement('canvas');
    this.element.width = CANVAS_WIDTH;
    this.element.height = CANVAS_HEIGHT;
    
    const ctx = this.element.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    
    this.container.appendChild(this.element);
    this.resize();

    window.addEventListener('resize', this.resize);
  }

  private resize = (): void => {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    const scaleX = containerWidth / CANVAS_WIDTH;
    const scaleY = containerHeight / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    this.element.style.width = `${CANVAS_WIDTH * scale}px`;
    this.element.style.height = `${CANVAS_HEIGHT * scale}px`;
  };

  clear(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  destroy(): void {
    window.removeEventListener('resize', this.resize);
    this.element.remove();
  }

  get width(): number {
    return CANVAS_WIDTH;
  }

  get height(): number {
    return CANVAS_HEIGHT;
  }
}
