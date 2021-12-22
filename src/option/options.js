import {
  getSync,
  optionsArrayToStr,
  optionsStrToArray,
  setSync,
  STORAGE_KEY_EXCLUDE_DOMAIN,
  STORAGE_KEY_MATCH_SELECTOR,
} from "../utils/storage";

function saveSuccess() {
  const status = document.getElementById("Status");
  status.textContent = "Options Saved.";
  setTimeout(() => {
    status.textContent = "";
  }, 2000);
}

async function saveOptions() {
  const excludeDomainList = optionsStrToArray(
    document.getElementById("ExcludeDomains").value
  );
  const matchSelectorList = optionsStrToArray(
    document.getElementById("MatchSelectors").value
  );

  const options = {};
  options[STORAGE_KEY_EXCLUDE_DOMAIN] = excludeDomainList;
  options[STORAGE_KEY_MATCH_SELECTOR] = matchSelectorList;
  await setSync(options);

  // 保存成功提示信息
  saveSuccess();
}

async function restoreOptions() {
  const excludeDomainList = await getSync(STORAGE_KEY_EXCLUDE_DOMAIN);
  const matchSelectorList = await getSync(STORAGE_KEY_MATCH_SELECTOR);
  console.debug("storage", excludeDomainList, matchSelectorList);
  document.getElementById("ExcludeDomains").value =
    optionsArrayToStr(excludeDomainList);
  document.getElementById("MatchSelectors").value =
    optionsArrayToStr(matchSelectorList);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("SaveButton").addEventListener("click", saveOptions);
