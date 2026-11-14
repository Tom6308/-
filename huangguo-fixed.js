// 黄果短剧 —— Forward / Rex 模块版（合并版 v1.1.0）
//
// 合并了两份源：
//   upload.js（Node 服务器版）—— 4 个 slug 分类、排行榜、搜索多页重排、
//     播放 HEVC 备用线路；
//   AI.py（HiPy 本地版）—— 热门 / 最新、标签分类（都市 / 古风 / 修仙 /
//     甜宠）、详情集数格式、播放 300 秒缓存、封面 drleao 去 query。
// 两个原版都不能直接导入播放器（Node 的 require / axios / Buffer /
// crypto，和 Python 的 HiPy spider 都不认），这一版统一改成 Forward 模块，
// 只走 Widget.http（这个站全是 JSON 接口）。
//
// 两个绕不过去的限制，先说清楚：
//   1) 播放：原版靠服务端中转解密 AES-128 HLS 再喂给播放器，模块里没有
//      服务器，做不了中转。这一版直接返回站点刚签发的 m3u8 直链
//      （/api/videos/{id}/play?ep=N，每次播放都重新拿，auth_key 是新的，
//      同一集 300 秒内复用缓存），播放器如果支持 AES-128 HLS 就能播，
//      不支持就是黑屏——这是这个源在 App 里能做到的上限。
//   2) 封面：封面图本身是 AES-CBC 密文，原版靠服务端 / 本地代理解密后才显示，
//      模块里 Widget.http 拿不到二进制，也没法把解密后的图交给 App，
//      所以海报大概率显示不出来（或显示异常），不影响点开看和播。
// 接口：https://huangguoai.com，免登录。

// ============ WidgetMetadata（必须放在文件开头） ============
var WidgetMetadata = {
    id: "com.huangguo",
    title: "黄果短剧",
    description: "黄果短剧（AI短剧），合并版，封面走 Netlify 函数中转",
    author: "Tom",
    site: "https://huangguoai.com",
    version: "1.1.3",
    requiredVersion: "0.0.1",
    detailCacheDuration: 0,
    globalParams: [
        { name: "coverServer", title: "封面中转地址", type: "input", value: "https://rococo-entremet-86855d.netlify.app", description: "默认已填好，不用改；换了 Worker 地址再改这里" }
    ],
    modules: [
        { id: "hot", title: "热门", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "hot" }, { name: "page", title: "页码", type: "page", value: "1" }, { name: "sort", title: "排序", type: "enumeration", value: "", enumOptions: [{ title: "默认", value: "" }, { title: "热门", value: "hot" }, { title: "最新", value: "new" }] }] },
        { id: "new", title: "最新", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "new" }, { name: "page", title: "页码", type: "page", value: "1" }, { name: "sort", title: "排序", type: "enumeration", value: "", enumOptions: [{ title: "默认", value: "" }, { title: "热门", value: "hot" }, { title: "最新", value: "new" }] }] },
        { id: "rank-hot", title: "热播榜", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "__rank_hot__" }, { name: "page", title: "页码", type: "page", value: "1" }] },
        { id: "rank-rec", title: "推荐榜", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "__rank_recommend__" }, { name: "page", title: "页码", type: "page", value: "1" }] },
        { id: "rank-pot", title: "潜力榜", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "__rank_potential__" }, { name: "page", title: "页码", type: "page", value: "1" }] },
        { id: "duanju", title: "AI成人短剧", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "ai-duanju" }, { name: "page", title: "页码", type: "page", value: "1" }] },
        { id: "manju", title: "AI成人漫剧", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "ai-manju" }, { name: "page", title: "页码", type: "page", value: "1" }] },
        { id: "huanlian", title: "AI换脸", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "ai-huanlian" }, { name: "page", title: "页码", type: "page", value: "1" }] },
        { id: "mogai", title: "AI魔改", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "ai-mogai" }, { name: "page", title: "页码", type: "page", value: "1" }] },
        { id: "tag-dushi", title: "都市", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "tag:都市" }, { name: "page", title: "页码", type: "page", value: "1" }, { name: "sort", title: "排序", type: "enumeration", value: "", enumOptions: [{ title: "默认", value: "" }, { title: "热门", value: "hot" }, { title: "最新", value: "new" }] }] },
        { id: "tag-gufeng", title: "古风", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "tag:古风" }, { name: "page", title: "页码", type: "page", value: "1" }, { name: "sort", title: "排序", type: "enumeration", value: "", enumOptions: [{ title: "默认", value: "" }, { title: "热门", value: "hot" }, { title: "最新", value: "new" }] }] },
        { id: "tag-xiuxian", title: "修仙", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "tag:修仙" }, { name: "page", title: "页码", type: "page", value: "1" }, { name: "sort", title: "排序", type: "enumeration", value: "", enumOptions: [{ title: "默认", value: "" }, { title: "热门", value: "hot" }, { title: "最新", value: "new" }] }] },
        { id: "tag-tianchong", title: "甜宠", functionName: "loadList", sectionMode: false, cacheDuration: 0, params: [{ name: "type", title: "分类", type: "constant", value: "tag:甜宠" }, { name: "page", title: "页码", type: "page", value: "1" }, { name: "sort", title: "排序", type: "enumeration", value: "", enumOptions: [{ title: "默认", value: "" }, { title: "热门", value: "hot" }, { title: "最新", value: "new" }] }] },
        { id: "loadResource", title: "播放资源", functionName: "loadResource", type: "stream", params: [] }
    ],
    search: { functionName: "search" }
};

