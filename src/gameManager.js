import k from "./kaplayCtx";

function makeGameManager() {
  return k.add([
    k.state("menu", [
      "menu",
      "cutscene",
      "round-start",
      "round-end",
      "hunt-start",
      "hunt-end",
      "duck-hunted",
      "duck-escaped",
    ]),
    {
      isGamePaused: false,
      currentScore: 0,
      currentRoundNb: 0,
      currentHuntNb: 0,
      nbBulletsLeft: 3,
      nbDucksShotInRound: 0,
      preySpeed: 100,
      resetGameState() {
        this.currentScore = 0;
        this.currentRoundNb = 0;
        this.currentHuntNb = 0;
        this.nbBulletsLeft = 3;
        this.nbDucksShotInRound = 0;
        this.preySpeed = 100;
      },
    },
  ]);
}

const gameManager = makeGameManager();
export default gameManager;
