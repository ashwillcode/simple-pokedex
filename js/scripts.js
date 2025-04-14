let pokemonRepository = (function () {
    let unit = 'cm';
    let pokemonList = [];
    let apiUrl = 'https://pokeapi.co/api/v2/pokemon/';
    let currentPage = 1;
    let itemsPerPage = 20;
    let isLoading = false;
    let hasMoreItems = true;
    let filteredPokemon = [];

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function add(pokemon) {
        pokemonList.push(pokemon);
    }

    function getAll() {
        return pokemonList;
    }

    function getTypeColor(type) {
        const typeColors = {
            Normal: '#F3E5AB',
            Fire: '#FFD1BA',
            Water: '#ADD8E6',
            Electric: '#F9E79F',
            Grass: '#B8E994',
            Ice: '#D4F1F9',
            Fighting: '#F7C5CC',
            Poison: '#D7BCE8',
            Ground: '#EDD9A3',
            Flying: '#C4DDED',
            Psychic: '#FDC5C5',
            Bug: '#E3F6CE',
            Rock: '#D5CABD',
            Ghost: '#D7CEE8',
            Dragon: '#E6D5F7',
            Dark: '#A8A8A8',
            Steel: '#D9E2E6',
            Fairy: '#FAD9E6',
        };
        return typeColors[type] || '#FFFFFF'; // Default to white if type is not found
    }

    function clearPokemonList() {
        const ul = document.querySelector('.pokemon-list');
        ul.innerHTML = '';
    }

    function addListItem(pokemon) {
        let ul = document.querySelector('.pokemon-list');
        let listItem = document.createElement('li');
        listItem.classList.add('list-group-item');

        let button = document.createElement('button');
        button.innerText = capitalizeFirstLetter(pokemon.name);
        button.classList.add('btn', 'btn-custom', 'w-100');

        button.setAttribute('data-bs-toggle', 'modal');
        button.setAttribute('data-bs-target', '#pokemonModal');
        button.setAttribute('aria-label', `View details for ${capitalizeFirstLetter(pokemon.name)}`);

        // Fetch Pokémon details to get its type
        loadDetails(pokemon).then(() => {
            const types = pokemon.types.split(', '); // Assuming multiple types are comma-separated
            const color = getTypeColor(types[0]); // Use the first type for hover color

            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = color;
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = ''; // Reset to default
            });
        });

        listItem.appendChild(button);
        ul.appendChild(listItem);

        button.addEventListener('click', function () {
            showDetails(pokemon);
        });
    }

    function initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            clearPokemonList();
            
            if (searchTerm === '') {
                // If search is empty, show all loaded Pokémon
                pokemonList.forEach(pokemon => addListItem(pokemon));
                return;
            }

            // Filter and display matching Pokémon
            const matchingPokemon = pokemonList.filter(pokemon => 
                pokemon.name.toLowerCase().includes(searchTerm)
            );

            if (matchingPokemon.length === 0) {
                // Show "no results" message
                const ul = document.querySelector('.pokemon-list');
                const noResults = document.createElement('li');
                noResults.classList.add('list-group-item', 'text-center', 'text-muted');
                noResults.textContent = 'No Pokémon found';
                ul.appendChild(noResults);
            } else {
                matchingPokemon.forEach(pokemon => addListItem(pokemon));
            }
        });
    }

    function loadList() {
        if (isLoading || !hasMoreItems) return Promise.resolve();
        
        isLoading = true;
        const offset = (currentPage - 1) * itemsPerPage;
        const paginatedUrl = `${apiUrl}?limit=${itemsPerPage}&offset=${offset}`;
        
        // Add loading indicator with pastel style
        const loadingIndicator = document.createElement('div');
        loadingIndicator.classList.add('text-center', 'my-3');
        loadingIndicator.innerHTML = `
            <div class="spinner-border" role="status" style="color: #B8E994;">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.querySelector('.container').appendChild(loadingIndicator);
        
        return fetch(paginatedUrl)
            .then((response) => response.json())
            .then((json) => {
                json.results.forEach((item) => {
                    let pokemon = {
                        name: item.name,
                        detailsUrl: item.url
                    };
                    add(pokemon);
                });
                
                // Check if we have more items to load
                hasMoreItems = json.next !== null;
                currentPage++;
                isLoading = false;
                
                // Remove loading indicator
                loadingIndicator.remove();
            })
            .catch((error) => {
                console.error('Error loading Pokemon list', error);
                loadingIndicator.remove();
                isLoading = false;
            });
    }

    function initializeInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && hasMoreItems && !isLoading) {
                    loadList().then(() => {
                        pokemonRepository.getAll().slice(-itemsPerPage).forEach((pokemon) => {
                            pokemonRepository.addListItem(pokemon);
                        });
                    });
                }
            });
        }, options);

        // Create and observe sentinel element
        const sentinel = document.createElement('div');
        sentinel.id = 'sentinel';
        sentinel.style.height = '20px';
        document.querySelector('.container').appendChild(sentinel);
        observer.observe(sentinel);
    }

    function loadDetails(pokemon) {
        return fetch(pokemon.detailsUrl)
            .then((response) => response.json())
            .then((details) => {
                pokemon.imageUrl = details.sprites.front_default;
                pokemon.height = details.height;
                pokemon.types = details.types.map((type) => capitalizeFirstLetter(type.type.name)).join(', ');
            })
            .catch((error) => {
                console.error('Error loading Pokemon details', error);
                alert('Unable to load Pokémon details. Please try again later.');
            });
    }

    function showDetails(pokemon) {
        loadDetails(pokemon).then(() => {
            let modalTitle = document.querySelector('#pokemonModalLabel');
            modalTitle.innerText = capitalizeFirstLetter(pokemon.name);

            let modalBody = document.querySelector('.modal-body');
            modalBody.innerHTML = `
            <img src="${pokemon.imageUrl}" class="img-fluid mb-3" alt="${pokemon.name}">
            <p><strong>Height:</strong> ${pokemon.height} ${unit}</p>
            <p><strong>Types:</strong> ${pokemon.types}</p>
            `;

            modalBody.setAttribute('id', 'modal-content-description');
            document.querySelector('#pokemonModal').setAttribute('aria-labelledby', 'modal-content-description');
        });
    }

    return {
        add: add,
        getAll: getAll,
        addListItem: addListItem,
        loadList: loadList,
        loadDetails: loadDetails,
        showDetails: showDetails,
        initializeInfiniteScroll: initializeInfiniteScroll,
        initializeSearch: initializeSearch
    };
})();

// Initial load
pokemonRepository.loadList().then(() => {
    pokemonRepository.getAll().forEach((pokemon) => {
        pokemonRepository.addListItem(pokemon);
    });
    pokemonRepository.initializeInfiniteScroll();
    pokemonRepository.initializeSearch(); // Initialize search functionality
});
