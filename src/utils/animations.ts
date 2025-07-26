import type { Container } from "pixi.js";
import gsap from "gsap";

export function animateToPosition(
  sprite: Container,
  targetX: number,
  targetY: number,
  baseDuration: number = 300,
  minDuration: number = 200,
  maxDuration: number = 1000,
): void {
  // Calculate distance
  const dx = targetX - sprite.x;
  const dy = targetY - sprite.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Scale duration based on distance (you can adjust these values)
  const maxDistance = 1000;
  const durationScale = Math.min(distance / maxDistance, 1);
  const adjustedDuration = Math.max(
    minDuration,
    Math.min(maxDuration, baseDuration * durationScale),
  );

  gsap.to(sprite, {
    x: targetX,
    y: targetY,
    duration: adjustedDuration / 1000,
    ease: "power2.out",
  });
}
