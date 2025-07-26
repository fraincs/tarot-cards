import {
  Assets,
  Application,
  Container,
  Graphics,
  GraphicsContext,
  Sprite,
  Text,
} from "pixi.js";

import gsap from "gsap";

import { animateToPosition } from "./utils/animations";
import { getRandomNumber } from "./utils/randnumber";
import {
  createRadialGradientTexture,
  createStarField,
} from "./utils/backgrounds";

(async () => {
  const app = new Application();

  await app.init({
    background: "#0f010fff",
    antialias: true,
    resizeTo: window,
  });
  app.resizeTo = window;

  document.body.appendChild(app.canvas);

  // Load images
  const foolTexture = await Assets.load("/assets/main/fool.png");
  const moonTexture = await Assets.load("/assets/main/moon.png");
  const justiceTexture = await Assets.load("/assets/main/justice.png");
  const wheelOfFortuneTexture = await Assets.load(
    "/assets/main/wheeloffortune.png",
  );
  const magicianTexture = await Assets.load("/assets/main/magician.png");
  const hermitTexture = await Assets.load("/assets/main/hermit.png");

  const backTexture = await Assets.load("/assets/main/back.png");
  const backTextureRare = await Assets.load("/assets/main/back-alternate.png");

  const starField = createStarField(200, window.innerWidth, window.innerHeight);

  // Create and add a container to the stage
  const container = new Container();
  const backgroundContainer = new Container();
  const bgTexture = createRadialGradientTexture(
    window.innerWidth,
    window.innerHeight,
  );
  const bgSprite = new Sprite(bgTexture);
  backgroundContainer.addChild(bgSprite);

  app.stage.addChild(backgroundContainer);
  backgroundContainer.addChild(starField);
  app.stage.addChild(container);

  // SETUP
  // Grid dimensions
  const gridWidth = 3;
  const spacingX = 18;
  const spacingY = 24;

  // Init card dimensions
  const cardHeight = 550;
  const cardWidth = 305;

  const cards = [
    { label: "The Fool", texture: foolTexture },
    { label: "The Hermit", texture: hermitTexture },
    { label: "The Moon", texture: moonTexture },
    { label: "Justice", texture: justiceTexture },
    { label: "The Magician", texture: magicianTexture },
    { label: "Wheel of Fortune", texture: wheelOfFortuneTexture },
  ];

  // Create a grid of cards in the container
  const frontContext = new GraphicsContext()
    .roundRect(0, 0, cardWidth, cardHeight, 16)
    .fill("#f2ebe2")
    .roundRect(10, 10, cardWidth - 20, cardHeight - 20, 10)
    .stroke({ color: 0x000000, width: 2, alpha: 1, alignment: 0.5 });

  const backContext = new GraphicsContext()
    .roundRect(0, 0, cardWidth, cardHeight, 16)
    .fill("#301934");

  interface GridInfo {
    initialX: number;
    initialY: number;
  }

  interface CardInfo {
    card: Container;
    initialSlot: number;
    currentSlot: number;
    originalX: number;
    originalY: number;
    isDragging: boolean;
    dragStartX: number;
    dragStartY: number;
    isFlipped: boolean;
  }

  const gridInfo: GridInfo[] = [];
  const cardsInfo: CardInfo[] = [];

  for (let i = 0; i < cards.length; i++) {
    const { texture, label: cardLabel } = cards[i];

    const card = new Container();
    const frontWrapper = new Container();
    const front = new Graphics(frontContext);

    const frontSprite = new Sprite(texture);
    frontSprite.anchor.set(0);
    frontSprite.x = 11;
    frontSprite.y = 11;

    frontWrapper.addChild(front);
    frontWrapper.addChild(frontSprite);

    // Randomize backside
    let backTextureImg = backTexture;
    const randBackNumber = getRandomNumber(1, 200);
    if (randBackNumber === 200) {
      backTextureImg = backTextureRare;
    }

    const backWrapper = new Container();
    const back = new Graphics(backContext);
    const backSprite = new Sprite(backTextureImg);

    backSprite.anchor.set(0.5);
    backSprite.x = cardWidth / 2;
    backSprite.y = cardHeight / 2;

    backWrapper.addChild(back);
    backWrapper.addChild(backSprite);

    card.addChild(frontWrapper);
    card.addChild(backWrapper);

    backWrapper.visible = false;

    // Create a mask for the card avoiding image overflow - useful for the back card
    const mask = new Graphics();
    mask.roundRect(0, 0, cardWidth, cardHeight, 16);
    mask.fill(0xffffff);

    card.mask = mask;
    card.addChild(mask);

    // Mask the front top image
    const frontMask = new Graphics();
    // 14px is used to simulate common printing errors in print offset
    frontMask.roundRect(11, 11, cardWidth - 22, cardHeight - 22, 14);
    frontMask.fill(0xffffff);

    frontSprite.mask = frontMask;

    // Add the card name
    frontWrapper.addChild(frontMask);
    const label = new Text({
      text: cardLabel,
      rotation: (Math.random() - 0.5) * 0.0025,
      style: { fontFamily: "Cardo", fontSize: 32, fill: "#111222" },
    });

    // Center the label
    label.anchor.set(0.5);
    label.x = cardWidth / 2;
    label.y = cardHeight - 32;

    // Add the label to the card, this is deprecated in PixiJS v8, but still works, better fix this now
    frontWrapper.addChild(label);

    const border = new Graphics();
    border.rect(11, 11 + frontSprite.height - 2, cardWidth - 22, 2);
    border.fill(0x111222); // or whatever color you want
    frontWrapper.addChild(border);

    // Position the card in the grid, calculating the column and row based on the index
    const col = i % gridWidth;
    const row = Math.floor(i / gridWidth);

    card.pivot.set(cardWidth / 2, cardHeight / 2);

    card.x = col * (cardWidth + spacingX) + cardWidth / 2;
    card.y = row * (cardHeight + spacingY) + cardHeight / 2;

    // Store the grid info for this card
    gridInfo.push({
      initialX: card.x,
      initialY: card.y,
    });

    // store the card position
    cardsInfo.push({
      card,
      initialSlot: i,
      currentSlot: i,
      originalX: card.x,
      originalY: card.y,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      isFlipped: false,
    });

    // Allow the card to be interactive
    card.eventMode = "static";
    card.cursor = "pointer";

    // Set the initial scale
    let targetScale = 1;

    // Add pointer events for hover
    card.on("pointerover", () => {
      targetScale = 1.035;
      card.zIndex = 2;

      // Animate scale and subtle rotation for 3D effect
      gsap.to(card.scale, {
        x: targetScale,
        y: targetScale,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(card, {
        rotation: (Math.random() - 0.5) * 0.1,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    card.on("pointerout", () => {
      targetScale = 1;
      card.zIndex = 1;

      // Animate back to normal
      gsap.to(card.scale, {
        x: targetScale,
        y: targetScale,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(card, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });

    card.on("pointertap", () => {
      const info = cardsInfo[i];

      if (!info.isDragging) {
        gsap.to(card.scale, {
          x: 0,
          duration: 0.15,
          onComplete: () => {
            info.isFlipped = !info.isFlipped;
            frontWrapper.visible = !info.isFlipped;
            backWrapper.visible = info.isFlipped;

            gsap.to(card.scale, { x: 1, duration: 0.15 });
          },
        });
      }
    });

    // dragging logic
    card.on("pointerdown", (event) => {
      const localPos = container.toLocal(event.global);

      const info = cardsInfo[i];
      info.dragStartX = localPos.x - card.x;
      info.dragStartY = localPos.y - card.y;
      info.isDragging = false;

      container.setChildIndex(card, container.children.length - 1);
    });

    card.on("pointermove", (event) => {
      if (event.buttons === 0) return;

      const localPos = container.toLocal(event.global);
      const info = cardsInfo[i];

      const newCardX = localPos.x - info.dragStartX;
      const newCardY = localPos.y - info.dragStartY;
      const dx = newCardX - info.originalX;
      const dy = newCardY - info.originalY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // move the card even if we won"t trigger a drag
      card.x = newCardX;
      card.y = newCardY;

      // if card move more than 12px set dragging to true, this will prevent the flip
      if (distance > 12) {
        info.isDragging = true;
        gsap.to(card, {
          alpha: 0.8,
          duration: 0.2,
          ease: "power2.out",
        });
        gsap.to(card.scale, { x: 0.95, y: 0.95, duration: 0.3 });
      }
    });

    // End dragging logic
    function endDrag(card: Container) {
      const draggedInfo = cardsInfo.find((info) => info.card === card);
      if (!draggedInfo) return;

      let swapped = false;

      for (const otherInfo of cardsInfo) {
        if (otherInfo.card === card) continue;
        const dx = card.x - otherInfo.card.x;
        const dy = card.y - otherInfo.card.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 125) {
          const draggedSlot = draggedInfo.currentSlot;
          const otherSlot = otherInfo.currentSlot;

          // Animate cards to each other"s slot positions
          animateToPosition(
            draggedInfo.card,
            gridInfo[otherSlot].initialX,
            gridInfo[otherSlot].initialY,
            300,
          );
          animateToPosition(
            otherInfo.card,
            gridInfo[draggedSlot].initialX,
            gridInfo[draggedSlot].initialY,
            300,
          );

          // Swap their slot tracking
          draggedInfo.currentSlot = otherSlot;
          otherInfo.currentSlot = draggedSlot;

          swapped = true;
          break;
        }
      }

      // No nearby cards snap back to original position
      if (!swapped) {
        const slot = draggedInfo.currentSlot;
        const { initialX, initialY } = gridInfo[slot];
        animateToPosition(card, initialX, initialY, 300);
      }

      // reset isDragging / wait to prevent false positives
      setTimeout(() => {
        draggedInfo.isDragging = false;
        gsap.to(card, {
          alpha: 1,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(card.scale, { x: 1, y: 1, duration: 0.3 });
      }, 5);
    }

    card.on("pointerup", () => {
      endDrag(card);
    });

    card.on("pointerupoutside", () => {
      endDrag(card);
    });

    container.addChild(card);
    recenterContainer();
  }

  function recenterContainer() {
    const bounds = container.getLocalBounds();
    container.pivot.set(bounds.width / 2, bounds.height / 2);
    container.position.set(app.screen.width / 2, app.screen.height / 2);
  }

  function regenerateBackground(width: number, height: number) {
    const newTexture = createRadialGradientTexture(width, height);
    bgSprite.texture = newTexture;
    bgSprite.width = width;
    bgSprite.height = height;

    app.renderer.resize(width, height);
  }

  window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    app.resize();
    recenterContainer();
    regenerateBackground(width, height);
  });
})();
