import { loadAssets } from "./assetLoader";
import { COLORS } from "./constants";
import makeDog from "./entities/dog";
import Duck from "./entities/duck";
import k from "./kaplayCtx";
import gameManager from "./gameManager";
import formatScore from "./utils";

loadAssets();

k.scene("main-menu", () => {
  k.add([k.sprite("menu")]);

  k.add([
    k.text("CLICK TO START", { font: "nes", size: 8 }),
    k.anchor("center"),
    k.pos(k.center().x, k.center().y + 40),
  ]);

  k.add([
    k.text("MADE BY JSLEGEND", { font: "nes", size: 8 }),
    k.z(2),
    k.pos(10, 215),
    k.color(COLORS.BLUE),
    k.opacity(0.5),
  ]);

  let bestScore = k.getData("best-score");
  if (!bestScore) {
    bestScore = 0;
    k.setData("best-score", 0);
  }
  k.add([
    k.text(formatScore(bestScore, 6), { font: "nes", size: 8 }),
    k.pos(150, 184),
    k.color(COLORS.RED),
  ]);

  k.onClick(() => {
    k.go("game");
  });
});

k.scene("game", () => {
  k.setCursor("none");
  k.add([k.rect(k.width(), k.height()), k.color(COLORS.BLUE), "sky"]);
  k.add([k.sprite("background"), k.pos(0, -10), k.z(1)]);

  const score = k.add([
    k.text(formatScore(0, 6), { font: "nes", size: 8 }),
    k.pos(192, 197),
    k.z(2),
  ]);

  const roundCount = k.add([
    k.text("1", { font: "nes", size: 8 }),
    k.pos(42, 182),
    k.z(2),
    k.color(COLORS.RED),
  ]);

  const duckIcons = k.add([k.pos(95, 198)]);
  let duckIconPosX = 1;
  for (let i = 0; i < 10; i++) {
    duckIcons.add([k.rect(7, 9), k.pos(duckIconPosX, 0), `duckIcon-${i}`]);
    duckIconPosX += 8;
  }

  const bulletUIMask = k.add([
    k.rect(0, 8),
    k.pos(25, 198),
    k.z(2),
    k.color(0, 0, 0),
  ]);

  const dog = makeDog(k.vec2(0, k.center().y));
  dog.searchForDucks();

  const roundStartController = gameManager.stateMachine.onStateEnter(
    "round-start",
    async (isFirstRound) => {
      if (!isFirstRound) gameManager.preySpeed += 50;
      k.play("ui-appear");
      gameManager.currentRoundNb++;
      roundCount.text = gameManager.currentRoundNb;
      const textBox = k.add([
        k.sprite("text-box"),
        k.anchor("center"),
        k.pos(k.center().x, k.center().y - 50),
        k.z(2),
      ]);
      textBox.add([
        k.text("ROUND", { font: "nes", size: 8 }),
        k.anchor("center"),
        k.pos(0, -10),
      ]);
      textBox.add([
        k.text(gameManager.currentRoundNb, { font: "nes", size: 8 }),
        k.anchor("center"),
        k.pos(0, 4),
      ]);

      await k.wait(1);
      k.destroy(textBox);
      gameManager.stateMachine.enterState("hunt-start");
    }
  );

  const roundEndController = gameManager.stateMachine.onStateEnter(
    "round-end",
    () => {
      if (gameManager.nbDucksShotInRound < 6) {
        k.go("game-over");
        return;
      }

      if (gameManager.nbDucksShotInRound === 10) {
        gameManager.currentScore += 500;
      }

      gameManager.nbDucksShotInRound = 0;
      for (const duckIcon of duckIcons.children) {
        duckIcon.color = k.color(255, 255, 255);
      }
      gameManager.stateMachine.enterState("round-start");
    }
  );

  const huntStartController = gameManager.stateMachine.onStateEnter(
    "hunt-start",
    () => {
      gameManager.currentHuntNb++;
      const duck = new Duck(
        gameManager.currentHuntNb - 1,
        gameManager.preySpeed
      );
      duck.setBehavior();
    }
  );

  const huntEndController = gameManager.stateMachine.onStateEnter(
    "hunt-end",
    () => {
      const bestScore = Number(k.getData("best-score"));

      if (bestScore < gameManager.currentScore) {
        k.setData("best-score", gameManager.currentScore);
      }

      if (gameManager.currentHuntNb <= 9) {
        gameManager.stateMachine.enterState("hunt-start");
        return;
      }

      gameManager.currentHuntNb = 0;
      gameManager.stateMachine.enterState("round-end");
    }
  );

  const duckHunterController = gameManager.stateMachine.onStateEnter(
    "duck-hunted",
    () => {
      gameManager.nbBulletsLeft = 3;
      dog.catchFallenDuck();
    }
  );

  const duckEscapedController = gameManager.stateMachine.onStateEnter(
    "duck-escaped",
    async () => {
      dog.mockPlayer();
    }
  );

  const cursor = k.add([
    k.sprite("cursor"),
    k.anchor("center"),
    k.pos(),
    k.z(3),
  ]);
  k.onClick(() => {
    if (
      gameManager.stateMachine.state === "hunt-start" &&
      !gameManager.isGamePaused
    ) {
      // Note : we need to allow nbBulletsLeft to go below zero
      // so that if cursor overlaps with duck, the duck shot logic
      // will work. Otherwise, the onClick in the Duck class will
      // never register a successful hit because the nbBulletsLeft goes
      // to zero before that onClick runs. Look at a Duck class and you'll understand.
      if (gameManager.nbBulletsLeft > 0) k.play("gun-shot", { volume: 0.5 });
      gameManager.nbBulletsLeft--;
    }
  });

  k.onUpdate(() => {
    score.text = formatScore(gameManager.currentScore, 6);
    switch (gameManager.nbBulletsLeft) {
      case 3:
        bulletUIMask.width = 0;
        break;
      case 2:
        bulletUIMask.width = 8;
        break;
      case 1:
        bulletUIMask.width = 15;
        break;
      default:
        bulletUIMask.width = 22;
    }
    cursor.moveTo(k.mousePos());
  });

  const forestAmbianceSound = k.play("forest-ambiance", {
    volume: 0.1,
    loop: true,
  });
  k.onSceneLeave(() => {
    forestAmbianceSound.stop();
    roundStartController.cancel();
    roundEndController.cancel();
    huntStartController.cancel();
    huntEndController.cancel();
    duckHunterController.cancel();
    duckEscapedController.cancel();
    gameManager.initializeGameState();
  });

  k.onKeyPress((key) => {
    if (key === "p") {
      k.getTreeRoot().paused = !k.getTreeRoot().paused;
      if (k.getTreeRoot().paused) {
        gameManager.isGamePaused = true;
        audioCtx.suspend();
        k.add([
          k.text("PAUSED", { font: "nes", size: 8 }),
          k.pos(5, 5),
          k.z(3),
          "paused-text",
        ]);
      } else {
        gameManager.isGamePaused = false;
        audioCtx.resume();

        const pausedText = k.get("paused-text")[0];
        if (pausedText) k.destroy(pausedText);
      }
    }
  });
});

k.scene("game-over", () => {
  k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0)]);
  k.add([
    k.text("GAME OVER!", { font: "nes", size: 8 }),
    k.anchor("center"),
    k.pos(k.center()),
  ]);

  k.wait(2, () => {
    k.go("main-menu");
  });
});

k.go("main-menu");
