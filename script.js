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

    // Setup tab functionality
    setupTabs();
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

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();

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

        // Apply search to both views
        document.querySelectorAll('.stock-card').forEach(card => {
            const symbol = card.getAttribute('data-symbol').toLowerCase();
            if (symbol.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });

        document.querySelectorAll('tbody tr').forEach(row => {
            const symbol = row.getAttribute('data-symbol').toLowerCase();
            if (symbol.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Handle input changes
    searchInput.addEventListener('input', performSearch);

    // Handle Delete key
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' && this.selectionStart === 0 && this.selectionEnd === this.value.length) {
            this.value = '';
            performSearch();
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

function setupTabs() {
    const tabList = document.getElementById('tabList');
    const tabContent = document.getElementById('tabContent');
    let activeTab = 'stockList';

    // Template for stock detail tab content
    const stockDetailTemplate = Handlebars.compile(`
        <div class="p-4">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-6">
                    <img src="./assets/logos/{{symbol}}.svg" alt="{{symbol}}" class="w-12 h-12 mr-4">
                    <div>
                        <h2 class="text-2xl font-bold">{{symbol}}</h2>
                        <p class="text-gray-600">{{current_price}}</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="material-symbols-outlined {{trendClass trend_direction}}">
                                {{trendIcon trend_direction}}
                            </span>
                            <h3 class="font-semibold">Xu hướng</h3>
                        </div>
                        <p class="{{trendClass trend_direction}}">{{trend_direction}}</p>
                    </div>
                    
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="material-symbols-outlined text-blue-500">
                                {{strengthIcon trend_strength}}
                            </span>
                            <h3 class="font-semibold">Độ mạnh</h3>
                        </div>
                        <p class="text-blue-500">{{trend_strength}}</p>
                    </div>
                    
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="material-symbols-outlined text-yellow-500">
                                {{confidenceIcon trend_confidence}}
                            </span>
                            <h3 class="font-semibold">Độ tin cậy</h3>
                        </div>
                        <p class="text-yellow-500">{{trend_confidence}}</p>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="font-semibold mb-2">Khuyến nghị</h3>
                    <p class="p-4 bg-gray-50 rounded-lg">{{recommendation}}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 class="font-semibold mb-2">Vùng mua</h3>
                        <div class="space-y-2">
                            {{#each buy_zones}}
                            <div class="p-3 bg-gray-50 rounded-lg">
                                <div class="font-medium">{{price}}</div>
                                <div class="text-sm text-gray-500">Độ tin cậy: {{confidence}}</div>
                                <div class="text-sm text-gray-600">{{reason}}</div>
                            </div>
                            {{/each}}
                        </div>
                    </div>

                    <div>
                        <h3 class="font-semibold mb-2">Vùng cắt lỗ</h3>
                        <div class="space-y-2">
                            {{#each stop_loss_zones}}
                            <div class="p-3 bg-gray-50 rounded-lg">
                                <div class="font-medium">{{price}}</div>
                                <div class="text-sm text-gray-500">Độ tin cậy: {{confidence}}</div>
                                <div class="text-sm text-gray-600">{{reason}}</div>
                            </div>
                            {{/each}}
                        </div>
                    </div>

                    <div>
                        <h3 class="font-semibold mb-2">Vùng chốt lời</h3>
                        <div class="space-y-2">
                            {{#each take_profit_zones}}
                            <div class="p-3 bg-gray-50 rounded-lg">
                                <div class="font-medium">{{price}}</div>
                                <div class="text-sm text-gray-500">Độ tin cậy: {{confidence}}</div>
                                <div class="text-sm text-gray-600">{{reason}}</div>
                            </div>
                            {{/each}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);

    // First ensure stock list tab is active and clear any existing active states
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active', 'bg-blue-100', 'text-blue-700');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activate stock list tab
    const stockListTab = document.querySelector('.tab-button[data-tab="stockList"]');
    const stockListContent = document.getElementById('stockList');
    if (stockListTab) {
        stockListTab.classList.add('active', 'bg-blue-100', 'text-blue-700');
    }
    if (stockListContent) {
        stockListContent.classList.add('active');
    }
    
    // Then load saved tabs
    const savedTabs = JSON.parse(localStorage.getItem('stockTabs') || '[]');
    savedTabs.forEach(symbol => {
        const stockData = PREDICTION_DATA.find(data => data.symbol === symbol);
        if (stockData) {
            openStockTab(symbol, stockDetailTemplate, false);
        }
    });

    // Always switch to stock list tab after loading saved tabs
    switchTab('stockList');

    // Handle stock card/row clicks
    document.addEventListener('click', function(e) {
        const stockCard = e.target.closest('.stock-card, [data-symbol]');
        if (!stockCard) return;

        const symbol = stockCard.getAttribute('data-symbol');
        if (!symbol) return;

        openStockTab(symbol, stockDetailTemplate, true);
    });

    // Handle tab clicks
    tabList.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-button');
        if (!tabButton) return;

        const tabId = tabButton.getAttribute('data-tab');
        
        // Handle close button click
        if (e.target.closest('.close-tab')) {
            if (tabId !== 'stockList') {
                closeTab(tabId);
            }
            return;
        }

        // Switch to clicked tab
        switchTab(tabId);
    });

    function openStockTab(symbol, template, saveToStorage = true) {
        const tabId = `stock-${symbol}`;
        
        // Check if tab already exists
        const existingTab = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (existingTab) {
            existingTab.classList.add('flash');
            setTimeout(() => existingTab.classList.remove('flash'), 500);
            if (saveToStorage) switchTab(tabId);
            return;
        }

        // Create new tab button
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button px-4 py-2 rounded-full font-medium flex items-center';
        tabButton.setAttribute('data-tab', tabId);
        tabButton.innerHTML = `
            ${symbol}
            <span class="close-tab material-symbols-outlined text-xs ml-1">close</span>
        `;
        tabList.appendChild(tabButton);

        // Create new tab content
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = tabId;

        // Find stock data
        const stockData = PREDICTION_DATA.find(data => data.symbol === symbol);
        if (stockData) {
            tabContent.innerHTML = template(stockData);
        }

        document.getElementById('tabContent').appendChild(tabContent);

        // Switch to new tab only if user action
        if (saveToStorage) {
            switchTab(tabId);
            // Save to localStorage if needed
            const savedTabs = JSON.parse(localStorage.getItem('stockTabs') || '[]');
            if (!savedTabs.includes(symbol)) {
                savedTabs.push(symbol);
                localStorage.setItem('stockTabs', JSON.stringify(savedTabs));
            }
        }
    }

    function switchTab(tabId) {
        // Update active states
        document.querySelectorAll('.tab-button').forEach(tab => {
            const isActive = tab.getAttribute('data-tab') === tabId;
            tab.classList.toggle('active', isActive);
            if (isActive) {
                tab.classList.add('bg-blue-100', 'text-blue-700');
            } else {
                tab.classList.remove('bg-blue-100', 'text-blue-700');
            }
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        activeTab = tabId;
    }

    function closeTab(tabId) {
        const tab = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const content = document.getElementById(tabId);
        
        if (activeTab === tabId) {
            // Switch to stock list tab if closing active tab
            switchTab('stockList');
        }
        
        // Remove tab and content
        if (tab) tab.remove();
        if (content) content.remove();

        // Update localStorage
        const symbol = tabId.replace('stock-', '');
        const savedTabs = JSON.parse(localStorage.getItem('stockTabs') || '[]');
        const updatedTabs = savedTabs.filter(t => t !== symbol);
        localStorage.setItem('stockTabs', JSON.stringify(updatedTabs));
    }
}