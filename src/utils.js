import * as constant from "./constant";
// import updateGameDataApi from "./api";

const updateServerData = (data, engine) => {
  const Http = new XMLHttpRequest();
  const url = "https://e1bd-14-97-1-234.ngrok.io/api/userGame/update";
  Http.open("POST", url);
  // Http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  Http.setRequestHeader("Content-type", "application/json");
  const newData = {
    gamename: "tower-game",
    username: getUsername(engine),
    scoreData: data,
  };
  console.log("NEW DATA", newData);
  Http.send(newData);
};

const startApi = (data, engine) => {
  const Http = new XMLHttpRequest();
  const url = "https://e1bd-14-97-1-234.ngrok.io/api/userGame/start";
  // var formData = new FormData();

  // formData.append("gamename", "tower-game");
  // formData.append("username", getUsername(engine));
  // formData.append("scoreData", JSON.stringify(data));

  Http.open("POST", url);
  Http.setRequestHeader("Content-type", "application/json");
  // var xhr = new XMLHttpRequest();
  // xhr.open("POST", "somewhere", true);
  Http.onload = function () {
    // do something to response
    console.log(this.responseText);
  };
  const newData = {
    gamename: "tower-game",
    username: getUsername(engine),
    scoreData: data,
  };
  console.log("NEW DATA", newData);
  Http.send(JSON.stringify(newData));
};

export const checkMoveDown = (engine) =>
  engine.checkTimeMovement(constant.moveDownMovement);

export const getUsername = (engine) => {
  const fetchId = engine.getVariable(constant.userId);

  if (fetchId) {
    return fetchId ?? "rishabh";
  } else {
    let urlString = window.location.href;
    let userId = urlString.split("?")[1];
    engine.setVariable(constant.userId, userId);
    return userId ?? "rishabh";
  }
};

export const getMoveDownValue = (engine, store) => {
  const pixelsPerFrame = store
    ? store.pixelsPerFrame
    : engine.pixelsPerFrame.bind(engine);
  const successCount = engine.getVariable(constant.successCount);
  const calHeight = engine.getVariable(constant.blockHeight) * 2;
  if (successCount <= 4) {
    return pixelsPerFrame(calHeight * 1.25);
  }
  return pixelsPerFrame(calHeight);
};

export const getAngleBase = (engine) => {
  const successCount = engine.getVariable(constant.successCount);
  const gameScore = engine.getVariable(constant.gameScore);
  const { hookAngle } = engine.getVariable(constant.gameUserOption);
  if (hookAngle) {
    return hookAngle(successCount, gameScore);
  }
  if (engine.getVariable(constant.hardMode)) {
    return 90;
  }
  switch (true) {
    case successCount < 10:
      return 30;
    case successCount < 20:
      return 60;
    default:
      return 80;
  }
};

export const getSwingBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount);
  const gameScore = engine.getVariable(constant.gameScore);
  const { hookSpeed } = engine.getVariable(constant.gameUserOption);
  if (hookSpeed) {
    return hookSpeed(successCount, gameScore);
  }
  let hard;
  switch (true) {
    case successCount < 1:
      hard = 0;
      break;
    case successCount < 10:
      hard = 1;
      break;
    case successCount < 20:
      hard = 0.8;
      break;
    case successCount < 30:
      hard = 0.7;
      break;
    default:
      hard = 0.74;
      break;
  }
  if (engine.getVariable(constant.hardMode)) {
    hard = 1.1;
  }
  return Math.sin(time / (200 / hard));
};

export const getLandBlockVelocity = (engine, time) => {
  const successCount = engine.getVariable(constant.successCount);
  const gameScore = engine.getVariable(constant.gameScore);
  const { landBlockSpeed } = engine.getVariable(constant.gameUserOption);
  if (landBlockSpeed) {
    return landBlockSpeed(successCount, gameScore);
  }
  const { width } = engine;
  let hard;
  switch (true) {
    case successCount < 5:
      hard = 0;
      break;
    case successCount < 13:
      hard = 0.001;
      break;
    case successCount < 23:
      hard = 0.002;
      break;
    default:
      hard = 0.003;
      break;
  }
  return Math.cos(time / 200) * hard * width;
};

export const getHookStatus = (engine) => {
  if (engine.checkTimeMovement(constant.hookDownMovement)) {
    return constant.hookDown;
  }
  if (engine.checkTimeMovement(constant.hookUpMovement)) {
    return constant.hookUp;
  }
  return constant.hookNormal;
};

