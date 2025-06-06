import k from "../kaplayCtx";
import gameManager from "../gameManager";

export default function makeDog(position) {
  const sniffingSound = k.play("sniffing", { volume: 2 });
  sniffingSound.stop();

  const barkingSound = k.play("barking");
  barkingSound.stop();

  const laughingSound = k.play("laughing");
  laughingSound.stop();

  return k.add([
    k.sprite("dog"),
    k.pos(position),
    k.state("search", ["search", "snif", "detect", "jump", "drop"]),
    k.z(2),
    {
      speed: 15,
      searchForDucks() {
        let nbSnifs = 0;

        this.onStateEnter("search", () => {
          this.play("search");
          k.wait(2, () => {
            this.enterState("snif");
          });
        });

        this.onStateUpdate("search", () => {
          this.move(this.speed, 0);
        });

        this.onStateEnter("snif", () => {
          nbSnifs++;
          this.play("snif");
          sniffingSound.play();
          k.wait(2, () => {
            sniffingSound.stop();
            if (nbSnifs === 2) {
              this.enterState("detect");
              return;
            }
            this.enterState("search");
          });
        });

        this.onStateEnter("detect", () => {
          barkingSound.play();
          this.play("detect");
          k.wait(1, () => {
            barkingSound.stop();
            this.enterState("jump");
          });
        });

        this.onStateEnter("jump", () => {
          barkingSound.play();
          this.play("jump");
          k.wait(0.5, () => {
            barkingSound.stop();
            this.use(k.z(0));
            this.enterState("drop");
          });
        });

        this.onStateUpdate("jump", () => {
          this.move(100, -50);
        });

        this.onStateEnter("drop", async () => {
          await k.tween(
            this.pos.y,
            125,
            0.5,
            (newY) => (this.pos.y = newY),
            k.easings.linear
          );
          gameManager.enterState("round-start", true);
        });
      },
      async slideUpAndDown() {
        await k.tween(
          this.pos.y,
          90,
          0.4,
          (newY) => (this.pos.y = newY),
          k.easings.linear
        );
        await k.wait(1);
        await k.tween(
          this.pos.y,
          125,
          0.4,
          (newY) => (this.pos.y = newY),
          k.easings.linear
        );
      },
      async catchFallenDuck() {
        this.play("catch");
        k.play("successful-hunt");
        await this.slideUpAndDown();
        gameManager.enterState("hunt-end");
      },

      async mockPlayer() {
        laughingSound.play();
        this.play("mock");
        await this.slideUpAndDown();
        gameManager.enterState("hunt-end");
      },
    },
  ]);
}
