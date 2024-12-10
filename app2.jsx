class PokemonDialog {
    static dialog;
    static elements;
    
    static init() {
        this.dialog = document.getElementById("pokemon-dialog");
        this.elements = {
            thumbnail: document.getElementById("pokemon-dialog-thumb"),
            title: document.getElementById("pokemon-dialog-title"),
            types: document.getElementById("pokemon-dialog-types"),
            stats: document.getElementById("pokemon-dialog-stats"),
            physical: document.getElementById("pokemon-dialog-physical"),
        };
    }

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
    static dialog;
    static content;
    
    static init() {
        this.dialog = document.getElementById("error-dialog");
        this.content = document.getElementById("error-details");
    }

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

function PokemonDetails() {
    return (
        <div id="pokemon-dialog" className="dialog" data-show="0">
            <div>
                <div className="dialog-header">
                    <img id="pokemon-dialog-thumb"/>
                    <h1 id="pokemon-dialog-title"></h1>
                </div>
                
                <div className="dialog-content">
                    <label className="dialog-content-header">Typy:</label>
                    <br/>
                    <label id="pokemon-dialog-types"></label>

                    <hr/>

                    <label className="dialog-content-header">Statystyki:</label>
                    <br/>
                    <div id="pokemon-dialog-stats"></div>

                    <hr/>

                    <label className="dialog-content-header">Wzrost i waga:</label>
                    <br/>
                    <label id="pokemon-dialog-physical"></label>
                </div>

                <div className="dialog-footer">
                    <button onClick={() => PokemonDialog.hide()}>Zamknij</button>
                </div>
            </div>
        </div>
    );
}

function PokemonList() {
    return (
        <div id="search-results">

        </div>
    );
}

function App() {
    const loadingScreenRef = React.useRef();

    React.useEffect(() => {
        fetch("https://pokeapi.co/api/v2/pokemon?limit=9999")
            .then(res => res.json())
            .then(data => {
                PokemonDialog.init();
                ErrorDialog.init();

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

                loadingScreenRef.current.style.display = "none";
            });
    }, []);
    
    return (
        <>
            <main>
                <h1>Pokemony</h1>
                <input id="search-box" type="text" placeholder="Wyszukaj Pokemony..."/>
                <br/>
                <span id="search-status"></span>

                <PokemonList />
            </main>

            <PokemonDetails />

            <div id="error-dialog" className="dialog" data-show="0">
                <div>
                    <div className="dialog-header">
                        <h1>Wystąpił błąd :(</h1>
                    </div>

                    <div className="dialog-content">
                        <label>Szczegóły znajdziesz poniżej:</label>
                        <br/>
                        <code id="error-details">

                        </code>
                    </div>

                    <div className="dialog-footer">
                        <button onClick={() => ErrorDialog.hide()}>Zamknij</button>
                        <button onClick={() => location.reload()}>Odśwież stronę</button>
                    </div>
                </div>
            </div>

            <div ref={loadingScreenRef}>
                <span>Ładowanie listy Pokemonów...</span>
            </div>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