export const touchEventHandler = (engine) => {
  if (!engine.getVariable(constant.gameStartNow)) return;
  if (engine.debug && engine.paused) {
    return;
  }
  if (getHookStatus(engine) !== constant.hookNormal) {
    return;
  }
  engine.removeInstance("tutorial");
  engine.removeInstance("tutorial-arrow");
  const b = engine.getInstance(
    `block_${engine.getVariable(constant.blockCount)}`
  );
  if (b && b.status === constant.swing) {
    engine.setTimeMovement(constant.hookUpMovement, 500);
    b.status = constant.beforeDrop;
  }
};

export const addSuccessCount = (engine) => {
  const { setGameSuccess } = engine.getVariable(constant.gameUserOption);
  const lastSuccessCount = engine.getVariable(constant.successCount);
  const lastPerfectStreak = engine.getVariable(constant.perfectStreak);
  const success = lastSuccessCount + 1;
  // const currPerfectStreak = lastPerfectStreak + 1;
  engine.setVariable(constant.perfectStreak, 0);
  engine.setVariable(constant.successCount, success);
  if (engine.getVariable(constant.hardMode)) {
    engine.setVariable(
      constant.ropeHeight,
      engine.height * engine.utils.random(0.35, 0.55)
    );
  }
  if (setGameSuccess) setGameSuccess(success);

  // updateGameDataApi({ floor: success,  });
  updateServerData({ floor: success }, engine);
};

export const addFailedCount = (engine) => {
  const { setGameFailed } = engine.getVariable(constant.gameUserOption);
  const lastFailedCount = engine.getVariable(constant.failedCount);
  const failed = lastFailedCount + 1;
  engine.setVariable(constant.failedCount, failed);
  engine.setVariable(constant.perfectCount, 0);

  if (setGameFailed) setGameFailed(failed);
  if (failed >= 3) {
    engine.pauseAudio("bgm");
    engine.playAudio("game-over");
    engine.setVariable(constant.gameStartNow, false);
  }

  updateServerData({ lostLives: failed }, engine);
};

export const addScore = (engine, isPerfect) => {
  const { setGameScore, successScore, perfectScore } = engine.getVariable(
    constant.gameUserOption
  );
  const lastPerfectCount = engine.getVariable(constant.perfectCount, 0);
  const lastPerfectStreak = engine.getVariable(constant.perfectStreak, 0);
  const lastGameScore = engine.getVariable(constant.gameScore);
  const perfect = isPerfect ? lastPerfectCount + 1 : 0;
  engine.setVariable(
    constant.perfectStreak,
    isPerfect ? lastPerfectStreak + 1 : 0
  );

  const score =
    lastGameScore + (successScore || 25) + (perfectScore || 25) * perfect;
  engine.setVariable(constant.gameScore, score);
  engine.setVariable(constant.perfectCount, perfect);
  if (setGameScore) setGameScore(score);
  console.log("Last perfect Count", lastPerfectCount);
  console.log("perfect Count", perfect);
  console.log("socre", score);
  updateServerData(
    {
      perfectCount: perfect,
      score: score,
      perfectStreak: engine.getVariable(constant.perfectStreak, 0),
    },
    engine
  );
};

export const drawYellowString = (engine, option) => {
  const gameStarted = engine.getVariable(constant.serverConnected, false);
  if (!gameStarted) {
    engine.setVariable(constant.serverConnected, true);
    startApi({ lostLives: 0 }, engine);
  }
  const {
    string,
    size,
    x,
    y,
    textAlign,
    fontName = "wenxue",
    fontWeight = "normal",
  } = option;
  const { ctx } = engine;
  const fontSize = size;
  const lineSize = fontSize * 0.1;
  ctx.save();
  ctx.beginPath();
  const gradient = ctx.createLinearGradient(0, 0, 0, y);
  gradient.addColorStop(0, "#FAD961");
  gradient.addColorStop(1, "#F76B1C");
  ctx.fillStyle = gradient;
  ctx.lineWidth = lineSize;
  ctx.strokeStyle = "#FFF";
  ctx.textAlign = textAlign || "center";
  ctx.font = `${fontWeight} ${fontSize}px ${fontName}`;
  ctx.strokeText(string, x, y);
  ctx.fillText(string, x, y);
  ctx.restore();
};
