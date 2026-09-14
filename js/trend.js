document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.getElementById('trend-category-buttons');
    const subtitle = document.getElementById('trend-subtitle');
    const rangeButtons = document.querySelectorAll('.range-btn');
    const cacheBuster = `v=${Math.floor(Date.now() / 600000)}`;
    const CH = window.FQ.paths();      // 当前频道（女频/男频）的数据路径

    let categories = [];
    let trendRows = [];
    let latestData = null;
    let marketSummaryData = null;
    let selectedCategory = '';
    let selectedDays = 7;

    // 赛道分组与题材词库按频道取（女频/男频各一套，见 js/channel.js）
    const genreGroups = CH.genreGroups;

    window.FQ.mountSwitch(document.getElementById('channel-switch'));
    window.FQ.applyTitle();
    const trendHeading = document.querySelector('.trend-topbar h1');
    if (trendHeading) trendHeading.textContent = `类型风向标 · ${CH.label}`;

    const els = {
        marketSummary: document.getElementById('market-summary'),
        marketSource: document.getElementById('market-source'),
        hotGenres: document.getElementById('hot-genre-list'),
        hotTypes: document.getElementById('hot-type-list'),
        hotThemes: document.getElementById('hot-theme-list'),
        newBooks: document.getElementById('new-books-list'),
        risers: document.getElementById('risers-list'),
        reads: document.getElementById('reads-list'),
        summaries: document.getElementById('summary-feed'),
    };

    init();

    async function init() {
        try {
            const [dateIndex, latestIndex, latestAll, marketSummary] = await Promise.all([
                fetchJson(`${CH.dates}?${cacheBuster}`),
                fetchJson(`${CH.apiIndex}?${cacheBuster}`).catch(() => null),
                fetchJson(`${CH.apiAll}?${cacheBuster}`)
                    .catch(() => fetchJson(`${CH.latest}?${cacheBuster}`).catch(() => null)),
                fetchJson(`${CH.market}?${cacheBuster}`).catch(() => null),
            ]);
            latestData = latestAll;
            marketSummaryData = marketSummary;

            categories = latestIndex && latestIndex.types
                ? latestIndex.types.filter(item => item.type !== 'all').map(item => item.type)
                : await loadCategoriesFallback();

            const dates = (dateIndex.dates || []).slice().sort();
            // 首个日期不再跳过：首日快照现在也会生成摘要与首日口径热点，
            // 男频刚开始积累时只有一天数据，跳过就会整页空白。
            const trendDates = dates.slice();
            const trendFiles = await Promise.all(
                trendDates.map(date => fetchJson(`${CH.trendFile(date)}?${cacheBuster}`).catch(() => null))
            );
            trendRows = trendFiles
                .filter(Boolean)
                .map(item => ({ date: item.date, prevDate: item.prev_date, trends: item.trends || {} }))
                .sort((a, b) => a.date.localeCompare(b.date));

            if (trendRows.length === 0 || categories.length === 0) {
                renderEmpty('暂无可分析的趋势数据。');
                return;
            }

            selectedCategory = getInitialCategory();
            renderCategoryButtons();
            bindEvents();
            render();
        } catch (err) {
            console.error(err);
            renderEmpty('趋势数据加载失败，请稍后刷新重试。');
        }
    }

    async function loadCategoriesFallback() {
        const latest = await fetchJson(`${CH.latest}?${cacheBuster}`);
        return (latest.categories || []).map(cat => cat.name);
    }

    function fetchJson(url) {
        return fetch(url).then(response => {
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            return response.json();
        });
    }

    function bindEvents() {
        rangeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                rangeButtons.forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                selectedDays = btn.dataset.days === 'all' ? 'all' : Number(btn.dataset.days);
                render();
            });
        });
    }

    function getInitialCategory() {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        return categories.includes(type) ? type : categories[0];
    }

    function renderCategoryButtons() {
        categoryButtons.innerHTML = categories.map(name => `
            <button class="category-chip${name === selectedCategory ? ' active' : ''}" type="button" data-type="${escapeAttr(name)}">
                ${escapeHtml(name)}
            </button>
        `).join('');

        categoryButtons.querySelectorAll('.category-chip').forEach(btn => {
            btn.addEventListener('click', () => selectCategory(btn.dataset.type));
        });
    }

    function selectCategory(type) {
        if (!categories.includes(type)) return;
        selectedCategory = type;
        const url = new URL(window.location.href);
        url.searchParams.set('type', selectedCategory);
        history.replaceState(null, '', url);
        renderCategoryButtons();
        render();
    }

    function render() {
        const rows = getWindowRows()
            .map(row => ({
                date: row.date,
                prevDate: row.prevDate,
                trend: row.trends[selectedCategory] || null,
            }))
            .filter(row => row.trend);

        if (rows.length === 0) {
            renderEmpty(`${selectedCategory} 暂无趋势数据。`);
            return;
        }

        const windowRows = getWindowRows();
        subtitle.textContent = `${selectedCategory} · ${rows[0].date} 至 ${rows[rows.length - 1].date} · ${rows.length} 个观察日`
            + (rows.length === 1 ? '（首日快照，暂无对比）' : '');

        renderMarketBoard(windowRows);
        renderList(els.reads, collectReads(rows));
        renderList(els.newBooks, collectNewBooks(rows));
        renderList(els.risers, collectRisers(rows));
        renderSummaries(rows);
    }

    function getWindowRows() {
        if (selectedDays === 'all') return trendRows;
        return trendRows.slice(-selectedDays);
    }

    function summarizeRows(rows) {
        return rows.reduce((acc, row) => {
            const trend = row.trend;
            const riserCount = (trend.top_risers || []).length;
            const fallerCount = (trend.top_fallers || []).length;
            const readCount = (trend.reads_growth || []).length;
            const readGrowthTotal = (trend.reads_growth || []).reduce((sum, item) => sum + parseReadsGrowth(item.growth), 0);
            acc.newCount += Number(trend.new_count || 0);
            acc.droppedCount += Number(trend.dropped_count || 0);
            acc.riserCount += riserCount;
            acc.fallerCount += fallerCount;
            acc.readCount += readCount;
            acc.readGrowthTotal += readGrowthTotal;
            if ((trend.new_count || 0) || (trend.dropped_count || 0) || riserCount || fallerCount || readCount) {
                acc.activeDays += 1;
            }
            return acc;
        }, { newCount: 0, droppedCount: 0, riserCount: 0, fallerCount: 0, readCount: 0, readGrowthTotal: 0, activeDays: 0 });
    }

    function renderMarketBoard(rowsWindow) {
        let hotGenres = collectHotGenres(rowsWindow);
        let hotTypes = collectHotTypes(rowsWindow);
        let hotThemes = collectHotThemes(rowsWindow);

        const summaryData = getMarketSummaryForPeriod();
        let basis = 'growth';

        // 首日或缺少对比数据时（男频刚接入的常见状态），
        // 前端算不出“阅读增长”，此时改用后端按「当前在读总量」算好的快照口径，
        // 否则整块热点板会直接显示“暂无足够数据”。
        if (!hotTypes.length && summaryData && (summaryData.hot_types || []).length) {
            basis = summaryData.basis || 'snapshot';
            hotTypes = summaryData.hot_types.map(item => ({
                name: item.name,
                score: item.score,
                readCount: item.read_count || 0,
                readGrowthTotal: item.read_growth_total || 0,
            }));
            hotGenres = (summaryData.hot_genres || []).map(item => ({
                name: item.name,
                readCount: item.read_count || 0,
                readGrowthTotal: item.read_growth_total || 0,
                categoryText: (item.categories || []).join(' / ') || item.lead_category || '',
            }));
            hotThemes = (summaryData.hot_themes || []).map(item => ({
                name: item.name,
                count: item.count,
                categoryCount: item.category_count || 0,
            }));
        }

        if (!hotTypes.length) {
            els.marketSummary.textContent = '暂无足够数据判断全站热点。';
            els.marketSource.textContent = '暂无数据';
            els.hotGenres.innerHTML = '<p class="muted-line">暂无数据。</p>';
            els.hotTypes.innerHTML = '<p class="muted-line">暂无数据。</p>';
            els.hotThemes.innerHTML = '<p class="muted-line">暂无数据。</p>';
            return;
        }

        const isSnapshot = basis === 'snapshot';
        const metricLabel = isSnapshot ? '当前在读' : '新增在读';
        const topGenres = hotGenres.slice(0, 2).map(item => item.name).join('、');
        const topTypes = hotTypes.slice(0, 3).map(item => item.name).join('、');
        const topThemes = hotThemes.slice(0, 6).map(item => item.name).join('、');
        const period = selectedDays === 'all' ? '全部样本' : `近 ${selectedDays} 日`;
        const fallbackSummary = isSnapshot
            ? `${period}暂无对比数据，按当前在读总量看，${topGenres || topTypes} 更集中，具体分类以 ${topTypes} 领先；题材上 ${topThemes} 高频。`
            : `${period}里，${topGenres || topTypes} 的阅读增长更强，具体分类以 ${topTypes} 的新增在读更集中；新书题材上 ${topThemes} 更高频，说明读者仍偏好强设定、强情绪钩子和明确爽点。`;
        els.marketSummary.textContent = summaryData ? summaryData.summary : fallbackSummary;
        const sourceLabel = summaryData && summaryData.source === 'ai' ? 'AI 总结' : '规则统计';
        els.marketSource.textContent = `${sourceLabel} · ${(summaryData && summaryData.period) || period}` +
            (isSnapshot ? ' · 首日在读口径' : '');

        els.hotGenres.innerHTML = hotGenres.slice(0, 5).map((item, index) => `
            <div class="hot-type-row hot-type-row-static genre-row">
                <span>${index + 1}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.categoryText || '')} · ${metricLabel} ${formatReads(item.readGrowthTotal, isSnapshot)} · 作品 ${item.readCount}</small>
                <em>${formatReads(item.readGrowthTotal, isSnapshot)}</em>
            </div>
        `).join('');

        els.hotTypes.innerHTML = hotTypes.slice(0, 6).map((item, index) => `
            <button class="hot-type-row" type="button" data-type="${escapeAttr(item.name)}">
                <span>${index + 1}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${metricLabel} ${formatReads(item.readGrowthTotal, isSnapshot)} · 作品 ${item.readCount}</small>
                <em>${formatReads(item.readGrowthTotal, isSnapshot)}</em>
            </button>
        `).join('');

        els.hotTypes.querySelectorAll('.hot-type-row').forEach(btn => {
            btn.addEventListener('click', () => {
                selectCategory(btn.dataset.type);
            });
        });

        els.hotThemes.innerHTML = hotThemes.slice(0, 14).map(item => `
            <span class="theme-chip" title="新书 ${item.count} 本，覆盖 ${themeCategoryCount(item)} 个类型">
                ${escapeHtml(item.name)} <small>${item.count}</small>
            </span>
        `).join('');
    }

    function themeCategoryCount(item) {
        if (item && item.categories && typeof item.categories.size === 'number') {
            return item.categories.size;
        }
        return (item && item.categoryCount) || 0;
    }

    function collectHotGenres(rowsWindow) {
        const hotTypes = collectHotTypes(rowsWindow);
        const hotTypeMap = new Map(hotTypes.map(item => [item.name, item]));

        return genreGroups.map(group => {
            const matched = group.categories
                .filter(name => categories.includes(name))
                .map(name => hotTypeMap.get(name) || {
                    name,
                    score: 0,
                    newCount: 0,
                    droppedCount: 0,
                    readCount: 0,
                    readGrowthTotal: 0,
                    activeDays: 0,
                });

            const score = matched.reduce((sum, item) => sum + item.score, 0);
            const lead = matched.slice().sort((a, b) => b.score - a.score)[0];
            return {
                name: group.name,
                score,
                newCount: matched.reduce((sum, item) => sum + item.newCount, 0),
                droppedCount: matched.reduce((sum, item) => sum + item.droppedCount, 0),
                readCount: matched.reduce((sum, item) => sum + item.readCount, 0),
                readGrowthTotal: matched.reduce((sum, item) => sum + item.readGrowthTotal, 0),
                activeDays: matched.reduce((sum, item) => sum + item.activeDays, 0),
                leadCategory: lead ? lead.name : group.categories[0],
                categoryText: matched.map(item => item.name).join(' / '),
            };
        })
            .filter(item => item.score > 0 && item.leadCategory)
            .sort((a, b) => b.score - a.score);
    }

    function collectHotTypes(rowsWindow) {
        return categories.map(name => {
            const rows = rowsWindow
                .map(row => ({ trend: row.trends[name] || null }))
                .filter(row => row.trend);
            const totals = summarizeRows(rows);
            return {
                name,
                score: totals.readGrowthTotal,
                newCount: totals.newCount,
                droppedCount: totals.droppedCount,
                readCount: totals.readCount,
                readGrowthTotal: totals.readGrowthTotal,
                activeDays: totals.activeDays,
            };
        })
            .filter(item => item.readGrowthTotal > 0)
            .sort((a, b) => b.readGrowthTotal - a.readGrowthTotal || b.readCount - a.readCount);
    }

    function collectHotThemes(rowsWindow) {
        const keywords = CH.keywords;
        const scoreMap = new Map(keywords.map(name => [name, { name, count: 0, categories: new Set() }]));

        const latestBookMap = buildLatestBookMap();

        rowsWindow.forEach(row => {
            categories.forEach(catName => {
                const trend = row.trends[catName];
                if (!trend) return;
                (trend.new_books || []).forEach(title => {
                    const book = latestBookMap.get(title) || {};
                    addThemeHits(scoreMap, keywords, `${title} ${book.intro || ''}`, catName, 1);
                });
            });
        });

        return Array.from(scoreMap.values())
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count || b.categories.size - a.categories.size);
    }

    function buildLatestBookMap() {
        const bookMap = new Map();
        const latestCategories = latestData && latestData.categories ? latestData.categories : [];
        latestCategories.forEach(cat => {
            (cat.books || []).forEach(book => {
                if (book.title) bookMap.set(book.title, book);
            });
        });
        return bookMap;
    }

    function extractBookId(url) {
        const match = String(url || '').match(/\/page\/(\d+)/);
        return match ? match[1] : '';
    }

    function addThemeHits(scoreMap, keywords, text, categoryName, weight) {
        const source = String(text || '');
        if (!source) return;
        keywords.forEach(keyword => {
            if (!source.includes(keyword)) return;
            const item = scoreMap.get(keyword);
            item.count += weight;
            item.categories.add(categoryName);
        });
    }

    function collectNewBooks(rows) {
        const items = [];
        rows.slice().reverse().forEach(row => {
            (row.trend.new_books || []).forEach(title => {
                items.push({ title, meta: row.date, value: '新上榜' });
            });
        });
        return items.slice(0, 12);
    }

    function collectRisers(rows) {
        const scoreMap = new Map();
        rows.forEach(row => {
            (row.trend.top_risers || []).forEach(item => {
                const current = scoreMap.get(item.title) || { title: item.title, score: 0, dates: [] };
                current.score += parseChange(item.change);
                current.dates.push(`${row.date} ${item.change}`);
                scoreMap.set(item.title, current);
            });
        });
        return Array.from(scoreMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => ({ title: item.title, meta: item.dates.slice(-2).join(' / '), value: `+${item.score}` }));
    }

    function collectReads(rows) {
        const scoreMap = new Map();
        rows.forEach(row => {
            (row.trend.reads_growth || []).forEach(item => {
                const current = scoreMap.get(item.title) || { title: item.title, score: 0, dates: [] };
                current.score += parseReadsGrowth(item.growth);
                current.dates.push(`${row.date} ${item.growth}`);
                scoreMap.set(item.title, current);
            });
        });
        return Array.from(scoreMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(item => ({ title: item.title, meta: item.dates.slice(-2).join(' / '), value: formatReads(item.score) }));
    }

    function renderList(container, items) {
        if (!items.length) {
            // 只有首日快照时（男频刚接入的常见状态）说清楚"为什么这里是空的"，
            // 而不是笼统地写"暂无明显信号"。
            const hasComparison = trendRows.some(row => {
                const trend = row.trends[selectedCategory] || {};
                return (trend.new_count || 0) > 0
                    || (trend.top_risers || []).length > 0
                    || (trend.reads_growth || []).length > 0;
            });
            container.innerHTML = hasComparison
                ? '<p class="muted-line">暂无明显信号。</p>'
                : `<p class="muted-line">${escapeHtml(selectedCategory)} 目前只有首日快照，暂无对比数据；再更新一天后，这里会显示新上榜、排名上升与在读增长。</p>`;
            return;
        }

        const latestBookMap = buildLatestBookMap();

        container.innerHTML = items.map(item => {
            const book = latestBookMap.get(item.title) || {};
            const bookId = extractBookId(book.url);
            const detailUrl = bookId
                ? `book.html?id=${encodeURIComponent(bookId)}&gender=${CH.gender}`
                : `book.html?title=${encodeURIComponent(item.title)}&gender=${CH.gender}`;

            return `
            <a class="compact-row compact-row-link" href="${detailUrl}" target="_blank" rel="noopener noreferrer">
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <small>${escapeHtml(item.meta)}</small>
                </div>
                <span>${escapeHtml(item.value)}</span>
            </a>
        `;
        }).join('');
    }

    function renderSummaries(rows) {
        const rowsWithSummary = rows
            .slice()
            .reverse()
            .filter(row => row.trend.summary)
            .slice(0, 10);

        if (!rowsWithSummary.length) {
            els.summaries.innerHTML = '<p class="muted-line">暂无摘要数据。</p>';
            return;
        }

        els.summaries.innerHTML = rowsWithSummary.map(row => `
            <article class="summary-item">
                <time>${escapeHtml(row.date)}</time>
                <div>${renderMarkdown(row.trend.summary)}</div>
            </article>
        `).join('');
    }

    function renderEmpty(message) {
        subtitle.textContent = message;
        els.marketSummary.textContent = message;
        els.marketSource.textContent = '暂无数据';
        els.hotGenres.innerHTML = '<p class="muted-line">暂无数据。</p>';
        els.hotTypes.innerHTML = '<p class="muted-line">暂无数据。</p>';
        els.hotThemes.innerHTML = '<p class="muted-line">暂无数据。</p>';
        [els.newBooks, els.risers, els.reads, els.summaries].forEach(el => {
            el.innerHTML = '<p class="muted-line">暂无数据。</p>';
        });
    }

    function parseChange(value) {
        return Number(String(value || '0').replace('+', '')) || 0;
    }

    function getMarketSummaryForPeriod() {
        if (!marketSummaryData || !marketSummaryData.periods) return null;
        const key = selectedDays === 'all' ? 'all' : String(selectedDays);
        const item = marketSummaryData.periods[key];
        if (!item || !item.summary) return null;
        return item;
    }

    function parseReadsGrowth(value) {
        const raw = String(value || '0').replace('+', '').replace(',', '').trim();
        const num = parseFloat(raw);
        if (Number.isNaN(num)) return 0;
        return raw.includes('万') ? num * 10000 : num;
    }

    function formatReads(value, plain) {
        const prefix = plain ? '' : '+';
        if (value >= 10000) return `${prefix}${(value / 10000).toFixed(1)}万`;
        return `${prefix}${Math.round(value)}`;
    }

    function renderMarkdown(text) {
        let html = escapeHtml(text);
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/《(.+?)》/g, '<span class="book-mark">《$1》</span>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function escapeAttr(str) {
        return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
});