// ============ 配置 ============
var SITE = "https://huangguoai.com";
var COVER_SERVER = ""; // 由 loadList/search/loadDetail 从 params.coverServer 传入
function _coverServer(params) {
    var v = "";
    if (params && params.coverServer) v = String(params.coverServer);
    else if (typeof WidgetMetadata !== "undefined" && WidgetMetadata.globalParams) v = String(WidgetMetadata.globalParams[0].value || "");
    return v.replace(/\/+$/, "");
}
var UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36";
var PAGE_SIZE = 24;
var playCache = new Map(); // "vid|ep" -> {url, hevc, exp}，300 秒（照 AI.py）

// ============ 网络：只走 Widget.http ============
async function apiGet(path, params) {
    var url = SITE + path;
    var qs = [];
    if (params) for (var k in params) qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    if (qs.length) url += (url.indexOf("?") === -1 ? "?" : "&") + qs.join("&");
    var res = await Widget.http.get(url, { headers: { "User-Agent": UA, "Referer": SITE + "/", "Origin": SITE, "Accept": "application/json, text/plain, */*" } });
    var data = res && res.data !== undefined ? res.data : res;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (e) { throw new Error("响应异常"); } }
    var d = data && data.data;
    if (d === undefined) throw new Error((data && data.msg) || "响应异常");
    return d;
}
function toStr(v, fallback) { return v == null || v === "" ? String(fallback || "") : String(v); }
function toNum(v, fallback) { var n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : fallback; }
function cleanId(v) { return toStr(v).replace("hgai:", "").split("|")[0].trim(); }
// 封面：照 AI.py，drleao.cn 的去掉 query（auth_key 约 2 小时过期），其余原样
function picUrl(item) {
    var pic = toStr(item.cover || item.vod_pic || item.pic || "").trim();
    if (!pic) return "";
    if (pic.indexOf("//") === 0) pic = "https:" + pic;
    else if (pic.indexOf("/") === 0) pic = SITE + pic;
    else if (pic.indexOf("http") !== 0) pic = SITE + "/" + pic;
    try {
        var host = pic.split("/")[2] || "";
        if (host.toLowerCase().indexOf("drleao.cn") !== -1) pic = pic.split("?")[0];
    } catch (e) {}
    // 配了封面中转就走中转解密，App 原生加载真 JPEG；没配就返回原地址（没封面）
    // Workers/Pages 版中转在根路径 /?u=，Netlify 版函数在 /.netlify/functions/cover?u=
    if (COVER_SERVER) {
        var base = COVER_SERVER.replace(/\/+$/, "");
        if (base.indexOf("/.netlify/functions/cover") === -1 && base.indexOf("netlify.app") !== -1) base += "/.netlify/functions/cover";
        return base + "?u=" + encodeURIComponent(pic);
    }
    return pic;
}
// 备注：照 AI.py，全X集 / 更新至X集 / 评分X
function remark(item) {
    var count = toNum(item.episode_count || item.total_episodes, 0);
    if (count) return (item.is_finished ? "全" + count + "集" : "更新至" + count + "集");
    var score = item.score;
    return score ? "评分" + score : "";
}
function mapListItem(it) {
    if (!it) return null;
    var id = toStr(it.id || it.video_id || it.vod_id || "").trim();
    var name = toStr(it.title || it.name || id);
    if (!id || !name) return null;
    return { vod_id: id, vod_name: name, vod_pic: picUrl(it), vod_remarks: remark(it) };
}

