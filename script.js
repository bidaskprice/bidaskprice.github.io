document.addEventListener('DOMContentLoaded', function () {
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
    Handlebars.registerHelper('countSignalsByType', function (signals, signalType) {
        if (!signals || !Array.isArray(signals)) return 0;
        return signals.filter(s => s.signal === signalType).length;
    });

    // Add helper to count technical indicator signals by type
    Handlebars.registerHelper('countIndicatorSignalsByType', function (signals, signalType) {
        if (!signals || !Array.isArray(signals)) return 0;
        return signals.filter(s => s.signal === signalType).length;
    });

    // Add helper to get total count of MA signals by period
    Handlebars.registerHelper('countMAByPeriod', function (signals, period) {
        if (!signals || !Array.isArray(signals)) return 0;
        return signals.filter(s => s.period === period).length;
    });

    // Add helper to get total count of all technical indicators
    Handlebars.registerHelper('countAllTechnicalIndicators', function (signals) {
        if (!signals || !Array.isArray(signals)) return 0;
        return signals.length;
    });

    // Add helper to get summary of indicator counts
    Handlebars.registerHelper('getIndicatorSummary', function (ma_signals, indicator_signals) {
        const result = {
            ma_count: ma_signals && Array.isArray(ma_signals) ? ma_signals.length : 0,
            indicator_count: indicator_signals && Array.isArray(indicator_signals) ? indicator_signals.length : 0,
            total_count: 0,
            ma_buy: 0,
            ma_sell: 0,
            ma_neutral: 0,
            tech_buy: 0,
            tech_sell: 0,
            tech_neutral: 0,
            total_buy: 0,
            total_sell: 0,
            total_neutral: 0
        };

        result.total_count = result.ma_count + result.indicator_count;

        // Count MA signals by type
        if (ma_signals && Array.isArray(ma_signals)) {
            result.ma_buy = ma_signals.filter(s => s.signal === 'Mua').length;
            result.ma_sell = ma_signals.filter(s => s.signal === 'Bán').length;
            result.ma_neutral = ma_signals.filter(s => s.signal === 'Trung tính').length;
        }

        // Count technical indicators by type
        if (indicator_signals && Array.isArray(indicator_signals)) {
            result.tech_buy = indicator_signals.filter(s => s.signal === 'Mua').length;
            result.tech_sell = indicator_signals.filter(s => s.signal === 'Bán').length;
            result.tech_neutral = indicator_signals.filter(s => s.signal === 'Trung tính').length;
        }

        // Calculate totals
        result.total_buy = result.ma_buy + result.tech_buy;
        result.total_sell = result.ma_sell + result.tech_sell;
        result.total_neutral = result.ma_neutral + result.tech_neutral;

        return result;
    });

    // Add helper to get signal strength based on buy vs sell counts
    Handlebars.registerHelper('signalStrength', function (signals) {
        if (!signals || !Array.isArray(signals)) return { strength: 'Không có dữ liệu', class: 'text-gray-500' };

        const buyCount = signals.filter(s => s.signal === 'Mua').length;
        const sellCount = signals.filter(s => s.signal === 'Bán').length;
        const neutralCount = signals.filter(s => s.signal === 'Trung tính').length;

        // Calculate the buy/sell ratio
        const total = buyCount + sellCount + neutralCount;
        if (total === 0) return { strength: 'Không có dữ liệu', class: 'text-gray-500' };

        const buyRatio = buyCount / total;
        const sellRatio = sellCount / total;

        // Determine signal strength based on ratios
        if (buyRatio >= 0.7) return {
            strength: 'Mua mạnh',
            class: 'text-green-700',
            icon: 'trending_up'
        };
        if (buyRatio >= 0.5) return {
            strength: 'Mua',
            class: 'text-green-600',
            icon: 'trending_up'
        };
        if (sellRatio >= 0.7) return {
            strength: 'Bán mạnh',
            class: 'text-red-700',
            icon: 'trending_down'
        };
        if (sellRatio >= 0.5) return {
            strength: 'Bán',
            class: 'text-red-600',
            icon: 'trending_down'
        };

        return {
            strength: 'Trung tính',
            class: 'text-gray-600',
            icon: 'trending_flat'
        };
    });

    // Add helper to analyze all technical indicators (both MA and other indicators)
    Handlebars.registerHelper('allSignalsStrength', function (maSignals, indicatorSignals) {
        if ((!maSignals || !Array.isArray(maSignals)) &&
            (!indicatorSignals || !Array.isArray(indicatorSignals))) {
            return { strength: 'Không có dữ liệu', class: 'text-gray-500' };
        }

        // Combine signals from both sources
        const allSignals = [];

        // Add MA signals if available
        if (maSignals && Array.isArray(maSignals)) {
            allSignals.push(...maSignals);
        }

        // Add indicator signals if available
        if (indicatorSignals && Array.isArray(indicatorSignals)) {
            allSignals.push(...indicatorSignals);
        }

        const buyCount = allSignals.filter(s => s.signal === 'Mua').length;
        const sellCount = allSignals.filter(s => s.signal === 'Bán').length;
        const neutralCount = allSignals.filter(s => s.signal === 'Trung tính').length;

        // Calculate the buy/sell ratio
        const total = buyCount + sellCount + neutralCount;
        if (total === 0) return { strength: 'Không có dữ liệu', class: 'text-gray-500' };

        const buyRatio = buyCount / total;
        const sellRatio = sellCount / total;

        // Determine signal strength based on ratios
        if (buyRatio >= 0.7) return {
            strength: 'Mua mạnh',
            class: 'text-green-700',
            icon: 'trending_up',
            buyCount,
            sellCount,
            neutralCount,
            total
        };
        if (buyRatio >= 0.5) return {
            strength: 'Mua',
            class: 'text-green-600',
            icon: 'trending_up',
            buyCount,
            sellCount,
            neutralCount,
            total
        };
        if (sellRatio >= 0.7) return {
            strength: 'Bán mạnh',
            class: 'text-red-700',
            icon: 'trending_down',
            buyCount,
            sellCount,
            neutralCount,
            total
        };
        if (sellRatio >= 0.5) return {
            strength: 'Bán',
            class: 'text-red-600',
            icon: 'trending_down',
            buyCount,
            sellCount,
            neutralCount,
            total
        };

        return {
            strength: 'Trung tính',
            class: 'text-gray-600',
            icon: 'trending_flat',
            buyCount,
            sellCount,
            neutralCount,
            total
        };
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
    Handlebars.registerHelper('trendIcon', function (direction) {
        if (!direction) return 'trending_flat'; // Default value if direction is undefined or null
        if (direction.toLowerCase().includes('tăng')) return 'trending_up';
        if (direction.toLowerCase().includes('giảm')) return 'trending_down';
        return 'trending_flat';
    });

    Handlebars.registerHelper('trendClass', function (direction) {
        if (!direction) return ''; // Default value if direction is undefined or null
        if (direction.toLowerCase().includes('tăng')) return 'trend-up';
        if (direction.toLowerCase().includes('giảm')) return 'trend-down';
        return '';
    });

    Handlebars.registerHelper('strengthIcon', function (strength) {
        if (!strength) return 'signal_cellular_alt_1_bar'; // Default value if strength is undefined or null
        if (strength.toLowerCase() === 'mạnh') return 'signal_cellular_alt';
        if (strength.toLowerCase() === 'trung bình') return 'signal_cellular_alt_2_bar';
        return 'signal_cellular_alt_1_bar';
    });

    Handlebars.registerHelper('confidenceIcon', function (confidence) {
        if (!confidence) return 'gpp_maybe'; // Default value if confidence is undefined or null
        const value = parseFloat(confidence.replace('%', ''));
        if (isNaN(value)) return 'gpp_maybe'; // Default value if parsing fails
        if (value > 70) return 'verified';
        if (value > 50) return 'verified_user';
        return 'gpp_maybe';
    });

    Handlebars.registerHelper('formatPrice', function (price) {
        if (!price) return '0 ₫'; // Default value if price is undefined or null
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
    });

    // Add helper for comparing values
    Handlebars.registerHelper('eq', function (a, b) {
        return a === b;
    });

    // Add helper to count signals by type
    Handlebars.registerHelper('countSignalsByType', function (signals, signalType) {
        if (!signals || !Array.isArray(signals)) return 0;
        return signals.filter(s => s.signal === signalType).length;
    });

    // Add helper to group MA signals by period
    Handlebars.registerHelper('groupMAByPeriod', function (signals) {
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
    Handlebars.registerHelper('lookupSignal', function (signals, name) {
        if (!signals || !Array.isArray(signals) || !name) return null;
        return signals.find(s => s.name === name) || null;
    });

    // Helper to format a number to 2 decimal places
    Handlebars.registerHelper('format2Decimals', function (value) {
        if (!value) return value;

        // If it's already a number, just format it
        if (typeof value === 'number') {
            return value.toFixed(2);
        }

        // If it's a string, try to parse it correctly
        if (typeof value === 'string') {
            // For Vietnamese formatted strings like "10.000" (ten thousand)
            // First remove all dots used as thousand separators
            const cleanValue = value.replace(/\./g, '');

            // Then parse as float
            const num = parseFloat(cleanValue);

            if (!isNaN(num)) {
                return num.toFixed(2);
            }
        }

        // If parsing fails, return the original value
        return value;
    });

    Handlebars.registerHelper('priceChangeClass', function (change) {
        if (typeof change !== 'number') change = parseFloat(change);
        if (isNaN(change)) return 'text-gray-700';
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-700';
    });
    Handlebars.registerHelper('priceChangeBg', function (change) {
        if (typeof change !== 'number') change = parseFloat(change);
        if (isNaN(change)) return 'bg-gray-100';
        if (change > 0) return 'bg-green-50';
        if (change < 0) return 'bg-red-50';
        return 'bg-gray-100';
    });
    Handlebars.registerHelper('priceChangeIcon', function (change) {
        if (typeof change !== 'number') change = parseFloat(change);
        if (isNaN(change)) return 'trending_flat';
        if (change > 0) return 'trending_up';
        if (change < 0) return 'trending_down';
        return 'trending_flat';
    });
    Handlebars.registerHelper('formatSigned', function (value) {
        if (typeof value !== 'number') value = parseFloat(value);
        if (isNaN(value)) return value;
        return value > 0 ? '+' + value : value;
    });

    // Helper to format RS (Relative Strength) values
    Handlebars.registerHelper('formatRS', function (value, name) {
        if ((name !== "RS(52)" && name !== "RS(52 tuần)" && name !== "RS(52W)") || value === null || value === undefined) return value;

        // Format the value
        const formattedValue = parseFloat(value).toFixed(2);

        // Determine the class and tooltip based on RS value
        let className = 'text-gray-800';
        let tooltip = '';

        if (value >= 1.5) {
            className = 'text-green-800 font-bold';
            tooltip = 'Cổ phiếu mạnh hơn thị trường 50% trở lên';
        } else if (value >= 1.2) {
            className = 'text-green-600 font-semibold';
            tooltip = 'Cổ phiếu mạnh hơn thị trường 20% trở lên';
        } else if (value >= 1.0) {
            className = 'text-green-500';
            tooltip = 'Cổ phiếu mạnh hơn thị trường';
        } else if (value <= 0.5) {
            className = 'text-red-800 font-bold';
            tooltip = 'Cổ phiếu yếu hơn thị trường 50% trở lên';
        } else if (value <= 0.8) {
            className = 'text-red-600 font-semibold';
            tooltip = 'Cổ phiếu yếu hơn thị trường 20% trở lên';
        } else {
            className = 'text-gray-600';
            tooltip = 'Cổ phiếu có hiệu suất tương đương thị trường';
        }

        return new Handlebars.SafeString(`
            <div class="relative inline-block group">
                <span class="${className}">${formattedValue}</span>
                <div class="absolute z-10 hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-lg p-2 text-sm text-gray-700 min-w-[200px] left-0 top-full mt-1">
                    ${tooltip}
                </div>
            </div>
        `);
    });

    // Add helper to convert newlines to HTML breaks
    Handlebars.registerHelper('nl2br', function (text) {
        if (!text) return '';
        text = Handlebars.Utils.escapeExpression(text);
        return new Handlebars.SafeString(text.replace(/(\r\n|\n|\r)/gm, '<br>'));
    });

    // Add helper to multiply values (for positioning elements)
    Handlebars.registerHelper('multiply', function (a, b) {
        return parseInt(a) * parseInt(b);
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

    gridViewBtn.addEventListener('click', function () {
        document.getElementById('viewMode').value = 'grid';
        gridView.classList.remove('hidden');
        tableView.classList.add('hidden');
        gridViewBtn.classList.add('bg-gray-100', 'active');
        tableViewBtn.classList.remove('bg-gray-100', 'active');
    });

    tableViewBtn.addEventListener('click', function () {
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
    searchInput.addEventListener('keydown', function (e) {
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
        header.addEventListener('click', function () {
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
                <div class="flex flex-col md:flex-row mb-6 gap-4">
                    <div class="flex items-center gap-4">
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
                    <div class="p-4 bg-gray-50 rounded-lg recommendation-text" style="white-space: normal; word-break: break-word; overflow-wrap: break-word;">
                        <p style="white-space: normal;">{{{nl2br recommendation}}}</p>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="font-semibold mb-2 text-blue-700">Tổng hợp chỉ báo kỹ thuật</h3>
                    {{#with (getIndicatorSummary ma_signals indicator_signals)}}
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <!-- MA Signals -->
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <h4 class="font-medium text-blue-700 mb-2 text-center">Đường MA</h4>
                            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-2">
                                <span class="text-2xl font-bold text-blue-700">{{ma_count}}</span>
                            </div>
                            <div class="flex gap-2 justify-center mb-2">
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">Mua</span>
                                    <span class="text-lg font-bold text-green-700">{{ma_buy}}</span>
                                </div>
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">Bán</span>
                                    <span class="text-lg font-bold text-red-700">{{ma_sell}}</span>
                                </div>
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">TT</span>
                                    <span class="text-lg font-bold text-gray-700">{{ma_neutral}}</span>
                                </div>
                            </div>
                            <div class="text-center text-xs text-gray-500">
                                {{#if (eq name "RS(52)")}}
                                Sức mạnh cổ phiếu so với VNINDEX trong 52 tuần (1 năm)
                                {{else}}
                                {{#if (eq name "RS(52 tuần)")}}
                                Sức mạnh cổ phiếu so với VNINDEX trong 52 tuần (1 năm)
                                {{else}}
                                {{#if (eq name "RS(52W)")}}
                                Sức mạnh cổ phiếu so với VNINDEX trong 52 tuần (1 năm)
                                {{else}}
                                SMA/EMA các chu kỳ 5, 10, 20, 50, 100, 200
                                {{/if}}
                                {{/if}}
                                {{/if}}
                            </div>
                        </div>

                        <!-- Technical Indicator Signals -->
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <h4 class="font-medium text-blue-700 mb-2 text-center">Chỉ báo kỹ thuật</h4>
                            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mx-auto mb-2">
                                <span class="text-2xl font-bold text-purple-700">{{indicator_count}}</span>
                            </div>
                            <div class="flex gap-2 justify-center mb-2">
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">Mua</span>
                                    <span class="text-lg font-bold text-green-700">{{tech_buy}}</span>
                                </div>
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">Bán</span>
                                    <span class="text-lg font-bold text-red-700">{{tech_sell}}</span>
                                </div>
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">TT</span>
                                    <span class="text-lg font-bold text-gray-700">{{tech_neutral}}</span>
                                </div>
                            </div>
                            <div class="text-center text-xs text-gray-500">
                                RSI, MACD, Stochastic, CCI, Williams %R, v.v.
                            </div>
                        </div>

                        <!-- Combined Signal Analysis -->
                        <div class="bg-white rounded-lg p-3 shadow-sm">
                            <h4 class="font-medium text-blue-700 mb-2 text-center">Tổng hợp</h4>
                            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-2">
                                <span class="text-2xl font-bold text-green-700">{{total_count}}</span>
                            </div>
                            <div class="flex gap-2 justify-center mb-2">
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">Mua</span>
                                    <span class="text-lg font-bold text-green-700">{{total_buy}}</span>
                                </div>
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">Bán</span>
                                    <span class="text-lg font-bold text-red-700">{{total_sell}}</span>
                                </div>
                                <div class="flex flex-col items-center bg-gray-50 rounded-lg p-2 flex-1">
                                    <span class="text-xs text-gray-500">TT</span>
                                    <span class="text-lg font-bold text-gray-700">{{total_neutral}}</span>
                                </div>
                            </div>
                            <div class="text-center">
                                {{#with (allSignalsStrength ../../ma_signals ../../indicator_signals)}}
                                <span class="px-2 py-1 rounded-full text-sm {{class}} bg-gray-50 inline-flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm">{{icon}}</span>
                                    {{strength}}
                                </span>
                                {{/with}}
                            </div>
                        </div>
                    </div>
                    {{/with}}
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
                                    <td class="px-4 py-2 text-right border-b border-gray-200 font-mono">
                                        {{#if (eq name "RS(52)")}}
                                        {{formatRS value name}}
                                        {{else}}
                                        {{#if (eq name "RS(52 tuần)")}}
                                        {{formatRS value name}}
                                        {{else}}
                                        {{#if (eq name "RS(52W)")}}
                                        {{formatRS value name}}
                                        {{else}}
                                        {{format2Decimals value}}
                                        {{/if}}
                                        {{/if}}
                                        {{/if}}
                                    </td>
                                    <td class="px-4 py-2 text-center border-b border-gray-200">
                                        <span class="px-2 py-1 rounded text-sm font-medium {{#if (eq signal "Mua")}}bg-green-100 text-green-800{{else if (eq signal "Bán")}}bg-red-100 text-red-800{{else}}bg-gray-100 text-gray-800{{/if}}">
                                            {{signal}}
                                        </span>
                                    </td>
                                    <td class="px-4 py-2 border-b border-gray-200 text-sm">{{action}}</td>
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
                                    <th class="px-4 py-2 pr-12 text-right border-b border-gray-200">SMA</th>
                                    <th class="px-4 py-2 pr-12 text-right border-b border-gray-200">EMA</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                {{#each (groupMAByPeriod ma_signals)}}
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 border-b border-gray-200 font-medium">{{period}}</td>

                                    <!-- SMA value and signal -->
                                    <td class="px-4 py-2 text-right border-b border-gray-200 font-medium">
                                        {{#if sma.value}}{{format2Decimals sma.value}}{{else}}-{{/if}}

                                        {{#if sma.signal}}
                                        <span class="ml-1 px-3 py-1 rounded-full text-sm font-medium {{#if (eq sma.signal "Mua")}}bg-green-100 text-green-800{{else if (eq sma.signal "Bán")}}bg-red-100 text-red-800{{else}}bg-gray-100 text-gray-800{{/if}}">
                                            {{sma.signal}}
                                        </span>
                                        {{else}}
                                        -
                                        {{/if}}
                                    </td>

                                    <!-- EMA value and signal -->
                                    <td class="px-4 py-2 text-right border-b border-gray-200 font-medium">
                                        {{#if ema.value}}{{format2Decimals ema.value}}{{else}}-{{/if}}

                                        {{#if ema.signal}}
                                        <span class="ml-1 px-3 py-1 rounded-full text-sm font-medium {{#if (eq ema.signal "Mua")}}bg-green-100 text-green-800{{else if (eq ema.signal "Bán")}}bg-red-100 text-red-800{{else}}bg-gray-100 text-gray-800{{/if}}">
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

                <div class="mb-6">
                    <h3 class="font-semibold mb-2 text-blue-700">Vùng giá giao dịch</h3>
                    <div class="border border-gray-200 rounded-lg bg-white">
                        <!-- Mối quan hệ giữa các giá trị -->
                        <div class="p-4 border-b border-gray-200">
                            <!-- Giá hiện tại, vùng mua và biên độ -->
                            <div class="flex items-center justify-center mb-4">
                                <div class="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold shadow-sm flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm">price_check</span>
                                    Giá hiện tại: {{current_price}}
                                </div>
                            </div>

                            <!-- Thang giá trị -->
                            <div class="relative h-20 mx-4 mb-2">
                                <!-- Đường giá -->
                                <div class="absolute h-1 bg-gray-300 top-1/2 left-0 right-0 -translate-y-1/2"></div>

                                <!-- Giá hiện tại -->
                                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full z-10"></div>
                                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-medium text-blue-600">Hiện tại: {{current_price}}</div>

                                <!-- Vùng chốt lời -->
                                {{#if take_profit_zones.[0].price}}
                                <div class="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-3 bg-green-600 rounded-full z-10"></div>
                                <div class="absolute top-0 right-0 text-xs font-medium text-green-600">
                                    Chốt lời: {{format2Decimals take_profit_zones.[0].price}}
                                </div>
                                {{/if}}

                                <!-- Vùng mua -->
                                {{#if buy_zones.[0].price}}
                                <div class="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full z-10"></div>
                                <div class="absolute top-0 left-1/3 -translate-x-1/2 text-xs font-medium text-blue-500">
                                    Mua: {{format2Decimals buy_zones.[0].price}}
                                </div>
                                {{/if}}

                                <!-- Vùng cắt lỗ -->
                                {{#if stop_loss_zones.[0].price}}
                                <div class="absolute top-1/2 left-1/6 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full z-10"></div>
                                <div class="absolute top-full left-1/6 -translate-x-1/2 mt-1 text-xs font-medium text-red-600">
                                    Cắt lỗ: {{format2Decimals stop_loss_zones.[0].price}}
                                </div>
                                {{/if}}
                            </div>

                            <!-- Phân tích tỷ lệ rủi ro/lợi nhuận -->
                            {{#if risk_reward_ratios.[0]}}
                            <div class="bg-gray-50 p-3 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3">
                                <div class="flex flex-col items-center">
                                    <div class="text-xs text-gray-500">Vị thế giao dịch</div>
                                    <div class="text-sm font-medium">
                                        <span class="text-blue-600">{{format2Decimals risk_reward_ratios.[0].buy_price}}</span> →
                                        <span class="text-green-600">{{format2Decimals risk_reward_ratios.[0].take_profit_price}}</span> /
                                        <span class="text-red-600">{{format2Decimals risk_reward_ratios.[0].stop_loss_price}}</span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-center">
                                    <div class="text-xs text-gray-500">Tỉ lệ R/R</div>
                                    <div class="text-lg font-bold {{#if (eq risk_reward_ratios.[0].quality 'Tốt')}}text-green-600{{else}}{{#if (eq risk_reward_ratios.[0].quality 'Trung bình')}}text-yellow-600{{else}}text-gray-600{{/if}}{{/if}}">
                                        {{risk_reward_ratios.[0].ratio}}
                                    </div>
                                </div>
                                <div class="flex flex-col items-center">
                                    <div class="text-xs text-gray-500">Chất lượng</div>
                                    <div class="px-2 py-1 rounded-full text-sm font-medium {{#if (eq risk_reward_ratios.[0].quality 'Tốt')}}bg-green-100 text-green-800{{else}}{{#if (eq risk_reward_ratios.[0].quality 'Trung bình')}}bg-yellow-100 text-yellow-800{{else}}bg-gray-100 text-gray-800{{/if}}{{/if}}">
                                        {{risk_reward_ratios.[0].quality}}
                                    </div>
                                </div>
                            </div>
                            {{/if}}
                        </div>

                        <!-- Zone Tables -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50">
                            <!-- Take Profit Zones -->
                            <div>
                                <h4 class="text-sm font-medium text-gray-600 flex items-center mb-2">
                                    <span class="w-3 h-3 bg-green-500 rounded-full inline-block mr-1"></span>
                                    Vùng chốt lời
                                </h4>
                                <div class="space-y-2">
                                    {{#each take_profit_zones}}
                                    <div class="border border-green-200 bg-green-50 rounded-lg p-2 shadow-sm">
                                        <div class="flex items-center justify-between">
                                            <span class="material-symbols-outlined text-green-600">trending_up</span>
                                            <div class="font-bold text-green-700">{{format2Decimals price}}</div>
                                        </div>
                                        <div class="text-xs text-gray-600 mt-1">{{reason}}</div>
                                        <div class="text-xs text-green-600 mt-1">Độ tin cậy: {{confidence}}</div>
                                    </div>
                                    {{/each}}
                                    {{#unless take_profit_zones}}
                                    <div class="text-sm text-gray-500 italic">Không có dữ liệu</div>
                                    {{/unless}}
                                </div>
                            </div>

                            <!-- Buy Zones -->
                            <div>
                                <h4 class="text-sm font-medium text-gray-600 flex items-center mb-2">
                                    <span class="w-3 h-3 bg-blue-500 rounded-full inline-block mr-1"></span>
                                    Vùng mua
                                </h4>
                                <div class="space-y-2">
                                    {{#each buy_zones}}
                                    <div class="border border-blue-200 bg-blue-50 rounded-lg p-2 shadow-sm">
                                        <div class="flex items-center justify-between">
                                            <span class="material-symbols-outlined text-blue-600">shopping_cart</span>
                                            <div class="font-bold text-blue-700">{{format2Decimals price}}</div>
                                        </div>
                                        <div class="text-xs text-gray-600 mt-1">{{reason}}</div>
                                        <div class="text-xs text-blue-600 mt-1">Độ tin cậy: {{confidence}}</div>
                                    </div>
                                    {{/each}}
                                    {{#unless buy_zones}}
                                    <div class="text-sm text-gray-500 italic">Không có dữ liệu</div>
                                    {{/unless}}
                                </div>
                            </div>

                            <!-- Stop Loss Zones -->
                            <div>
                                <h4 class="text-sm font-medium text-gray-600 flex items-center mb-2">
                                    <span class="w-3 h-3 bg-red-500 rounded-full inline-block mr-1"></span>
                                    Vùng cắt lỗ
                                </h4>
                                <div class="space-y-2">
                                    {{#each stop_loss_zones}}
                                    <div class="border border-red-200 bg-red-50 rounded-lg p-2 shadow-sm">
                                        <div class="flex items-center justify-between">
                                            <span class="material-symbols-outlined text-red-600">priority_high</span>
                                            <div class="font-bold text-red-700">{{format2Decimals price}}</div>
                                        </div>
                                        <div class="text-xs text-gray-600 mt-1">{{reason}}</div>
                                        <div class="text-xs text-red-600 mt-1">Độ tin cậy: {{confidence}}</div>
                                    </div>
                                    {{/each}}
                                    {{#unless stop_loss_zones}}
                                    <div class="text-sm text-gray-500 italic">Không có dữ liệu</div>
                                    {{/unless}}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Risk-reward ratios -->
                {{#if risk_reward_ratios}}
                <div class="mb-6">
                    <h3 class="font-semibold mb-2 text-blue-700">Tỉ lệ Rủi ro/Lợi nhuận</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full border border-gray-200 bg-white rounded-lg">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Mua</th>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Cắt lỗ</th>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Chốt lời</th>
                                    <th class="px-4 py-2 text-center border-b border-gray-200">Tỉ lệ R/R</th>
                                    <th class="px-4 py-2 text-left border-b border-gray-200">Chất lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {{#each risk_reward_ratios}}
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-2 border-b border-gray-200 font-medium text-blue-700">{{buy_price}}</td>
                                    <td class="px-4 py-2 border-b border-gray-200 font-medium text-red-700">{{stop_loss_price}}</td>
                                    <td class="px-4 py-2 border-b border-gray-200 font-medium text-green-700">{{take_profit_price}}</td>
                                    <td class="px-4 py-2 border-b border-gray-200 font-bold text-center">{{ratio}}</td>
                                    <td class="px-4 py-2 border-b border-gray-200 text-sm">{{quality}}</td>
                                </tr>
                                {{/each}}
                            </tbody>
                        </table>
                    </div>
                </div>
                {{/if}}
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
    document.addEventListener('click', function (e) {
        const stockCard = e.target.closest('.stock-card, [data-symbol]');
        if (!stockCard) return;

        const symbol = stockCard.getAttribute('data-symbol');
        if (!symbol) return;

        openStockTab(symbol, stockDetailTemplate, true);
    });

    // Handle tab clicks
    tabList.addEventListener('click', function (e) {
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
