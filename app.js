const loadingScreen = document.getElementById("loading-screen");

class PokemonDialog {
    static dialog = document.getElementById("pokemon-dialog");
    static elements = {
        thumbnail: document.getElementById("pokemon-dialog-thumb"),
        title: document.getElementById("pokemon-dialog-title"),
        types: document.getElementById("pokemon-dialog-types"),
        stats: document.getElementById("pokemon-dialog-stats"),
        physical: document.getElementById("pokemon-dialog-physical"),
    };

    static show(pokemonData) {
        this.elements.title.innerText = pokemonData.name;
        this.elements.thumbnail.src = pokemonData.sprites.front_default;
        this.elements.types.innerHTML = pokemonData.types
            .map(type => `<b>Slot ${type.slot}</b>: ${type.type.name}`)
            .join("<br/>");
        this.elements.stats.innerHTML = pokemonData.stats
            .map(stat => `<div> <b>${stat.stat.name}</b> <br/> Base: ${stat.base_stat} <br/> Effort: ${stat.effort} </div>`)
            .join("");
        this.elements.physical.innerHTML = `<b>Wzrost:</b> ${pokemonData.height} <br/> <b>Waga:</b> ${pokemonData.weight}`;

        this.dialog.setAttribute("data-show", "1");
    }

    static hide() {
        this.dialog.setAttribute("data-show", "0");
    }
}

class ErrorDialog {
    static dialog = document.getElementById("error-dialog");
    static content = document.getElementById("error-details");

    static show(details) {
        this.content.innerText = details;
        this.dialog.setAttribute("data-show", "1");
    }

    static hide() {
        this.dialog.setAttribute("data-show", "0");
    }
}

class Search {
    box = document.getElementById("search-box");
    status = document.getElementById("search-status");
    results = document.getElementById("search-results");
    
    /** @type {string[]} */
    #names;

    /**
     * @param names {string[]}
     */
    constructor(names) {
        this.#names = names;
    }

    /**
     * @param name {string}
     * @returns {Promise<Object>}
     */
    static async getPokemonData(name) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)

        return await response.json();
    }

    /**
     * @param details {Object}
     * @returns {HTMLDivElement}
     */
    static createPokemonDetailsElement(details) {
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

    async search(prompt) {
        prompt = prompt.toLowerCase();

        if (prompt.length === 0) {
            this.setStatus("Nie podano zapytania.", true);
            return;
        }

        const found = this.#names.filter(
            name => name.toLowerCase().includes(prompt)
        );

        console.log("Fetching:\n%o", found);

        if (found.length === 0) {
            this.setStatus("Nie znaleziono żadnych pokemonów!", true);
            return;
        }

        this.setStatus("Szukam...", false);

        try {
            const data = await Promise.all(found.map(Search.getPokemonData));

            this.setResults(data);
        } catch (e) {
            console.error(e);
            this.setStatus("Nie udało się wykonać wyszukiwania!", true);
            ErrorDialog.show(e.toString());
        }
    }

    /**
     * @param text {string}
     * @param isError {boolean}
     */
    setStatus(text, isError) {
        this.status.innerText = text;
        this.status.setAttribute("data-error", isError ? "1" : "0");
    }

    setResults(data) {
        this.results.innerHTML = "";

        if (data.length === 0) {
            this.setStatus("Nie znaleziono żadnych pokemonów!", true);
            return;
        }

        this.setStatus(`Znaleziono ${data.length} Pokemonów!`, false);

        console.log(data);

        for (const pokemonData of data) {
            const el = Search.createPokemonDetailsElement(pokemonData);

            el.addEventListener("click", () => {
                PokemonDialog.show(pokemonData);
            });

            this.results.appendChild(el);
        }
    }
}

// Init
fetch("https://pokeapi.co/api/v2/pokemon?limit=9999")
    .then(res => res.json())
    .then(data => {
        console.log("Got initial data: %o", data);
        
        const pokemonNames = data.results.map(obj => obj.name);
        const search = new Search(pokemonNames);

        search.box.addEventListener("keypress", ev => {
            if (ev.key === "Enter") {
                search.box.disabled = true;
                const prompt = search.box.value.trim();

                search.search(prompt).then(() => {
                    search.box.disabled = false
                });
            }
        });
        
        loadingScreen.style.display = "none";
    });
