import { Graphics, Texture } from "pixi.js";

// Set Background gradient
export function createRadialGradientTexture(
  width: number,
  height: number,
): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(width, height) / 2;

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius,
  );
  gradient.addColorStop(0, "#55305eff"); // Center color
  gradient.addColorStop(1, "#120110ff"); // Outer color

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return Texture.from(canvas);
}

// Set Stars
export function createStarField(
  numStars: number,
  width: number,
  height: number,
): Graphics {
  const graphics = new Graphics();

  for (let i = 0; i < numStars; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.5 + 0.5;

    graphics
      .fill({ color: 0xffffff, alpha: Math.random() })
      .circle(x, y, radius);
  }

  return graphics;
}
