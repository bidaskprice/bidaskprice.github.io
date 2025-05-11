document.addEventListener('DOMContentLoaded', function() {
    // Register Handlebars helpers
    registerHandlebarsHelpers();

    // Register partial templates
    Handlebars.registerPartial('ma-signals-template', `
        <div class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h3 class="text-lg font-semibold mb-4">Phân tích đường MA</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Chu kỳ</th>
                            <th class="px-4 py-2 text-left">Loại</th>
                            <th class="px-4 py-2 text-right">Giá trị</th>
                            <th class="px-4 py-2 text-center">Tín hiệu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each ma_signals}}
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-2">{{period}}</td>
                            <td class="px-4 py-2">{{type}}</td>
                            <td class="px-4 py-2 text-right">{{format2Decimals value}}</td>
                            <td class="px-4 py-2 text-center">
                                <span class="px-2 py-1 rounded text-sm {{#if (eq signal "Mua")}}bg-green-100 text-green-800{{else if (eq signal "Bán")}}bg-red-100 text-red-800{{else}}bg-gray-100 text-gray-800{{/if}}">
                                    {{signal}}
                                </span>
                            </td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
        </div>
    `);

    // Add helper to count signals by type
    Handlebars.registerHelper('countSignalsByType', function(signals, signalType) {
        if (!signals || !Array.isArray(signals)) return 0;
        return signals.filter(s => s.signal === signalType).length;
    });

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

    // Add helper for comparing values
    Handlebars.registerHelper('eq', function(a, b) {
        return a === b;
    });
    
    // Add helper to count signals by type
    Handlebars.registerHelper('countSignalsByType', function(signals, signalType) {
        if (!signals || !Array.isArray(signals)) return 0;
        return signals.filter(s => s.signal === signalType).length;
    });
    
    // Add helper to group MA signals by period
    Handlebars.registerHelper('groupMAByPeriod', function(signals) {
        if (!signals || !Array.isArray(signals)) return [];
        
        const periods = [5, 10, 20, 50, 100, 200];
        const result = [];
        
        // Create an entry for each period
        periods.forEach(period => {
            const smaSignal = signals.find(s => s.period === period && s.type === 'SMA');
            const emaSignal = signals.find(s => s.period === period && s.type === 'EMA');
            
            result.push({
                period: period,
                sma: {
                    value: smaSignal ? smaSignal.value : null,
                    signal: smaSignal ? smaSignal.signal : null
                },
                ema: {
                    value: emaSignal ? emaSignal.value : null,
                    signal: emaSignal ? emaSignal.signal : null
                }
            });
        });
        
        return result;
    });

    // Helper to lookup signal object by name from indicator_signals
    Handlebars.registerHelper('lookupSignal', function(signals, name) {
        if (!signals || !Array.isArray(signals) || !name) return null;
        return signals.find(s => s.name === name) || null;
    });

    // Helper to format a number to 2 decimal places
    Handlebars.registerHelper('format2Decimals', function(value) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(num)) return value;
        return num.toFixed(2);
    });

    Handlebars.registerHelper('priceChangeClass', function(change) {
        if (typeof change !== 'number') change = parseFloat(change);
        if (isNaN(change)) return 'text-gray-700';
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-700';
    });
    Handlebars.registerHelper('priceChangeBg', function(change) {
        if (typeof change !== 'number') change = parseFloat(change);
        if (isNaN(change)) return 'bg-gray-100';
        if (change > 0) return 'bg-green-50';
        if (change < 0) return 'bg-red-50';
        return 'bg-gray-100';
    });
    Handlebars.registerHelper('priceChangeIcon', function(change) {
        if (typeof change !== 'number') change = parseFloat(change);
        if (isNaN(change)) return 'trending_flat';
        if (change > 0) return 'trending_up';
        if (change < 0) return 'trending_down';
        return 'trending_flat';
    });
    Handlebars.registerHelper('formatSigned', function(value) {
        if (typeof value !== 'number') value = parseFloat(value);
        if (isNaN(value)) return value;
        return value > 0 ? '+' + value : value;
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
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <img src="./assets/logos/{{symbol}}.svg" alt="{{symbol}}" class="w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
                        <div class="flex flex-col min-w-0">
                            <div class="text-2xl md:text-3xl font-bold mb-1 truncate">{{symbol}}</div>
                            <div class="flex items-end gap-2">
                                <span class="text-3xl md:text-4xl font-extrabold {{priceChangeClass trend_change}}">{{current_price}}</span>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-base font-semibold {{priceChangeBg trend_change}} {{priceChangeClass trend_change}}">
                                    <span class="material-symbols-outlined text-lg align-middle">{{priceChangeIcon trend_change}}</span>
                                    <span>{{formatSigned trend_change}}</span>
                                    <span>({{formatSigned trend_change_percent}}%)</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-row gap-2 md:gap-4 flex-shrink-0">
                        <div class="flex flex-col items-center bg-gray-50 rounded-lg px-3 py-2 min-w-[80px]">
                            <span class="material-symbols-outlined text-xl mb-1 {{trendClass trend_direction}}">{{trendIcon trend_direction}}</span>
                            <span class="text-xs text-gray-500">Xu hướng</span>
                            <span class="font-semibold {{trendClass trend_direction}}">{{trend_direction}}</span>
                        </div>
                        <div class="flex flex-col items-center bg-gray-50 rounded-lg px-3 py-2 min-w-[80px]">
                            <span class="material-symbols-outlined text-xl mb-1 text-blue-500">{{strengthIcon trend_strength}}</span>
                            <span class="text-xs text-gray-500">Độ mạnh</span>
                            <span class="font-semibold text-blue-500">{{trend_strength}}</span>
                        </div>
                        <div class="flex flex-col items-center bg-gray-50 rounded-lg px-3 py-2 min-w-[80px]">
                            <span class="material-symbols-outlined text-xl mb-1 text-yellow-500">{{confidenceIcon trend_confidence}}</span>
                            <span class="text-xs text-gray-500">Tin cậy</span>
                            <span class="font-semibold text-yellow-500">{{trend_confidence}}</span>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="font-semibold mb-2 text-blue-700">Khuyến nghị</h3>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p>{{recommendation}}</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h3 class="font-semibold mb-2 text-blue-700">Tóm tắt kỹ thuật</h3>
                    <div class="p-4 bg-blue-50 rounded-lg whitespace-pre-wrap text-sm">{{technical_summary}}</div>
                </div>

                <!-- Technical Indicators Table (only in detail tab) -->
                {{#if indicator_signals}}
                <div class="mb-6">
                    <h3 class="font-semibold mb-2 text-blue-700">Bảng chỉ báo kỹ thuật</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full border border-gray-200 bg-white rounded-lg">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Chỉ báo</th>
                                    <th class="px-4 py-2 text-right border-b border-gray-200">Giá trị</th>
                                    <th class="px-4 py-2 text-center border-b border-gray-200">Lực mua/bán</th>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Khuyến nghị</th>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Mô tả</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{#each indicator_signals}}
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 border-b border-gray-200 font-medium">
                                        {{name}}
                                        {{#if info}}
                                        <div class="relative inline-block group ml-1">
                                            <span class="material-symbols-outlined text-gray-400 cursor-help text-xs align-middle info-icon-tiny">info</span>
                                            <div class="absolute z-10 hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-lg p-3 w-64 text-sm text-left left-0 top-full">
                                                {{info}}
                                            </div>
                                        </div>
                                        {{/if}}
                                    </td>
                                    <td class="px-4 py-2 text-right border-b border-gray-200 font-mono">{{format2Decimals value}}</td>
                                    <td class="px-4 py-2 text-center border-b border-gray-200">
                                        <span class="px-2 py-1 rounded text-sm font-medium {{#if (eq signal "Mua")}}bg-green-100 text-green-800{{else if (eq signal "Bán")}}bg-red-100 text-red-800{{else}}bg-gray-100 text-gray-800{{/if}}">
                                            {{signal}}
                                        </span>
                                    </td>
                                    <td class="px-4 py-2 border-b border-gray-200 text-sm">{{action}}</td>
                                    <td class="px-4 py-2 border-b border-gray-200 text-sm text-gray-600">{{description}}</td>
                                </tr>
                                {{/each}}
                            </tbody>
                        </table>
                    </div>
                </div>
                {{/if}}

                <div class="mb-6">
                    <h3 class="font-semibold mb-2 text-blue-700">Phân tích đường MA</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full border border-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Chu kỳ</th>
                                    <th class="px-4 py-2 text-right border-b border-gray-200">SMA</th>
                                    <th class="px-4 py-2 text-center border-b border-gray-200">Tín hiệu SMA</th>
                                    <th class="px-4 py-2 text-right border-b border-gray-200">EMA</th>
                                    <th class="px-4 py-2 text-center border-b border-gray-200">Tín hiệu EMA</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                {{#each (groupMAByPeriod ma_signals)}}
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 border-b border-gray-200 font-medium">{{period}}</td>
                                    
                                    <!-- SMA value and signal -->
                                    <td class="px-4 py-2 text-right border-b border-gray-200 font-medium">
                                        {{#if sma.value}}{{format2Decimals sma.value}}{{else}}-{{/if}}
                                    </td>
                                    <td class="px-4 py-2 text-center border-b border-gray-200">
                                        {{#if sma.signal}}
                                        <span class="px-3 py-1 rounded-full text-sm font-medium {{#if (eq sma.signal "Mua")}}bg-green-100 text-green-800{{else if (eq sma.signal "Bán")}}bg-red-100 text-red-800{{else}}bg-gray-100 text-gray-800{{/if}}">
                                            {{sma.signal}}
                                        </span>
                                        {{else}}
                                        -
                                        {{/if}}
                                    </td>
                                    
                                    <!-- EMA value and signal -->
                                    <td class="px-4 py-2 text-right border-b border-gray-200 font-medium">
                                        {{#if ema.value}}{{format2Decimals ema.value}}{{else}}-{{/if}}
                                    </td>
                                    <td class="px-4 py-2 text-center border-b border-gray-200">
                                        {{#if ema.signal}}
                                        <span class="px-3 py-1 rounded-full text-sm font-medium {{#if (eq ema.signal "Mua")}}bg-green-100 text-green-800{{else if (eq ema.signal "Bán")}}bg-red-100 text-red-800{{else}}bg-gray-100 text-gray-800{{/if}}">
                                            {{ema.signal}}
                                        </span>
                                        {{else}}
                                        -
                                        {{/if}}
                                    </td>
                                </tr>
                                {{/each}}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 class="font-semibold mb-2">Vùng mua</h3>
                        <div class="space-y-2">
                            {{#each buy_zones}}
                            <div class="p-3 bg-gray-50 rounded-lg">
                                <div class="font-medium">{{format2Decimals price}}</div>
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
                                <div class="font-medium">{{format2Decimals price}}</div>
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
                                <div class="font-medium">{{format2Decimals price}}</div>
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
            console.log('Stock data for ' + symbol + ':', stockData);
            
            // Ensure ma_signals is initialized if not present
            if (!stockData.ma_signals) {
                console.warn(`Missing ma_signals for ${symbol}, initializing empty array`);
                stockData.ma_signals = [];
            }
            
            tabContent.innerHTML = template(stockData);
            
            // Debug - check if ma_signals table is rendered
            console.log(`ma_signals count for ${symbol}: ${stockData.ma_signals ? stockData.ma_signals.length : 0}`);
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