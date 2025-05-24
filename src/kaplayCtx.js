import kaplay from "kaplay";

const k = kaplay({
  width: 256,
  height: 224,
  letterbox: true,
  touchToMouse: true,
  scale: 4,
  pixelDensity: devicePixelRatio,
  debug: false,
  background: [0, 0, 0],
});

export default k;
