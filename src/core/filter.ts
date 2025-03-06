import { getExcludeURLRegexes } from "~core/options";

export const isExclude = async (): Promise<boolean> => {
  const url = window.location.href;

  // 域名排除列表
  const excludeURLRegexes = await getExcludeURLRegexes();

  let isExclude = false;
  for (const excludeItem of excludeURLRegexes) {
    if (new RegExp(excludeItem.regex).test(url)) {
      isExclude = true;
      // console.debug("domain match excludeItem", excludeItem)
      break;
    }
  }
  return isExclude;
};
