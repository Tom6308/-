/* 黄果诊断模块 v1.0.0（rex-diag.js）
 * 用途：定位 v1.0.5 在真机上的两个问题——封面空白、点条目报
 * “模块未返回可播放集数”。本模块全部用写死的数据，不发任何网络
 * 请求，把“模块写法”和“网络/API”两个变量彻底分开：
 *   - 封面三行对照：A 行 posterPath=中转地址（与 v1.0.5 同款），
 *     B 行 posterPath=直链小图（带 Content-Length 的 picsum），
 *     C 行只给 cover 字段（不给 posterPath）。
 *     哪行出图、哪行空白，一看就知道 App 认哪个字段、以及中转
 *     响应（chunked、无 Content-Length）是不是封面空白的原因。
 *   - 点任意条目：loadDetail 返回写死的 3 集，episodes 与
 *     episodeList 两个字段同时给，集字段 title/id/name/url/link/
 *     source 全给。如果这样 App 还报“未返回可播放集数”，就是
 *     选集字段形状不对；如果能看到 3 集，就是 v1.0.5 的详情调用
 *     链路在真机上有问题。
 *   - 点一集：loadResource 返回公开测试 HLS
 *     （Mux test-streams，parse:0），只为验证选集→播放这一步
 *     通不通。
 * 不写任何 export，模块页与站源页都能进（只当 Rex 模块用）。
 */
var WidgetMetadata = {
  id: 'huangguo.diag',
  title: '黄果诊断',
  version: '1.0.0',
  description: '封面与选集诊断：三行对照封面字段，点条目看选集形状。',
  author: 'Muse',
  modules: [
    { id: 'cover-relay', title: 'A·封面-中转', functionName: 'listCoverRelay', params: [{ name: 'page', type: 'number', value: 1 }] },
    { id: 'cover-direct', title: 'B·封面-直链', functionName: 'listCoverDirect', params: [{ name: 'page', type: 'number', value: 1 }] },
    { id: 'cover-only', title: 'C·封面-cover字段', functionName: 'listCoverOnly', params: [{ name: 'page', type: 'number', value: 1 }] },
    { id: 'playResource', title: '播放', functionName: 'loadResource', type: 'stream', params: [] },
  ],
  search: { id: '__rexSearch', title: '搜索', functionName: 'searchVideos', params: [{ name: 'query', type: 'text' }] },
  detail: { id: '__rexDetail', title: '详情', functionName: 'loadDetail', params: [] },
};

// A 行：与 v1.0.5 完全同款的中转封面地址（恶魔契约，探针已验 200 + 真 JPEG）。
var RELAY_PIC = 'https://rococo-entremet-86855d.netlify.app/.netlify/functions/cover?u=https%3A%2F%2Fpic.drleao.cn%2Fupload_01%2Fxiao%2F20261022%2F2026102211443867486.jpeg%3Fauth_key%3D1794677929-0-0-ba5f3493d5a2084badaf7178338399ff';
// B 行：带 Content-Length 的直链小图（picsum，公开 JPEG）。
var DIRECT_PIC = 'https://picsum.photos/seed/huangguo-diag/600/800';
// C 行只用 cover，不用 posterPath（与 v1.0.0 同款写法）。

function diagItems(kind) {
  var out = [];
  for (var i = 1; i <= 3; i++) {
    var base = {
      id: 'diag:' + kind + ':' + i,
      type: 'huangguo',
      link: 'diag:' + kind + ':' + i,
      title: '诊断条目 ' + kind + '-' + i,
      remark: '第' + i + '条',
      desc: '诊断用条目，无网络请求。',
    };
    if (kind === 'relay') {
      base.cover = RELAY_PIC; base.coverUrl = RELAY_PIC;
      base.posterPath = RELAY_PIC; base.backdropPath = RELAY_PIC;
    } else if (kind === 'direct') {
      base.cover = DIRECT_PIC; base.coverUrl = DIRECT_PIC;
      base.posterPath = DIRECT_PIC; base.backdropPath = DIRECT_PIC;
    } else {
      // cover-only：只给 cover，posterPath/backdropPath/coverUrl 都不给
      base.cover = RELAY_PIC;
    }
    out.push(base);
  }
  return out;
}

async function listCoverRelay(params) { return diagItems('relay'); }
async function listCoverDirect(params) { return diagItems('direct'); }
async function listCoverOnly(params) { return diagItems('cover'); }

async function loadDetail(link) {
  var id = '';
  if (typeof link === 'string') id = link;
  else if (link && typeof link === 'object') id = link.link || link.id || '';
  if (!id) return null;
  var episodes = [];
  for (var n = 1; n <= 3; n++) {
    episodes.push({
      title: '第' + n + '集',
      id: 'diag-ep-' + n,
      name: '第' + n + '集',
      url: 'diag-ep-' + n,
      link: 'diag-ep-' + n,
      source: '诊断',
    });
  }
  return {
    id: String(id),
    title: '诊断详情（' + String(id) + '）',
    cover: RELAY_PIC,
    coverUrl: RELAY_PIC,
    posterPath: RELAY_PIC,
    backdropPath: RELAY_PIC,
    desc: '这是诊断模块的详情页。如果能看到下面 3 集，选集形状就是对的。',
    remark: '诊断',
    episodes: episodes,
    episodeList: episodes,
  };
}

async function loadResource(link) {
  var id = '';
  if (typeof link === 'string') id = link;
  else if (link && typeof link === 'object') id = link.link || link.id || link.url || '';
  if (!id) return null;
  return {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    parse: 0,
    header: {},
    format: 'hls',
  };
}

async function searchVideos(params) { return []; }

globalThis.__JS_SPIDER__ = {
  title: '黄果诊断',
  homeContent: async function () {
    return { list: [{ type_name: '诊断', type_id: 'diag', type_extend: {} }] };
  },
  category: async function (tid) { return { list: [], page: 1, pagecount: 1, limit: 20, total: 0 }; },
  detailContent: async function () { return { list: [] }; },
  playerContent: async function () { return { parse: 0, url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', header: {} }; },
  searchContent: async function () { return { list: [] }; },
};
