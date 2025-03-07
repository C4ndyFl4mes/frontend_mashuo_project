const searchField = document.getElementById("search-field");
const searchResults = document.getElementById("search-results");
const tabsUL = document.getElementById("tabs");
const main = document.getElementById("main");
let debounceTimer;

window.addEventListener("load", () => {
    searchAnime();
    renderTabs();
    if (sessionStorage.getItem("tabs")) {
        const tabs = JSON.parse(sessionStorage.getItem("tabs"));
        renderTabs(tabs);
    }
});

searchField.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(searchAnime, 500);
});



function selectTab(tabsEL, tabEL, tab) {
    tabsEL.forEach(tabEL => {
        tabEL.className = "tab";
    });
    tabEL.className = "tab selected";
    console.log(tab);
}

/**
 * Lägger till en flik för navigering mellan olika anime.
 * @param {object} anime - ett objekt som beskriver en anime.
 */
function addTab(anime) {
    if (sessionStorage.getItem("tabs")) {
        const tabs = JSON.parse(sessionStorage.getItem("tabs"));
        if (!tabs.some(tab => tab.mal_id === anime.mal_id)) {
            tabs.push(anime);
            renderTabs(tabs);
            sessionStorage.setItem("tabs", JSON.stringify(tabs));
        } else {
            renderTabs(tabs, anime.mal_id);
        }
    } else {
        const tabs = [anime];
        renderTabs(tabs);
        sessionStorage.setItem("tabs", JSON.stringify(tabs));
    }
}

/**
 * Lägger till alla flikar till dokumentet.
 * @param {array} tabs - en array av anime för flikar.
 */
function renderTabs(tabs, malID) {
    const tabsEL = [];
    const homeTab = document.createElement("li");
    tabsUL.innerHTML = "";
    homeTab.id = "home-tab";
    homeTab.textContent = "Home";
    tabsEL.push(homeTab);
    tabsUL.appendChild(homeTab);

    homeTab.addEventListener("click", () => {

        selectTab(tabsEL, homeTab);
    });
    if (tabs) {
        tabs.forEach(tab => {
            const tabLI = document.createElement("li");
            tabLI.className = "tab selected";
            const tabSPAN = document.createElement("span");
            tabSPAN.textContent = tab.title_english || tab.title;
            const tabRemoveBTN = document.createElement("button");
            tabRemoveBTN.innerHTML = `<svg class=removetab-svg width="25px" height="25px" viewBox="0 0 36 36">
        <path d="M18,2A16,16,0,1,0,34,18,16,16,0,0,0,18,2Zm8,22.1a1.4,1.4,0,0,1-2,2l-6-6L12,26.12a1.4,1.4,0,1,1-2-2L16,18.08,9.83,11.86a1.4,1.4,0,1,1,2-2L18,16.1l6.17-6.17a1.4,1.4,0,1,1,2,2L20,18.08Z"></path>
        </svg>`;
            tabLI.addEventListener("click", () => {
                selectTab(tabsEL, tabLI, tab);
            });
            tabRemoveBTN.addEventListener("click", (e) => {
                removeTab(tab.mal_id);
                e.stopPropagation(); // För att undvika att kalla selectTab två gånger.
            });
            tabsEL.push(tabLI);
            if (tabsEL.indexOf(tabLI) !== -1) {
                tabsEL[tabsEL.indexOf(tabLI)].className = "tab";
            }
            if (tab.mal_id === malID) {
                selectTab(tabsEL, tabLI, tab);
            }
            tabLI.appendChild(tabSPAN);
            tabLI.appendChild(tabRemoveBTN);
            tabsUL.appendChild(tabLI);
        });
        if (!malID) {
            selectTab(tabsEL, tabsEL[tabsEL.length - 1], tabs[tabs.length - 1]);
        }
    } else {
        selectTab(tabsEL, homeTab);
    }
}
/**
 * Raderar en flik och sedan kallar renderTabs för att uppdatera.
 * @param {number} malID - ett id för anime
 */
function removeTab(malID) {
    if (sessionStorage.getItem("tabs")) {
        const tabs = JSON.parse(sessionStorage.getItem("tabs"));
        const remainingTabs = tabs.filter(tab => tab.mal_id !== malID);
        sessionStorage.setItem("tabs", JSON.stringify(remainingTabs));
        renderTabs(remainingTabs);
    }
}

/**
 * Hämtar fem stycken anime utefter det som söks i inputfältet.
 * När de fem anime har hämtats kallas renderSearchResults.
 */
async function searchAnime() {
    const query = searchField.value.trim();

    if (!query) {
        searchResults.innerHTML = "";
    }

    try {
        const resp = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=5`);
        const data = await resp.json();
        renderSearchResults(data.data);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Uppdaterar listan med sökresultat efter den array som matas in.
 * @param {array} animes - en array med anime sökresultat.
 */
function renderSearchResults(animes) {
    searchResults.innerHTML = "";
    animes.forEach(anime => {
        const listItem = document.createElement("li");
        listItem.tabIndex = 0;
        listItem.innerHTML = `
            <picture class=search-image>
                <source srcset="${anime.images.webp.small_image_url}" type="image/webp">
                <img src="${anime.images.jpg.small_image_url}" width="46" height="65" alt="" loading="lazy" class=search-image>
            </picture>
            <p class=search-title>${anime.title_english || anime.title}</p>
            <p class=search-premiere>Premiered: ${anime.season || "?"} ${anime.year || "?"}</p>
        `;
        listItem.addEventListener("click", () => {
            listItem.blur();
            searchField.value = "";
            searchAnime();
            addTab(anime);
        });
        searchResults.appendChild(listItem);
    });
}