import { Assets, Application, GraphicsContext, Container, Graphics, Text, Sprite } from 'pixi.js';
import gsap from 'gsap';

import { animateToPosition } from './utils/animations';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: '#0f010fff', antialias: true, resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load the image
  const foolTexture = await Assets.load('/assets/fool.png');
  const moonTexture = await Assets.load('/assets/moon.png');
  const justiceTexture = await Assets.load('/assets/justice.png');
  const wheelOfFortuneTexture = await Assets.load('/assets/wheeloffortune.png');
  const magicianTexture = await Assets.load('/assets/magician.png');
  const hermitTexture = await Assets.load('/assets/hermit.png');

  const backTexture = await Assets.load('/assets/back.png');

  // Create and add a container to the stage
  const container = new Container();

  app.stage.addChild(container);

  // Grid dimensions
  const gridWidth = 3;
  const spacingX = 18;
  const spacingY = 24;

  // Init card dimensions
  const cardHeight = 550;
  const cardWidth = 305;

  // the two next array could be merged
  const cardLabels = [
    'The Fool', 'The Hermit', 'The Moon', 'Justice', 'The Magician', 'Wheel of Fortune'
  ];

  const frontTexture = [
    foolTexture, hermitTexture, moonTexture, justiceTexture, magicianTexture, wheelOfFortuneTexture
  ]

  // Create a grid of cards in the container
  const cardContext = new GraphicsContext()
    .roundRect(0, 0, cardWidth, cardHeight, 16)
    .fill('#f2ebe2')
    .roundRect(10, 10, (cardWidth - 20), (cardHeight - 20), 10)
    .stroke({ color: 0x000000, width: 2, alpha: 1, alignment: 0.5 });

  const backContext = new GraphicsContext()
    .roundRect(0, 0, cardWidth, cardHeight, 16)
    .fill('#301934');

  const frontSpriteTemplate = new Sprite(backTexture);
  frontSpriteTemplate.anchor.set(0.5);
  frontSpriteTemplate.x = cardWidth / 2;
  frontSpriteTemplate.y = cardHeight / 2;

  const backSpriteTemplate = new Sprite(moonTexture);
  backSpriteTemplate.anchor.set(0.5);
  backSpriteTemplate.x = cardWidth / 2;
  backSpriteTemplate.y = cardHeight / 2;

  interface GridInfo {
    initialX: number;
    initialY: number;
  }

  const gridInfo: GridInfo[] = [];

  // store the cards in an array
  let cardsInfo: {
    card: Container;
    initialSlot: number;
    currentSlot: number;
    originalX: number;
    originalY: number;
    x: number;
    y: number;
    isDragging: boolean;
    isFlipped: boolean;
  }[] = [];

  for (let i = 0; i < cardLabels.length; i++) {
    const card = new Container();
    const front = new Graphics(cardContext);
    const back = new Graphics(backContext);

    const frontSprite = new Sprite(frontTexture[i]);
    frontSprite.anchor.set(0.5);
    frontSprite.x = cardWidth / 2;
    frontSprite.y = cardHeight / 2;
    front.addChild(frontSprite);

    const backSprite = new Sprite(backTexture);
    backSprite.anchor.set(0.5);
    backSprite.x = cardWidth / 2;
    backSprite.y = cardHeight / 2;
    back.addChild(backSprite);

    // Add to card container
    card.addChild(front);
    card.addChild(back);

    // Start with back hidden
    back.visible = false;

    // init variables for dragging logic
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // Create a mask for the card avoiding image overflow - this might not be necessary if the image is already sized correctly and we might want a slight underglow
    const mask = new Graphics();
    mask.roundRect(0, 0, cardWidth, cardHeight, 16);
    mask.fill(0xffffff);

    card.mask = mask;
    // there's a new way to do this in PixiJS v8,
    card.addChild(mask);

    const label = new Text({
      text: `${cardLabels[i]}`,
      // pure black is not ideal for readability
      style: { fontFamily: 'Cardo', fontSize: 32, fill: '#ffffff' }
    });

    // Center the label
    label.anchor.set(0.5);
    label.x = cardWidth / 2;
    label.y = cardHeight - 32;

    // Add the label to the card, this is deprecated in PixiJS v8, but still works, better fix this now
    front.addChild(label);

    // Position the card in the grid, calculating the column and row based on the index
    const col = i % gridWidth;
    const row = Math.floor(i / gridWidth);

    card.pivot.set(cardWidth / 2, cardHeight / 2);

    card.x = col * (cardWidth + spacingX) + cardWidth / 2;
    card.y = row * (cardHeight + spacingY) + cardHeight / 2;

    // Store the grid info for this card
    gridInfo.push({
      initialX: card.x,
      initialY: card.y
    });

    // store the card position
    cardsInfo.push({
      card,
      initialSlot: i,
      currentSlot: i,
      originalX: card.x,
      originalY: card.y,
      x: card.x,
      y: card.y,
      isDragging: false,
      isFlipped: false,
    })

    // Allow the card to be interactive
    card.eventMode = 'static';
    card.cursor = 'pointer';

    // Set the initial scale
    let targetScale = 1;

    // Add pointer events for hover
    card.on('pointerover', () => {
      targetScale = 1.035;
      card.zIndex = 2;

      // Animate scale and subtle rotation for 3D effect
      gsap.to(card.scale, {
        x: targetScale,
        y: targetScale,
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(card, {
        rotation: (Math.random() - 0.5) * 0.1,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    card.on('pointerout', () => {
      targetScale = 1;
      card.zIndex = 1;

      // Animate back to normal
      gsap.to(card.scale, {
        x: targetScale,
        y: targetScale,
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(card, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    // Add click event to skew the card and show the backside
    card.on('pointertap', () => {
      const info = cardsInfo.find(ci => ci.card === card);
      if (!info) return;

      gsap.to(card.scale, {
        x: 0,
        duration: 0.15,
        onComplete: () => {
          info.isFlipped = !info.isFlipped;
          front.visible = !info.isFlipped;
          back.visible = info.isFlipped;

          gsap.to(card.scale, { x: 1, duration: 0.15 });

        },
      });
    });

    // dragging logic
    card.on('pointerdown', (event) => {
      dragging = true;
      const pos = event.getLocalPosition(card.parent);
      dragStartX = pos.x - card.x;
      dragStartY = pos.y - card.y;

      // Bring to front
      container.setChildIndex(card, container.children.length - 1);
    });

    card.on('pointermove', (event) => {
      if (!dragging) return;
      const pos = event.getLocalPosition(card.parent);
      card.x = pos.x - dragStartX;
      card.y = pos.y - dragStartY;
    });

    // End dragging logic
    function endDrag(card: Container) {
      dragging = false;

      const draggedInfo = cardsInfo.find(info => info.card === card);
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

          // Animate cards to each other's slot positions
          animateToPosition(draggedInfo.card, gridInfo[otherSlot].initialX, gridInfo[otherSlot].initialY, 300);
          animateToPosition(otherInfo.card, gridInfo[draggedSlot].initialX, gridInfo[draggedSlot].initialY, 300);

          // Swap their slot tracking
          draggedInfo.currentSlot = otherSlot;
          otherInfo.currentSlot = draggedSlot;

          swapped = true;
          break;
        }
      }

      // No nearby card: snap back to original position
      if (!swapped) {
        const info = cardsInfo.find(info => info.card === card);
        if (info) {
          const slot = info.currentSlot;
          const { initialX, initialY } = gridInfo[slot];
          animateToPosition(card, initialX, initialY, 300);
        }
      }
    }

    card.on('pointerup', () => endDrag(card));
    card.on('pointerupoutside', () => endDrag(card));

    container.addChild(card);
  }

  // Get real bounds of container
  const bounds = container.getLocalBounds();

  // Center based on those bounds
  container.pivot.set(bounds.width / 2, bounds.height / 2);
  container.position.set(app.screen.width / 2, app.screen.height / 2);

})();
