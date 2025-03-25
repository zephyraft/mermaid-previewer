import { getExcludeURLRegexes } from "~core/options";

export const windowUrlExclude = async (): Promise<boolean> => {
  return await urlExclude(window.location.href);
};

export const urlExclude = async (url: string): Promise<boolean> => {
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
