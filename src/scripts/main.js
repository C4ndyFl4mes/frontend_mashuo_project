const searchField = document.getElementById("search-field");
const searchResults = document.getElementById("search-results");
let debounceTimer;

window.addEventListener("load", () => {
    searchAnime();
})

searchField.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(searchAnime, 500);
});

function selectAnime(anime) {
    console.log(anime);
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
            selectAnime(anime);
        });
        searchResults.appendChild(listItem);
    });
}