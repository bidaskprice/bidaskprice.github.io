document.addEventListener('DOMContentLoaded', function() {
    // Register Handlebars helpers
    registerHandlebarsHelpers();

    // Render data from prediction-data.js
    renderStockData();

    // Show last updated date
    if (typeof PREDICTION_DATE !== 'undefined') {
        document.getElementById('lastUpdated').textContent = `Cập nhật: ${PREDICTION_DATE}`;
    }

    // Add view mode toggle functionality
    setupViewModeToggle();

    // Add search functionality
    setupSearch();
});

function registerHandlebarsHelpers() {
    // Register Handlebars helpers
    Handlebars.registerHelper('trendIcon', function(direction) {
        if (!direction) return 'trending_flat'; // Default value if direction is undefined or null
        if (direction.toLowerCase().includes('tăng')) return 'trending_up';
        if (direction.toLowerCase().includes('giảm')) return 'trending_down';
        return 'trending_flat';
    });

    Handlebars.registerHelper('trendClass', function(direction) {
        if (!direction) return ''; // Default value if direction is undefined or null
        if (direction.toLowerCase().includes('tăng')) return 'trend-up';
        if (direction.toLowerCase().includes('giảm')) return 'trend-down';
        return '';
    });

    Handlebars.registerHelper('strengthIcon', function(strength) {
        if (!strength) return 'signal_cellular_alt_1_bar'; // Default value if strength is undefined or null
        if (strength.toLowerCase() === 'mạnh') return 'signal_cellular_alt';
        if (strength.toLowerCase() === 'trung bình') return 'signal_cellular_alt_2_bar';
        return 'signal_cellular_alt_1_bar';
    });

    Handlebars.registerHelper('confidenceIcon', function(confidence) {
        if (!confidence) return 'gpp_maybe'; // Default value if confidence is undefined or null
        const value = parseFloat(confidence.replace('%', ''));
        if (isNaN(value)) return 'gpp_maybe'; // Default value if parsing fails
        if (value > 70) return 'verified';
        if (value > 50) return 'verified_user';
        return 'gpp_maybe';
    });

    Handlebars.registerHelper('formatPrice', function(price) {
        if (!price) return '0 ₫'; // Default value if price is undefined or null
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
    });
}

function setupViewModeToggle() {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    const gridView = document.getElementById('gridView');
    const tableView = document.getElementById('tableView');

    // Set initial state - grid view is active by default
    document.getElementById('viewMode').value = 'grid';
    gridViewBtn.classList.add('bg-gray-100', 'active');
    tableView.classList.add('hidden');

    gridViewBtn.addEventListener('click', function() {
        document.getElementById('viewMode').value = 'grid';
        gridView.classList.remove('hidden');
        tableView.classList.add('hidden');
        gridViewBtn.classList.add('bg-gray-100', 'active');
        tableViewBtn.classList.remove('bg-gray-100', 'active');
    });

    tableViewBtn.addEventListener('click', function() {
        document.getElementById('viewMode').value = 'table';
        gridView.classList.add('hidden');
        tableView.classList.remove('hidden');
        tableViewBtn.classList.add('bg-gray-100', 'active');
        gridViewBtn.classList.remove('bg-gray-100', 'active');
    });
}

function setupSearch() {
    const searchInput = document.getElementById('stockSearch');
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();

        // Clear existing timeout
        clearTimeout(searchTimeout);

        // Set new timeout to track search after user stops typing
        searchTimeout = setTimeout(() => {
            if (searchTerm.length > 0) {
                // Track search event
                gtag('event', 'stock_search', {
                    'search_term': searchTerm,
                    'event_category': 'Stock Analysis',
                    'event_label': 'Stock Search'
                });
            }
        }, 1000); // Wait 1 second after user stops typing

        const viewMode = document.getElementById('viewMode').value;
        if (viewMode === 'grid') {
            document.querySelectorAll('.stock-card').forEach(card => {
                const symbol = card.getAttribute('data-symbol').toLowerCase();
                if (symbol.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        } else {
            document.querySelectorAll('tbody tr').forEach(row => {
                const symbol = row.getAttribute('data-symbol').toLowerCase();
                if (symbol.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    });
}

// Function to render stock data using Handlebars
function renderStockData() {
    // Compile Handlebars templates
    const cardTemplate = Handlebars.compile(document.getElementById('card-template').innerHTML);
    const tableRowTemplate = Handlebars.compile(document.getElementById('table-row-template').innerHTML);

    // Render grid view
    const gridContainer = document.getElementById('gridView');
    gridContainer.innerHTML = PREDICTION_DATA.map(result => cardTemplate(result)).join('');

    // Render table view
    const tableBody = document.querySelector('#tableView tbody');
    tableBody.innerHTML = PREDICTION_DATA.map(result => tableRowTemplate(result)).join('');

    // Reattach event listeners to new elements
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            content.classList.toggle('hidden');
        });
    });
}