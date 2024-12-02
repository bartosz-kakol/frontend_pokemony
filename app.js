const loadingScreen = document.getElementById("loading-screen");
const searchBox = document.getElementById("search-box");
const searchStatus = document.getElementById("search-status");
const searchResults = document.getElementById("search-results");

const pokemonDialog = document.getElementById("pokemon-dialog");
const pokemonDialogElements = {
    thumbnail: document.getElementById("pokemon-dialog-thumb"),
    title: document.getElementById("pokemon-dialog-title"),
    types: document.getElementById("pokemon-dialog-types"),
    stats: document.getElementById("pokemon-dialog-stats"),
    physical: document.getElementById("pokemon-dialog-physical"),
};

const errorDialog = document.getElementById("error-dialog");
const errorDialogContent = document.getElementById("error-details");

/** @type {string[]} */
let pokemonNames = [];

/**
 * @param text {string}
 * @param isError {boolean}
 */
function setSearchStatus(text, isError) {
    searchStatus.innerText = text;
    searchStatus.setAttribute("data-error", isError ? "1" : "0");
}

/**
 * @param details {Object}
 * @returns {HTMLDivElement}
 */
function createPokemonDetailsElement(details) {
    const div = document.createElement("div");
    div.classList.add("pokemon-details");
    
    const thumb = document.createElement("img");
    thumb.src = details.sprites.front_default;
    div.appendChild(thumb);
    
    const title = document.createElement("label");
    title.classList.add("pokemon-title");
    title.innerText = details.name;
    div.appendChild(title);

    const num = document.createElement("label");
    num.classList.add("pokemon-num");
    num.innerText = `#${details.id}`;
    div.appendChild(num);
    
    return div;
}

function updateResultsDisplay(data) {
    searchResults.innerHTML = "";
    
    if (data.length === 0) {
        setSearchStatus("Nie znaleziono żadnych pokemonów!", true);
        return;
    }

    setSearchStatus(`Znaleziono ${data.length} Pokemonów!`, false);
    
    console.log(data);
    
    for (const pokemonData of data) {
        const el = createPokemonDetailsElement(pokemonData);
        
        el.addEventListener("click", () => {
            showPokemonInfoDialog(pokemonData);
        });
        
        searchResults.appendChild(el);
    }
}

function showPokemonInfoDialog(pokemonData) {
    pokemonDialogElements.title.innerText = pokemonData.name;
    pokemonDialogElements.thumbnail.src = pokemonData.sprites.front_default;
    pokemonDialogElements.types.innerHTML = pokemonData.types
        .map(type => `<b>Slot ${type.slot}</b>: ${type.type.name}`)
        .join("<br/>");
    pokemonDialogElements.stats.innerHTML = pokemonData.stats
        .map(stat => `<div> <b>${stat.stat.name}</b> <br/> Base: ${stat.base_stat} <br/> Effort: ${stat.effort} </div>`)
        .join("");
    pokemonDialogElements.physical.innerHTML = `<b>Wzrost:</b> ${pokemonData.height} <br/> <b>Waga:</b> ${pokemonData.weight}`;
    
    pokemonDialog.setAttribute("data-show", "1");
}

function hidePokemonInfoDialog() {
    pokemonDialog.setAttribute("data-show", "0");
}

function showErrorDialog(details) {
    errorDialogContent.innerText = details;
    errorDialog.setAttribute("data-show", "1");
}

function hideErrorDialog() {
    errorDialog.setAttribute("data-show", "0");
}

async function getPokemonData(name) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
    
    return await response.json();
}

async function performSearch(searchText) {
    searchText = searchText.toLowerCase();
    
    if (searchText.length === 0) {
        setSearchStatus("Nie podano zapytania.", true);
        return;
    }
    
    const found = pokemonNames.filter(
        name => name.toLowerCase().includes(searchText)
    );
    
    console.log("Fetching:\n%o", found);
    
    if (found.length === 0) {
        setSearchStatus("Nie znaleziono żadnych pokemonów!", true);
        return;
    }
    
    setSearchStatus("Szukam...", false);
    
    try {
        const data = await Promise.all(found.map(getPokemonData));
        
        updateResultsDisplay(data);
    } catch (e) {
        console.error(e);
        setSearchStatus("Nie udało się wykonać wyszukiwania!", true);
        showErrorDialog(e.toString());
    }
}

searchBox.addEventListener("keypress", ev => {
    if (ev.key === "Enter") {
        searchBox.disabled = true;
        performSearch(searchBox.value.trim())
            .then(() => searchBox.disabled = false);
    }
});

// Init
fetch("https://pokeapi.co/api/v2/pokemon?limit=9999")
    .then(res => res.json())
    .then(data => {
        console.log("Got initial data: %o", data);
        pokemonNames = data.results.map(obj => obj.name);
        loadingScreen.style.display = "none";
    });
