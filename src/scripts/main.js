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
    // Hämta token från url.
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");

    if (accessToken) {
        sessionStorage.setItem("spotify_access_token", accessToken);
        window.location.href = "/";
    }
});

searchField.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(searchAnime, 500);
});


/**
 * Visuellt uppdaterar utseendet vid val av flik, samt kallar på renderPage(tab) för att visa flikens innehåll. 
 * @param {array} tabsEL - en array av element.
 * @param {HTMLElement} tabEL - elementet som är vald.
 * @param {object} tab - information som ska visas på sidan.
 */
function selectTab(tabsEL, tabEL, tab) {
    tabsEL.forEach(tabEL => {
        tabEL.className = "tab";
    });
    tabEL.className = "tab selected";
    console.log(tab);

    renderPage(tab);
}

/**
 * Den bygger upp sidan utefter vilket sätt är lämpligast och så smidigt som möjligt. Därför använder funktionen både innerHTML och DOM-manipulation.
 * @param {object} tab - information om den valda sidan.
 */
async function renderPage(tab) {
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
            alt="" 
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
        </ul>`;

        // Lägger ihop tre arrayer till en gemensam array.
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

        // Lägger hela arrayen i en lista.
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

        // Beskrivningen.
        const descriptionARTICLE = document.createElement("article");
        descriptionARTICLE.className = "synopsis";
        descriptionARTICLE.innerHTML = `<h2>Synopsis</h2><p>${tab.synopsis}</p>`;
        main.appendChild(descriptionARTICLE);

        // Mer informationslistan.
        const moreInfoUL = document.createElement("ul");
        moreInfoUL.className = "more-info-list";

        moreInfoUL.innerHTML = `
            <li><span>Source</span><strong>${tab.source}</strong></li>
            <li class=show-on-mobile><span>Rating</span><strong>${tab.rating}</strong></li>
            <li class=show-on-mobile><span>Aired</span><strong>${tab.aired.string}</strong></li>
        `;

        // Lägger in information som kan variera i längd.
        moreInfoUL.appendChild(moreInfoListItem("Studio", tab.studios));
        moreInfoUL.appendChild(moreInfoListItem("Licensor", tab.licensors));
        moreInfoUL.appendChild(moreInfoListItem("Producer", tab.producers));

        main.appendChild(moreInfoUL);

        // Renderar en anime trailer ifall det finns en.
        await renderAnimeTrailer(tab.originalTitle, tab.title);

        // Kollar ifall användaren har loggat in med spotify.
        if (sessionStorage.getItem("spotify_access_token")) {
            const spotifyPlayerDIV = document.createElement("div");
            spotifyPlayerDIV.id = "spotifyPlayer";
            main.appendChild(spotifyPlayerDIV);
            playTrack(tab.originalTitle); // Söker på orginal titel istället för den engelska för att öka chansen på att hitta relevant OP.
        } else {
            const authDIV = document.createElement("div");
            authDIV.className = "auth-div";
            authDIV.innerHTML = `<label for=auth-btn>You have to authenticate with Spotify to play OP</label>
            <button id=auth-btn>Authenticate</button>`;
            main.appendChild(authDIV);
            document.getElementById("auth-btn").addEventListener('click', () => {
                window.location.href = "/.netlify/functions/login"; // Startar authentiseringsprocessen.
            });
        }
    } else {
        main.appendChild(pageHeader);
        const noticeARTICLE = document.createElement("article");
        noticeARTICLE.className = "home-articles";
        noticeARTICLE.innerHTML = `
            <h2>Notice</h2>
            <p>When you have authenticated to Spotify (authentication button will appear on searched animes), the access token will be stored in sessionStorage. Sadly, I didn't come up with a solution to automatically remove the token from sessionStorage after one hour when it's no longer usable and needs to be renewed.
            Therefore one must manually remove the sessionStorage variable or open a new tab and authenticate again. To remove this "app" from trusted apps from Spotify, go profile > account > manage apps. Do this after you've tested my website.</p>
        `;
        main.appendChild(noticeARTICLE);
        const aboutARTICLE = document.createElement("article");
        aboutARTICLE.className = "home-articles";
        aboutARTICLE.innerHTML = `
            <h2>About</h2>
            <p>This website uses three APIs, Jikan, The Movie DB, and Spotify Web API to put together relevant information about a certain anime. Though, sometimes, the Spotify Web API retrieves music that's irrelevant to the anime that's searched for.
            The main function of this website is to provide infromation (Jikan API), a trailer (The Movie DB), and the theme opening song (Spotify Web API) for that anime.</p>
        `;
        main.appendChild(aboutARTICLE);
    }
}

/**
 * Hämtar och beddar in spotify spelaren efter den sökta titeln.
 * @param {string} animeTitle - orginal titeln.
 */
async function playTrack(animeTitle) {
    try {
        const resp = await fetch(`https://api.spotify.com/v1/search?q=${animeTitle}&type=track`, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem('spotify_access_token')}` }
        });
        const data = await resp.json();
        const track = data.tracks.items[0];

        document.getElementById("spotifyPlayer").innerHTML = `
        <h3>${track.name} - ${track.artists[0].name}</h3>
        <iframe src="https://open.spotify.com/embed/track/${track.id}" width="300" height="80" frameborder="0" class=spotify-player allow="encrypted-media"></iframe>
    `;
    } catch (error) {
        console.error(error);
    }
}

