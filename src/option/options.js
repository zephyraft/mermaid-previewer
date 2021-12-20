import { optionsArrayToStr, optionsStrToArray } from "../utils/utils";

async function saveOptions() {
  const excludeDomainList = optionsStrToArray(
    document.getElementById("ExcludeDomains").value
  );
  const matchSelectorList = optionsStrToArray(
    document.getElementById("MatchSelectors").value
  );
  // noinspection JSUnresolvedVariable
  await chrome.storage.sync.set({
    excludeDomainList: excludeDomainList,
    matchSelectorList: matchSelectorList
  });

  // Update status to let user know options were saved.
  const status = document.getElementById("Status");
  status.textContent = "Options Saved.";
  setTimeout(function() {
    status.textContent = "";
  }, 2000);
}

async function restoreOptions() {
  // noinspection JSUnresolvedVariable
  const storage = await chrome.storage.sync.get([
    "excludeDomainList",
    "matchSelectorList"
  ]);
  console.debug("storage", storage);
  document.getElementById("ExcludeDomains").value = optionsArrayToStr(
    storage.excludeDomainList
  );
  document.getElementById("MatchSelectors").value = optionsArrayToStr(
    storage.matchSelectorList
  );
}


document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("SaveButton").addEventListener("click", saveOptions);
