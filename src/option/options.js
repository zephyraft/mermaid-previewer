
async function saveOptions() {
    const excludeDomainList = stringToArray(document.getElementById('excludeDomainList').value);
    const matchSelectorList = stringToArray(document.getElementById('matchSelectorList').value);
    // noinspection JSUnresolvedVariable
    await chrome.storage.sync.set({
        excludeDomainList: excludeDomainList,
        matchSelectorList: matchSelectorList
    });

    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
        status.textContent = '';
    }, 750);
}

async function restoreOptions() {
    // noinspection JSUnresolvedVariable
    const storage = await chrome.storage.sync.get([
        'excludeDomainList',
        'matchSelectorList',
    ]);
    console.log('storage', storage);
    // noinspection JSUnresolvedVariable
    const localStorage = await chrome.storage.local.get([
        'defaultExcludeDomainList',
        'defaultMatchSelectorList',
    ]);
    console.log('localStorage', localStorage);
    document.getElementById('excludeDomainList').value = arrayToString(storage.excludeDomainList || localStorage.defaultExcludeDomainList);
    document.getElementById('matchSelectorList').value = arrayToString(storage.matchSelectorList || localStorage.defaultMatchSelectorList);
}

async function resetDefaults() {
    // noinspection JSUnresolvedVariable
    const localStorage = await chrome.storage.local.get(['defaultExcludeDomainList', 'defaultMatchSelectorList']);
    document.getElementById('excludeDomainList').value = arrayToString(localStorage.defaultExcludeDomainList);
    document.getElementById('matchSelectorList').value = arrayToString(localStorage.defaultMatchSelectorList);
}

function arrayToString(array) {
    let res = '';
    for (const element of array) {
        res += element + ",\n";
    }
    return res.substr(0, res.length - 2);
}

function stringToArray(string) {
    let array = string.split(",");
    array = array.map((item) => item.trim());
    array = array.filter((item) => item && item !== '');
    return array;
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetDefaults);

