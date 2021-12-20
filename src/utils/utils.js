/**
 * 设置数组转字符串
 */
export function optionsArrayToStr(array) {
  let res = "";
  for (const element of array) {
    res += element + "\n";
  }
  return res.substr(0, res.length - 1);
}

/**
 * 设置字符串转数组
 */
export function optionsStrToArray(string) {
  let array = string.split("\n");
  array = array.map((item) => item.trim());
  array = array.filter((item) => item && item !== "");
  return array;
}