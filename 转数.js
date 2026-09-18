const fs = require("fs");
const path = require("path");

const 数字 = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const 小单位 = { 十: 10, 百: 100, 千: 1000 };
const 汉字数字 = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const 位序 = [[1000, "千"], [100, "百"], [10, "十"], [1, ""]];
const 节单位 = ["", "万", "亿"];

function 失败(消息) {
  process.stderr.write(消息 + "\n");
  process.exit(1);
}

function 节读(文本) {
  if (文本 === "") return null;
  let 总 = 0;
  let 待 = 0;
  let 上位 = Infinity;
  let 前零 = false;
  let 有字 = false;
  for (const 字 of 文本) {
    if (字 === "零") {
      if (待 !== 0 || 前零) return null;
      前零 = true;
      有字 = true;
      continue;
    }
    if (数字[字] !== undefined) {
      if (待 !== 0) return null;
      待 = 数字[字];
      前零 = false;
      有字 = true;
      continue;
    }
    const 位 = 小单位[字];
    if (位 !== undefined) {
      if (位 >= 上位) return null;
      if (待 === 0) {
        if (字 === "十" && 总 === 0 && !有字) 待 = 1;
        else return null;
      }
      总 += 待 * 位;
      上位 = 位;
      待 = 0;
      前零 = false;
      有字 = true;
      continue;
    }
    return null;
  }
  if (!有字) return null;
  return 总 + 待;
}

function 读中文(文本) {
  if (文本 === "零") return 0;
  const 亿分 = 文本.split("亿");
  if (亿分.length > 2) return null;
  let 亿级 = 0;
  let 余文 = 亿分[0];
  if (亿分.length === 2) {
    亿级 = 节读(亿分[0]);
    if (亿级 === null || 亿级 === 0) return null;
    余文 = 亿分[1];
  }
  const 万分 = 余文.split("万");
  if (万分.length > 2) return null;
  let 万级 = 0;
  let 个文 = 万分[0];
  if (万分.length === 2) {
    万级 = 节读(万分[0]);
    if (万级 === null || 万级 === 0) return null;
    个文 = 万分[1];
  }
  let 个级 = 0;
  if (个文 !== "") {
    个级 = 节读(个文);
    if (个级 === null) return null;
  }
  const 值 = 亿级 * 100000000 + 万级 * 10000 + 个级;
  if (值 === 0) return null;
  return 值;
}

function 节写(节, 省头一) {
  let 出 = "";
  let 待零 = false;
  for (const [位, 名] of 位序) {
    const 数 = Math.floor(节 / 位) % 10;
    if (数 === 0) {
      if (出 !== "") 待零 = true;
      continue;
    }
    if (待零) {
      出 += "零";
      待零 = false;
    }
    if (位 === 10 && 数 === 1 && 出 === "" && 省头一) 出 += "十";
    else 出 += 汉字数字[数] + 名;
  }
  return 出;
}

function 写中文(数) {
  if (数 === 0) return "零";
  const 节组 = [];
  let 余 = 数;
  while (余 > 0) {
    节组.push(余 % 10000);
    余 = Math.floor(余 / 10000);
  }
  if (节组.length > 3) return null;
  let 出 = "";
  let 待零 = false;
  for (let 节号 = 节组.length - 1; 节号 >= 0; 节号--) {
    const 节 = 节组[节号];
    if (节 === 0) {
      if (出 !== "") 待零 = true;
      continue;
    }
    if (待零 || (出 !== "" && 节 < 1000)) 出 += "零";
    待零 = false;
    出 += 节写(节, 出 === "") + 节单位[节号];
  }
  return 出;
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
    return;
  }
  const 文 = 段[1];
  if (!/^[0-9]+$/.test(文)) 失败("数不对");
  if (文.length > 1 && 文[0] === "0") 失败("数不对");
  if (文.length > 12) 失败("这个数不认得");
  process.stdout.write(写中文(Number(文)) + "\n");
}

主();