// ============ 业务层（两份源合并） ============
async function getVideoPage(page, sort) {
    var r = await apiGet("/api/videos", { page: page, page_size: PAGE_SIZE, sort: sort === "new" ? "new" : "hot" });
    var items = (r && r.items) || (r && r.list) || [];
    return { list: items.map(mapListItem).filter(function (x) { return x; }), raw: items };
}
async function getRank(api) {
    var r = await apiGet("/api/ranks/" + api);
    var items = (r && r.items) || [];
    var list = items.map(function (it) {
        if (!it) return null;
        var id = toStr(it.video_id);
        if (!id) return null;
        return {
            vod_id: id, vod_name: toStr(it.title), vod_pic: picUrl(it),
            vod_remarks: (it.metric_label || "") + (it.metric_value != null ? "·" + it.metric_value : "")
        };
    }).filter(function (x) { return x; });
    return { list: list };
}
async function getSlugCategory(slug, pg) {
    var r = await apiGet("/api/videos/category/" + slug, { page: pg, size: PAGE_SIZE, sort: "hot" });
    var items = (r && r.items) || [];
    var pag = (r && r.pagination) || {};
    return {
        list: items.map(mapListItem).filter(function (x) { return x; }),
        pagecount: toNum(pag.pages, pg), total: toNum(pag.total, 0)
    };
}
async function getTagPage(keyword, pg, sort) {
    var r = await apiGet("/api/search", { q: keyword, page: pg, size: PAGE_SIZE });
    var items = (r && r.items) || [];
    var pag = (r && r.pagination) || {};
    if (sort === "new") {
        items.sort(function (a, b) { return String(b.created_at || "").localeCompare(String(a.created_at || "")); });
    } else if (sort === "hot") {
        items.sort(function (a, b) { return toNum(b.hot, 0) - toNum(a.hot, 0); });
    }
    return {
        list: items.map(mapListItem).filter(function (x) { return x; }),
        pagecount: toNum(pag.pages, pg), total: toNum(pag.total, 0)
    };
}
function normEpName(ep, n) {
    var raw = toStr(ep && ep.title).trim();
    if (!raw || /^(第\s*\d+\s*集|\d+)$/.test(raw)) return "第" + n + "集";
    if (/^第[0-9\u4e00-\u9fa5]{1,3}集$/.test(raw)) return raw;
    var numTail = raw.match(/(?:^|[^0-9])(\d{1,3})\s*$/);
    if (numTail && parseInt(numTail[1], 10) === n) return "第" + n + "集";
    if (raw.length > 40) return "第" + n + "集";
    return raw.replace(/[$#]/g, " ");
}
async function getDetail(idList) {
    var out = [];
    var ids = Array.isArray(idList) ? idList : [idList];
    for (var i = 0; i < ids.length; i++) {
        var id = cleanId(ids[i]);
        if (!id) continue;
        var info = await apiGet("/api/videos/" + encodeURIComponent(id)) || {};
        var episodes = Array.isArray(info.episodes) ? info.episodes : [];
        // 集数格式照 AI.py："第N集$vid|ep_num"
        var plays = episodes.map(function (ep, idx) {
            var num = ep.ep_num || ep.episode || ep.seq || (idx + 1);
            var title = toStr(ep.title || ("第" + num + "集")).trim();
            return normEpName(ep, num) + "$" + id + "|" + num;
        });
        if (!plays.length) {
            var count = toNum(info.episode_count || info.total_episodes, 1);
            for (var n = 1; n <= count; n++) plays.push("第" + n + "集$" + id + "|" + n);
        }
        var tags = (info.tags || []).join("/");
        var actor = (info.actors || []).map(function (x) { return toStr(x); }).join("/");
        out.push({
            vod_id: id, vod_name: toStr(info.title || info.name || id), vod_pic: picUrl(info),
            vod_remarks: remark(info), type_name: tags,
            vod_actor: actor, vod_director: "",
            vod_content: toStr(info.description),
            vod_play_from: "黄果短剧", vod_play_url: plays.join("#")
        });
    }
    return { list: out };
}
async function getSearch(wd, pg) {
    var kw = toStr(wd).trim();
    if (!kw) return { list: [] };
    var page = Math.max(1, parseInt(pg, 10) || 1);
    var kwLower = kw.toLowerCase();
    function rank(it) {
        var t = toStr(it && it.title).toLowerCase();
        if (t === kwLower) return 0;
        if (t.indexOf(kwLower) === 0) return 1;
        if (t.indexOf(kwLower) !== -1) return 2;
        return 3;
    }
    var FETCH_SIZE = 50;
    var need = Math.min(Math.max(page, 1), 5);
    var raw = [], total = 0;
    for (var p = 1; p <= need; p++) {
        var r = await apiGet("/api/search", { q: kw, page: p, size: FETCH_SIZE });
        var items = (r && r.items) || [];
        var pag = (r && r.pagination) || {};
        total = toNum(pag.total, total || items.length);
        if (!items.length) break;
        raw = raw.concat(items);
        if (raw.length >= need * FETCH_SIZE) break;
        if (total && raw.length >= total) break;
    }
    raw.sort(function (a, b) { return rank(a) - rank(b); });
    var pages = Math.min(Math.max(1, Math.ceil((total || raw.length) / PAGE_SIZE)), Math.max(1, Math.ceil(raw.length / PAGE_SIZE)));
    var start = (page - 1) * PAGE_SIZE;
    return { page: page, limit: PAGE_SIZE, pagecount: pages, total: total || raw.length, list: raw.slice(start, start + PAGE_SIZE).map(mapListItem).filter(function (x) { return x; }) };
}
async function getPlayUrl(vid, ep) {
    var key = vid + "|" + ep;
    var cached = playCache.get(key);
    if (cached && Date.now() < cached.exp) return cached;
    var d = await apiGet("/api/videos/" + encodeURIComponent(vid) + "/play", { ep: String(ep) });
    var out = { url: toStr(d && (d.video_url || d.play_url || d.url)), hevc: toStr(d && d.video_url_hevc), exp: Date.now() + 300 * 1000 };
    if (out.url) playCache.set(key, out);
    return out;
}

// ============ Forward 适配 ============
function _toVideoItem(v) {
    return {
        id: String(v.vod_id || ""), type: "url", title: v.vod_name || "",
        coverUrl: v.vod_pic || "", posterPath: v.vod_pic || "", backdropPath: v.vod_pic || "",
        releaseDate: v.vod_year || "", mediaType: "tv", genreTitle: v.vod_class || "",
        description: v.vod_content || "", link: String(v.vod_id || "")
    };
}
async function loadList(params) {
    COVER_SERVER = _coverServer(params);
    var type = String(params.type || "hot");
    var pg = parseInt(params.page) || 1;
    var sort = String(params.sort || "");
    var r;
    if (type === "hot" || type === "new") {
        r = await getVideoPage(pg, sort || type);
    } else if (type.indexOf("__rank_") === 0) {
        var api = type === "__rank_recommend__" ? "recommend" : type === "__rank_potential__" ? "potential" : "hot";
        r = await getRank(api);
    } else if (type.indexOf("tag:") === 0) {
        r = await getTagPage(type.slice(4), pg, sort);
    } else {
        r = await getSlugCategory(type, pg);
    }
    var out = [];
    (r.list || []).forEach(function (v) { out.push(_toVideoItem(v)); });
    return out;
}
async function search(params) {
    COVER_SERVER = _coverServer(params);
    var r = await getSearch(String(params.keyword || ""), parseInt(params.page) || 1);
    var out = [];
    (r.list || []).forEach(function (v) { out.push(_toVideoItem(v)); });
    return out;
}
async function loadDetail(link) {
    COVER_SERVER = _coverServer(link && typeof link === "object" ? link : null);
    var vid = link;
    if (link && typeof link === "object") vid = link.link || link.id || link.vod_id || "";
    vid = cleanId(vid);
    if (!vid) return null;
    var r = await getDetail([vid]);
    if (!r.list || !r.list[0]) return null;
    var d = r.list[0];
    var item = _toVideoItem(d);
    item.episodeItems = [];
    if (d.vod_actor) {
        item.peoples = String(d.vod_actor).split("/").filter(function (s) { return s.trim(); }).map(function (n) { return { id: n.trim(), title: n.trim() }; });
    }
    var froms = String(d.vod_play_from || "").split("$$$");
    var urls = String(d.vod_play_url || "").split("$$$");
    urls.forEach(function (lineUrl, li) {
        var lineName = froms[li] || ("线路" + (li + 1));
        String(lineUrl || "").split("#").forEach(function (seg, ei) {
            if (!seg) return;
            var parts = seg.split("$");
            var epName = parts[0] || ("第" + (ei + 1) + "集");
            var playId = parts.length > 1 ? parts[1] : "";
            if (!playId) return;
            item.episodeItems.push({ id: playId, type: "url", title: lineName + " - " + epName, link: playId, mediaType: "tv" });
        });
    });
    return item;
}
async function loadResource(link) {
    var playId = link;
    if (link && typeof link === "object") playId = link.link || link.id || "";
    playId = toStr(playId).replace("hgai:", "");
    var parts = playId.split("|");
    // 兼容老格式 hg_vid_ep
    if (parts.length < 2) {
        var m = /^hg_(\d+)_(\d+)$/.exec(playId);
        if (m) parts = [m[1], m[2]];
    }
    if (parts.length < 2) return [];
    var vid = parts[0].trim(), ep = parts[1].trim() || "1";
    var d = await getPlayUrl(vid, ep);
    var out = [];
    if (d.url) out.push({ name: "主线路", url: d.url, customHeaders: { "User-Agent": UA, "Referer": SITE + "/" }, playerType: "app" });
    if (d.hevc && d.hevc !== d.url) out.push({ name: "HEVC", url: d.hevc, customHeaders: { "User-Agent": UA, "Referer": SITE + "/" }, playerType: "app" });
    return out;
}
