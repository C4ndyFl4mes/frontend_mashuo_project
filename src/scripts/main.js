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
    
    renderPage(tab);
}

function renderPage(tab) {
    const pageTitle = document.getElementById("page-title");
    const pageHeader = document.createElement("h1");
    pageTitle.textContent = tab.title;
    pageHeader.textContent = tab.title;
    main.innerHTML = "";
    if (tab.pagetype !== "home_page") {
        const animeBanner = document.createElement("div");
        animeBanner.className = "anime-banner";
        animeBanner.innerHTML = `
        <picture class=page-image>
            <source srcset="${tab.images.webp.image_url}" type="image/webp">
            <source srcset="${tab.images.jpg.image_url}" type="image/jpeg">

            <img src="${tab.images.jpg.image_url}" 
            width="425" height="600"
            alt="Descriptive alt text here" 
            loading="lazy" 
            decoding="async"
            class=page-image>
        </picture>
        <ul class=anime-info-in-banner>
            <li><span>Score</span> <strong>${tab.score}</strong></li>
            <li><span>Rank</span> <strong>#${tab.rank}</strong></li>
            <li><span>Premiered</span> <strong>${tab.premiered}</strong></li>
            <li><span>Type</span> <strong>${tab.type}</strong></li>
            <li><span>Episodes</span> <strong>${tab.episodes}</strong></li>
        </ul>
        <ul class=anime-extra-info-in-banner>
            <li><span>Rating</span> <strong>${tab.rating}</strong></li>
            <li><span>Aired</span> <strong>${tab.aired.string}</strong></li>
        </ul>

        `;
        
        const genThemeDemos = [];
        if (tab.genres) {
            tab.genres.forEach(genre => {
                genThemeDemos.push(genre.name);
            });
        }
        if (tab.themes) {
            tab.themes.forEach(theme => {
                genThemeDemos.push(theme.name);
            });
        }
        if (tab.demo) {
            tab.demo.forEach(demo => {
                genThemeDemos.push(demo.name);
            });
        }
        const genresUL = document.createElement("ul");
        genresUL.className = "genres-list";
        genThemeDemos.forEach(gtd => {
            const gtdLI = document.createElement("li");
           
            gtdLI.innerHTML = `<strong>${gtd}</strong>`;
            genresUL.appendChild(gtdLI);
        });
        main.appendChild(animeBanner);
        main.appendChild(pageHeader);
        main.appendChild(genresUL);
        
        const descriptionARTICLE = document.createElement("article");
        descriptionARTICLE.className = "synopsis";
        descriptionARTICLE.innerHTML = `<h2>Synopsis</h2><p>${tab.synopsis}</p>`;
        main.appendChild(descriptionARTICLE);

    } else {
        main.appendChild(pageHeader);

    }

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
    const tabcontent = {
        pagetype: "home_page",
        title: "Home"
    };
    homeTab.addEventListener("click", () => {
       
        selectTab(tabsEL, homeTab, tabcontent);
    });
    if (tabs) {
        tabs.forEach(tab => {
            const tabLI = document.createElement("li");
            tabLI.className = "tab selected";
            const tabSPAN = document.createElement("span");
            tabSPAN.textContent = tab.title;
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
        selectTab(tabsEL, homeTab, tabcontent);
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
        const animes = [];
        data.data.forEach(anime => {
            // console.log(anime);
            let season = anime.season;
            if(anime.season) {
                season = anime.season.charAt(0).toUpperCase() + anime.season.slice(1);
            }
            animes.push({
                pagetype: "anime_page",
                title: anime.title_english || anime.title,
                mal_id: anime.mal_id,
                premiered: `${season || "?"} ${anime.year || "?"}`,
                images: anime.images,
                genres: anime.genres,
                themes: anime.themes,
                explicit_genres: anime.explicit_genres,
                demo: anime.demographics,
                licensors: anime.licensors,
                producers: anime.producers,
                studios: anime.studios,
                source: anime.source,
                synopsis: anime.synopsis,
                score: anime.score,
                rank: anime.rank,
                type: anime.type,
                rating: anime.rating,
                aired: anime.aired,
                episodes: anime.episodes
            });
        });
        
        renderSearchResults(animes);
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
            <p class=search-title>${anime.title}</p>
            <p class=search-premiere>Premiered: ${anime.premiered}</p>
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