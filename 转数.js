const fs = require("fs");
const path = require("path");

const 数字 = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const 中文字 = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const 最大 = 999999999999;

function 失败(消息) {
  process.stderr.write(消息 + "\n");
  process.exit(1);
}

function 读中文(文本) {
  if (文本 === "零") return 0;
  if (!/^[零一二三四五六七八九十百千万亿]+$/.test(文本)) return null;
  if (/^零|零零|零$/.test(文本)) return null;
  const 无零 = 文本.split("零").join("");
  const 允许裸十 = 无零.charAt(0) === "十";

  let 亿节 = "";
  let 万节 = "";
  let 个节 = "";

  if (无零.includes("亿")) {
    const 段 = 无零.split("亿");
    if (段.length !== 2) return null;
    亿节 = 段[0];
    const 余下 = 段[1];
    if (亿节 === "") return null;
    if (余下.includes("万")) {
      const 后段 = 余下.split("万");
      if (后段.length !== 2 || 后段[0] === "") return null;
      万节 = 后段[0];
      个节 = 后段[1];
    } else {
      个节 = 余下;
    }
  } else if (无零.includes("万")) {
    const 段 = 无零.split("万");
    if (段.length !== 2 || 段[0] === "") return null;
    万节 = 段[0];
    个节 = 段[1];
  }

  const 有亿 = 亿节 !== "";
  const 有万 = 万节 !== "";
  const 个段 = 有亿 || 有万 ? 个节 : 无零;
  const 亿是头 = 有亿;
  const 万是头 = !有亿 && 有万;
  const 个是头 = !有亿 && !有万;
  if ((有万 && !万是头 && 万节.charAt(0) === "十") ||
      (个段 !== "" && !个是头 && 个段.charAt(0) === "十")) return null;
  const 亿值 = 有亿 ? 读小节(亿节, 允许裸十 && 亿是头) : 0;
  const 万值 = 有万 ? 读小节(万节, 允许裸十 && 万是头) : 0;
  const 个值 = 个段 === "" ? 0 : 读小节(个段, 允许裸十 && 个是头);
  if (亿值 === null || 万值 === null || 个值 === null) return null;
  const 值 = 亿值 * 100000000 + 万值 * 10000 + 个值;
  if (值 > 最大) return null;
  return 值;
}

function 读小节(段, 可省十) {
  const 位 = { 千: 3, 百: 2, 十: 1 };
  const 各位 = [0, 0, 0, 0];
  let 已有 = 0;
  let i = 0;
  while (i < 段.length) {
    if (段[i] === "十") {
      if (i !== 0 || !可省十 || (已有 & (1 << 1))) return null;
      各位[1] = 1;
      已有 |= 1 << 1;
      i += 1;
      if (i < 段.length && 数字[段[i]]) {
        if (已有 & 1) return null;
        各位[0] = 数字[段[i]];
        已有 |= 1;
        i += 1;
      }
      continue;
    }
    const 数 = 数字[段[i]];
    if (!数) return null;
    i += 1;
    const 名字 = 段[i];
    const 级 = 位[名字];
    if (级 !== undefined) {
      if (已有 & (1 << 级)) return null;
      各位[级] = 数;
      已有 |= 1 << 级;
      i += 1;
    } else {
      if (已有 & 1) return null;
      各位[0] = 数;
      已有 |= 1;
    }
  }
  return 各位[3] * 1000 + 各位[2] * 100 + 各位[1] * 10 + 各位[0];
}

function 写中文(值) {
  if (值 === 0) return "零";
  const 节 = [Math.floor(值 / 100000000) % 10000, Math.floor(值 / 10000) % 10000, 值 % 10000];
  const 节名 = ["亿", "万", ""];
  let 文 = "";
  let 已写 = false;
  let 空零 = false;
  for (let i = 0; i < 3; i += 1) {
    if (节[i] === 0) {
      if (已写) 空零 = true;
      continue;
    }
    if (已写 && (空零 || 节[i] < 1000)) 文 += "零";
    文 += 写小节(节[i], !已写) + 节名[i];
    已写 = true;
    空零 = false;
  }
  return 文;
}

function 写小节(值, 是头节) {
  const 单位 = [1000, 100, 10, 1];
  const 名字 = ["千", "百", "十", ""];
  let 文 = "";
  let 待零 = false;
  let 开头 = true;
  for (let i = 0; i < 4; i += 1) {
    const 数 = Math.floor(值 / 单位[i]) % 10;
    if (开头 && 数 === 0) continue;
    if (数 === 0) {
      待零 = true;
      开头 = false;
      continue;
    }
    if (待零) {
      文 += "零";
      待零 = false;
    }
    if (单位[i] === 10 && 数 === 1 && 是头节 && 开头) {
      文 += "十";
    } else {
      文 += 中文字[数] + 名字[i];
    }
    开头 = false;
  }
  return 文;
}

function 主() {
  const 文件 = path.join(process.cwd(), "数");
  if (!fs.existsSync(文件)) 失败("找不到数");
  const 原文 = fs.readFileSync(文件, "utf8");
  if (原文 === "") 失败("数不对");
  let 行 = 原文.split("\n");
  if (行.length && 行[行.length - 1] === "") 行.pop();
  if (行.length !== 1) 失败("数不对");
  const 段 = 行[0].split(" ");
  if (段.length !== 2 || 段[0] === "" || 段[1] === "") 失败("数不对");
  if (段[0] !== "正" && 段[0] !== "反") 失败("这个方向没有");
  if (段[0] === "正") {
    const 值 = 读中文(段[1]);
    if (值 === null) 失败("这个数不认得");
    process.stdout.write(String(值) + "\n");
  } else {
    if (!/^(0|[1-9][0-9]*)$/.test(段[1])) 失败("数不对");
    if (段[1].length > 12) 失败("这个数不认得");
    const 值 = Number(段[1]);
    if (值 > 最大) 失败("这个数不认得");
    process.stdout.write(写中文(值) + "\n");
  }
}

主();
