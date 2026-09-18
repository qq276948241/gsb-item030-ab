const fs = require("fs");
const path = require("path");

const 数字 = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

function 失败(消息) {
  process.stderr.write(消息 + "\n");
  process.exit(1);
}

function 读中文(文本) {
  if (文本 === "十") return 10;
  if (文本.startsWith("十") && 文本.length === 2 && 数字[文本[1]]) {
    return 10 + 数字[文本[1]];
  }
  if (文本.includes("十")) {
    const 段 = 文本.split("十");
    if (段.length !== 2 || !数字[段[0]]) return null;
    let 数 = 数字[段[0]] * 10;
    if (段[1] === "") return 数;
    if (段[1].length === 1 && 数字[段[1]]) return 数 + 数字[段[1]];
    return null;
  }
  if (文本.length === 1 && 数字[文本]) return 数字[文本];
  return null;
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
  if (段[0] === "反") 失败("这个方向没有");
  const 值 = 读中文(段[1]);
  if (值 === null) 失败("这个数不认得");
  process.stdout.write(String(值) + "\n");
}

主();
