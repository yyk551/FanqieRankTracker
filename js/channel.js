/* 频道（女频 / 男频）共享工具
 *
 * 背景：本项目原先只服务女频，男频数据没有独立输出路径，
 * 跑一次男频就会覆盖看板；且赛道分组/题材词库写死为女频，
 * 导致男频在「风向标」里几乎没有分析内容。
 *
 * 本模块统一解决三件事：
 *   1. 当前频道（URL ?gender= > localStorage > female）
 *   2. 各频道对应的数据 / 接口路径（男女频完全隔离）
 *   3. 频道切换按钮 + 页面标题
 */
window.FQ = (function () {
    const STORAGE_KEY = 'fanqie_gender';
    const LABELS = { female: '女频', male: '男频' };

    // 与 scripts/build_latest.py 的 GENRE_GROUPS_BY_GENDER 保持一致
    const GENRE_GROUPS = {
        female: [
            { name: '古风言情', categories: ['古风世情', '古言脑洞', '宫斗宅斗', '种田'] },
            { name: '现代言情', categories: ['现言脑洞', '豪门总裁', '职场婚恋', '青春甜宠'] },
            { name: '幻想言情', categories: ['玄幻言情', '科幻末世', '悬疑脑洞', '女频悬疑'] },
            { name: '快穿衍生', categories: ['快穿', '女频衍生'] },
            { name: '年代民国', categories: ['年代', '民国言情'] },
            { name: '娱乐星光', categories: ['星光璀璨'] },
            { name: '游戏体育', categories: ['游戏体育'] },
        ],
        male: [
            { name: '玄幻仙侠', categories: ['东方仙侠', '传统玄幻', '玄幻脑洞', '西方奇幻'] },
            { name: '都市超能', categories: ['都市高武', '都市修真', '都市脑洞', '都市日常', '都市种田'] },
            { name: '历史军事', categories: ['历史古代', '历史脑洞', '抗战谍战'] },
            { name: '悬疑惊悚', categories: ['悬疑灵异', '悬疑脑洞'] },
            { name: '科幻末世', categories: ['科幻末世'] },
            { name: '都市爽文', categories: ['战神赘婿'] },
            { name: '游戏体育', categories: ['游戏体育'] },
            { name: '衍生同人', categories: ['动漫衍生', '男频衍生'] },
        ],
    };

    // 与 scripts/build_latest.py 的 MARKET_KEYWORDS_BY_GENDER 保持一致
    const MARKET_KEYWORDS = {
        female: [
            '重生', '穿书', '快穿', '系统', '空间', '团宠', '萌宝', '幼崽', '女配', '炮灰',
            '反派', '权臣', '宅斗', '宫斗', '和离', '替嫁', '逃荒', '种田', '美食', '经商',
            '年代', '七零', '八零', '军婚', '豪门', '总裁', '真假千金', '先婚后爱', '追妻',
            '甜宠', '双洁', '强制爱', '无CP', '末世', '废土', '天灾', '囤货', '异能',
            '国运', '星际', '修仙', '玄学', '无限流', '悬疑', '直播', '综艺', '娱乐圈',
            '校园', '暗恋', '青梅竹马', '民国', '兽世', '远古', '基建',
        ],
        male: [
            '系统', '面板', '词条', '模拟器', '签到', '打卡', '抽奖', '商城', '无敌', '开局',
            '扮猪吃虎', '苟道', '长生', '成神', '洪荒', '神话', '封神', '西游', '诸天', '万界',
            '无限流', '副本', '规则怪谈', '诡异', '克苏鲁', '恐怖', '灵异', '风水', '盗墓',
            '末世', '废土', '丧尸', '天灾', '囤货', '机甲', '星际', '虫族', '战舰', '赛博',
            '高武', '灵气复苏', '异能', '觉醒', '血脉', '天赋', '剑修', '修仙', '修真',
            '宗门', '炼丹', '御兽', '领主', '种田', '牧场', '渔猎', '美食', '经商',
            '年代', '抗战', '谍战', '军旅', '兵王', '战神', '赘婿', '龙王', '神豪', '逆袭',
            '打脸', '复仇', '直播', '网游', '全息', '电竞', '足球', '篮球', '神探', '探案',
            '中医', '医武', '都市', '校园', '二次元', '同人', '动漫', '火影', '海贼', '龙珠',
            '重生', '穿越', '转生', '反派', '无女主', '单女主', '后宫', '国运', '主神', '阵营',
        ],
    };

    function normalize(value) {
        return value === 'male' ? 'male' : (value === 'female' ? 'female' : null);
    }

    function gender() {
        const fromUrl = normalize(new URLSearchParams(window.location.search).get('gender'));
        if (fromUrl) return fromUrl;
        try {
            const saved = normalize(localStorage.getItem(STORAGE_KEY));
            if (saved) return saved;
        } catch (e) { /* 隐私模式下 localStorage 不可用 */ }
        return 'female';
    }

    function label(value) {
        return LABELS[normalize(value) || gender()];
    }

    function switchUrl(value) {
        const url = new URL(window.location.href);
        url.searchParams.set('gender', normalize(value) || 'female');
        return url.toString();
    }

    function setGender(value) {
        const next = normalize(value) || 'female';
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
        window.location.href = switchUrl(next);
        return next;
    }

    /** 返回当前（或指定）频道的数据路径集合 */
    function paths(value) {
        const current = normalize(value) || gender();
        const isMale = current === 'male';
        return {
            gender: current,
            isMale: isMale,
            label: LABELS[current],
            dates: isMale ? 'data/dates_male.json' : 'data/dates.json',
            latest: isMale ? 'data/latest_ranks_male.json' : 'data/latest_ranks.json',
            market: isMale ? 'data/market_summary_male.json' : 'data/market_summary.json',
            apiIndex: isMale ? 'api/lastest_male.json' : 'api/lastest.json',
            apiAll: isMale ? 'api/lastest_male/all.json' : 'api/lastest/all.json',
            trendDir: isMale ? 'data/trends_male' : 'data/trends',
            trendFile: function (date) {
                return (isMale ? 'data/trends_male/' : 'data/trends/') + date + '.json';
            },
            snapshot: function (date) {
                return 'data/fanqie_' + current + '_new_ranks_' +
                    String(date || '').replace(/-/g, '') + '.json';
            },
            genreGroups: GENRE_GROUPS[current],
            keywords: MARKET_KEYWORDS[current],
        };
    }

    /** 在容器里渲染「女频 / 男频」切换按钮 */
    function mountSwitch(container) {
        if (!container) return;
        container.className = 'channel-switch';
        const current = gender();
        container.innerHTML = ['female', 'male'].map(function (item) {
            return '<button class="channel-btn' + (item === current ? ' active' : '') +
                '" type="button" data-gender="' + item + '" aria-pressed="' +
                (item === current) + '">' + LABELS[item] + '</button>';
        }).join('');
        container.querySelectorAll('button[data-gender]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const next = btn.dataset.gender;
                if (next === current) return;
                setGender(next);
            });
        });
    }

    /** 按频道刷新页面标题（含 <title> 与 og/描述里的频道词） */
    function applyTitle(pageTitle) {
        const text = (pageTitle || document.title).replace(/女频|男频/g, LABELS[gender()]);
        document.title = text;
        const desc = document.querySelector('meta[name="description"]');
        if (desc) {
            desc.setAttribute('content', desc.getAttribute('content').replace(/女频|男频/g, LABELS[gender()]));
        }
    }

    /** 站内跳转链接统一带上 ?gender=，避免详情页/风向标串频道 */
    function syncLinks() {
        const current = gender();
        document.querySelectorAll('a[href]').forEach(function (link) {
            const href = link.getAttribute('href') || '';
            if (!/^(index|trend|book|shorts)\.html(\?|$)/.test(href)) return;
            const url = new URL(href, window.location.href);
            if (url.searchParams.get('gender')) return;
            url.searchParams.set('gender', current);
            link.setAttribute('href', url.pathname.split('/').pop() + url.search);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncLinks);
    } else {
        syncLinks();
    }

    return {
        gender: gender,
        label: label,
        setGender: setGender,
        switchUrl: switchUrl,
        paths: paths,
        mountSwitch: mountSwitch,
        applyTitle: applyTitle,
        syncLinks: syncLinks,
        GENRE_GROUPS: GENRE_GROUPS,
        MARKET_KEYWORDS: MARKET_KEYWORDS,
        LABELS: LABELS,
    };
})();