/**
 * Räknar upp t.ex. producers i en enda li-element.
 * @param {string} type - Namnet på vad det är för typ av information som ska räknas upp.
 * @param {array} names - En array av objekt.
 * @returns Ett li-element.
 */
function moreInfoListItem(type, names) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    const strong = document.createElement("strong");
    // Ändrar hur uppräkningen ska se ut beroende på ifall det är 0, 1 eller flera, vid flera läggs det till ", and" innan sista delen av uppräkningen.
    if (names.length > 1) {
        span.textContent = `${type}s (${names.length})`;
        for (let i = 0; i <= names.length - 1; i++) {
            if (i == 0) {
                strong.textContent = names[i].name;
            } else if (2 == names.length && i == names.length - 1) {
                strong.textContent += ` and ${names[i].name}.`;
            } else if (i == names.length - 1) {
                strong.textContent += `, and ${names[i].name}.`;
            } else {
                strong.textContent += `, ${names[i].name}`;
            }
        }
    } else if (names.length == 0) {
        span.textContent = type;
        strong.textContent = "?";
    } else {
        span.textContent = type;
        strong.textContent = names[0].name;
    }
    li.appendChild(span);
    li.appendChild(strong);
    return li;
}

/**
 * Hämtar och laddar upp beddar in YouTube trailer efter sökt titel.
 * @param {string} title - original titeln.
 * @param {string} visualTitle - engelska titeln.
 */
async function renderAnimeTrailer(title, visualTitle) {
    try {
        console.log(title);
        const resp = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${process.env.THE_MOVIE_DATABASE}&query=${encodeURIComponent(title)}`)
        const searchData = await resp.json();

        // Kollar ifall titeln finns.
        if (searchData.results.length > 0) {
            const firstResultID = searchData.results[0].id;
            // Om det gör det hämtas video trailers av den och filterars efter att vara trailer på YouTube.
            try {
                const videoResp = await fetch(`https://api.themoviedb.org/3/tv/${firstResultID}/videos?api_key=${process.env.THE_MOVIE_DATABASE}`)
                const videoData = await videoResp.json();
                const youtubeTrailers = videoData.results.filter(video => video.site === "YouTube" && video.type === "Trailer");
                console.log(youtubeTrailers);
                // Kolla ifall det finns trailers.
                if (youtubeTrailers.length > 0) {
                    // Om det gör det beddas den in på sidan, med rubriken på engelska.
                    const youtubeTrailer = youtubeTrailers[0].key;
                    const trailerDIV = document.createElement("div");
                    trailerDIV.className = "trailer-div";
                    trailerDIV.innerHTML = `
                        <h2>${visualTitle} - Trailer</h2>
                        <iframe width="1000" height="563" class=youtube-trailer
                            src="https://www.youtube.com/embed/${youtubeTrailer}"
                            frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
                        </iframe>`;
                    main.appendChild(trailerDIV);
                } else {
                    const trailerDIV = document.createElement("div");
                    trailerDIV.className = "no-trailer-found";
                    trailerDIV.innerHTML = `<p>No trailers were found for <strong>${visualTitle}</strong></p>`;
                    main.appendChild(trailerDIV);
                    console.log("No YouTube-trailers were found!");
                }

            } catch (error) {
                console.error(error);
            }
        } else {
            const trailerDIV = document.createElement("div");
            trailerDIV.className = "no-trailer-found";
            trailerDIV.innerHTML = `<p>No trailers were found for <strong>${visualTitle}</strong></p>`;
            main.appendChild(trailerDIV);
            console.log("No trailers were found!");
        }
    } catch (error) {
        console.error(error);
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
            if (anime.season) {
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
                episodes: anime.episodes,
                originalTitle: anime.title
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