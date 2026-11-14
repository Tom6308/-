/*
 * 黄果短剧 · Arcane JS 模块 v1.0.8（upload.py 转换版）
 * ============================================================
 * upload.py（TVBox / 影视仓 Python 源，原作者“无聊”，v2 2026-11-08）
 * 转换成的 JS 模块，给 Arcane（CatPaw / com.catpaw.appleplayer.ios）用。
 * 一个文件，两种入口都能进——
 *  - 站源入口（分类浏览）：TVBox 引擎以 vm.SourceTextModule 加载，
 *    取 spider 的第三条路 `globalThis.__JS_SPIDER__`（不写任何
 *    export，所以模块页也不会报 SyntaxError）；
 *  - 模块入口（首页推荐架）：Rex 模块中心读本文件末尾的
 *    WidgetMetadata 与全局函数（经典脚本加载）。
 * 装一个入口就行，两个都装也可以（内容一致，互不冲突）。
 *
 * v1.0.8（2026-11-15）：Brooks 又发来两份——huangguo-fixed.js 与
 * huangguo-cover-worker.js。Worker 是模块封面的真正解法：Cloudflare
 * Worker（纯 JS AES-CBC 解密，密钥与 AI.py 一致）替模块解密封面，
 * 实测返回 200、image/jpeg、**Content-Length: 174816**（不 chunked），
 * 手机图片加载器终于能读出来——Netlify 中转 chunked、无
 * Content-Length，才是 v1.0.0–v1.0.6 模块里封面全空的根因；Worker 的
 * AES 解密与 Node crypto 逐字节一致（本地 workerd 实测）。改动：
 *   ① `_normalizeRelayUrl` 认 Cloudflare Worker 地址（*.workers.dev，
 *      根路径 /?u= 直接可用）与 localhost（测试用）；Netlify 根自动补
 *      /.netlify/functions/cover 的逻辑不动。
 *   ② 新增 `_isWorkerRelay(relay)`：中转是 Worker（带 Content-Length）
 *      时，Rex 里封面用中转真图，不再换成标题海报；中转是 Netlify 时
 *      仍换标题海报（v1.0.7 的兜底）。站源本地代理真图不受影响。
 *   ③ 默认中转 COVER_RELAY 改成 Brooks 已部署的 Cloudflare Worker
 *      https://huangguo-cover.tang72276.workers.dev（2026-11-09 部署，
 *      2026-11-15 实测 /health {"ok":true}、真封面 200 + Content-Length
 *      174816 + image/jpeg）。Netlify rococo 中转仍可用作备选。
 * huangguo-fixed.js（合并版 v1.1.3）的条目/选集形状与 v1.0.7 一致
 * （type 'url' + mediaType 'tv'、episodeItems），但播放用的旧 GET
 * play 接口（返回空 video_url）不要，分类也比 v1.0.7 少——不照搬。
 *
 * v1.0.7（2026-11-15）：Brooks 发来 upload.js（Forward 播放器的黄果
 * 模块，作者 rex，v1.4.3）参考。模块里封面仍全空、点条目仍报“模块未
 * 返回可播放集数”、详情页是 TMDB 驱动（枪欲玫瑰被匹配成 Guns N'
 * Roses 乐队）——upload.js 里有三处可直接借鉴：
 *   ① 条目与选集用 `type: 'url'` + `mediaType: 'tv'`（Forward/官方
 *      模块的通用写法；之前 `type: 'huangguo'` 是 App 不认识的自造
 *      类型，App 认不出是可播剧集，才退回 TMDB 匹配）。
 *   ② 选集同时给 `episodes`、`episodeList`、`episodeItems` 三个键
 *      （二进制里 `episodes` 与 `episodeList` 都有，`episodeItems` 是
 *      Forward/rexhome 的写法；三个都给，不管 App 读哪个键都有），
 *      每集再补 `seasonNumber`/`episodeNumber`/`playerType: 'app'`。
 *   ③ Rex 里封面改用标题海报：加密封面在 Rex 里只能走 Netlify 中转，
 *      中转响应 chunked、无 Content-Length，手机图片加载器整屏读不
 *      出来（v1.0.0–v1.0.6 模块里封面全空的原因）；标题海报走
 *      placehold.co，实测 200、带 Content-Length、480x720 真 PNG，
 *      中文标题能正常渲染，保证列表有图。站源里本地代理能出真图，
 *      不受影响（只替换中转地址的图，明文图直链保留）。
 *   ④ loadResource 再补 `playerType: 'app'` + `customHeaders` +
 *      `name`/`description`（Forward 的资源形状），与原有的
 *      url/parse/header/format 并存。
 *   upload.js 的播放用的旧 GET /api/videos/{id}/play?ep=（实测返回空
 * video_url，已过时），不要；播放仍用已验证的 POST playback 接口。
 *   它的封面代理 ai.wulii.de5.net 实测连不上（Empty reply），不要。
 *
 * v1.0.6（2026-11-15）：站源装上后首页/分类都有内容、但封面全空，
 * 且点进 AI换脸/熟女/乱伦三个分类页是空的——针对这两处修：
 *   ① 封面改走本地代理优先：站源里加密封面不再默认走 Netlify 中转
 *      （中转响应是 chunked、无 Content-Length，手机的图片加载器
 *      整屏都读不出来），改走 TVBox 原生本地代理——`vod_pic` 返回
 *      `http://127.0.0.1:端口/proxy?source=…&type=img&url=…`，App
 *      经本地 /proxy 调 spider.proxy() 解密后把原图字节直接交给
 *      图片加载器。Rex 里没有本地代理，仍走中转（不受影响）。
 *      ext {"coverRelayFirst": true} 可恢复中转优先。
 *   ② AI换脸/AI魔改改走搜索优先：站方已下线这两个分类的 category
 *      接口（返回空 + “内容已下线”），之前是先调 category 接口
 *      （空）再调搜索兜底，两次请求串行，手机上点进分类页要等很久
 *      才出内容；现在这两个分类直接调搜索（AI换脸 38 条、AI魔改
 *      33 条），一次请求就出结果。
 *   ③ category() 的筛选值以前只读 extend（第 4 个参数），
 *      现在 filter（第 3 个参数）和 extend 两个都读、任一有值就用，
 *      不管 Arcane 把筛选值放在哪个参数里，点进分类页都不会因为
 *      读不到筛选值而返回空。
 *
 * v1.0.1（2026-11-14 晚）：封面全空的修复。v1.0.0 在模块里封面全空
 * （标题正常，只有图是占位符）：原因是 `_wrapPic` 在 Rex 里可能返回
 * `proxy://do=py…`（Rex 没有本地图片代理，这个地址在模块里打不开），
 * 且存过的中转地址若是裸站根（…netlify.app，没有 /cover 路径）会
 * 直接覆盖默认值、拼出 404 的封面地址。本版三处修复：① `_wrapPic`
 * 在 Rex 里加密图床一律走中转，且永不返回 `proxy://`（非加密图直接
 * 返回原地址，App 能直取）；② 中转地址归一化——裸 Netlify 站根
 * 自动补全 `/.netlify/functions/cover`，无效值不再覆盖默认值；
 * ③ 删掉模块设置里的「封面中转链接」入口行：Arcane 的模块行点进去
 * 只会跑函数并显示结果，根本不渲染文本输入框（点进去是“暂无内容”），
 * 这个入口填不了东西；中转地址本来就是默认写死的，不用填。
 *
 * v1.0.2（2026-11-14 晚）：封面还是没有的修复。v1.0.1 装上后标题正常、
 * 封面仍全是占位符——查官方 Rex 模块（rex-tmdb.js、bangumi.js）才发现：
 * App 读的封面字段是 `posterPath` / `backdropPath`，根本不认 `cover`
 * 字段；v1.0.0/1.0.1 的 `_toItem` / `loadDetail` 只给了 `cover`，所以
 * App 拿不到图。本版列表与详情同时给 `posterPath`、`backdropPath`
 * 和 `cover` 三个字段（值都是中转后的封面地址，与 v4.0.0 的写法一致）。
 *
 * v1.0.5（2026-11-15）：分类与官网一致 + 新剧来源。Brooks 说“新剧的
 * 片源也要有，分类也要跟黄果短剧官网上一样”，所以按官网（2026-11-15
 * 实测）补了三个 SSR 分类与 20 个题材分类：
 *   ① 最近上新 /newest（新剧来源；SSR，62 页，每页 28 条；首页 URL
 *      必须是 /newest，带尾斜杠只返回 42 字节）
 *   ② 热门推荐 /recommend（官网的推荐榜；SSR，3 页，每页 28 条；
 *      首页 URL 必须是 /recommend；v1.0.5 起推荐行不再用 ai-duanju
 *      hot 接口，改走这个）
 *   ③ 黄果原创 /original/（官网原创区；SSR，6 页，每页 39 条；首页
 *      URL 必须是 /original/，不带尾斜杠只返回 45 字节）
 *   ④ 官网首页导航的 20 个题材：都市/古风/奇幻/现代/职场/逆袭/校园/
 *      绿帽/熟女/母子/乱伦/系统/仙侠/后宫/大男主/性转/脑洞/悬疑/NTR/
 *      武侠，走 /tag/{slug}/ SSR（已有 _categoryTag）。
 * 三个 SSR 列表共用 _categorySsrList（翻页都是 /{base}/{N}/，不是
 * /page/N/；卡片都是 hg-drama-card，用 _parseDramaCards 解析）。
 * v1.0.4（2026-11-14 晚）：点进去报“模块未返回可播放集数”的修复。
 * v1.0.3 补了 `link` 后能进详情了，但详情页没有可播的集数：App 认的
 * 选集字段是 `title` + `id`（v4.0.0 的 `loadDetail` 就是这么返回的，
 * `loadResource` 也接 `params.link || params.id || params.url`），
 * 而 v1.0.3 的 `loadDetail` 选集只给了 `name` / `url` / `source`，
 * 没有 `id`/`title`，App 找不到可播的集。本版选集同时给 `title`、
 * `id`、`name`、`url`、`link`、`source`（`id`/`url`/`link` 都是集
 * 标记 `hgdj|vid|n` 或 `hgdjpost|pid|i`，`loadResource` 都能接）。
 *
 * upload.py 的结构（原样转换）：
 *  - 首页：精选推荐 + 4 个基础分类（AI成人短剧/漫剧/换脸/魔改）+
 *    专题合集 + 排行榜 + 黄果吃瓜；分类带筛选（排序 + 题材/专题/
 *    榜单/吃瓜分类）。
 *  - 列表：基础分类走 /api/videos/category/{id}?page&size=20&sort
 *    （latest/hot/random）；排行榜/专题/标签走 SSR 网页解析
 *    （/ranks/{type}/、/topics/{slug}/、/tag/{slug}/）；吃瓜走
 *    /chigua[/remen|/yuanchuang][/page/N|/N/]，每页 12 条。
 *  - 详情：短剧走 GET /api/videos/{id}（episodes[] 为权威选集，
 *    集地址标记 hgdj|{视频id}|{集号}）；吃瓜走 GET /archives/{id}/
 *    + POST /api/posts/{id}/playback，正文图与视频分两组
 *    （vod_play_from 用 $$$ 分隔“黄果视频”与“黄果图集”，视频地址标记
 *    hgdjpost|{帖子id}|{序号}）。
 *  - 播放：短剧 POST /api/videos/{id}/episodes/{ep}/playback，
 *    吃瓜 POST /api/posts/{id}/playback；取到直链后先 Range 嗅探
 *    （m3u8/ts 放行，HTML/图片判死，探测失败 fail-open），相对路径
 *    的 m3u8 走代理重写为绝对地址再返回；全部落空才 parse:1 交给
 *    Arcane 解析网页版播放页。
 *  - 封面：AES-128-CBC 加密（key f5d965df75336270，iv
 *    97b60394abc2fbe1），经由 proxy() 解密后返回；图源候选顺序为
 *    原图（带签名）→ 去签名原图 → CDN WebP 派生 → 镜像域；缺图时
 *    返回 64x64 深灰占位图（不裂图）。加密封面默认直接走 Brooks
 *    已部署的 Cloudflare Worker 中转
 *    https://huangguo-cover.tang72276.workers.dev（根路径 /?u=，
 *    返回带 Content-Length 的真 JPEG），不再经过手机上不稳的
 *    本地 127.0.0.1 /proxy 链路；Netlify rococo 中转仍可用作备选。
 *
 * 域名：upload.py 原版只写死 huangguoai.com（需梯子）。本转换版加了
 * 自动发现（与 v4.0.0 同款）：先读官方地址发布接口，再读发布页脚本，
 * 内置候选逐个探测，只用真正能返回数据的域名；当前域名失败自动轮换。
 * 默认首选大陆可访问的 d1716d.bmikbxhi.cc。源配置 ext 里可填
 * {"api_base": "https://…"} 换入口（upload.py 原版的 init 契约）。
 *
 * 用法（Arcane，装一个入口就行）：
 *  - 站源入口：设置 → 站源订阅 → 右上角 + →「添加 Python 链接」，
 *    名称填「黄果短剧」、URL 粘贴部署好的 .js 直链，点添加；
 *    不要走「添加订阅」（它只认 Node 包或 JSON 订阅，单个 .js 会报
 *    index.js.md5 错误）；换版时先删掉旧源再用新地址重加（Arcane
 *    会按地址缓存下载的 JS，同一地址不会重新下载）。
 *  - 模块入口：设置 → 模块 →「链接添加」，粘贴同一个 .js 直链；
 *    或「本地导入」选这个文件。
 *  - 站点默认自动选最优域名；想固定入口，在源配置 ext 里填
 *    {"api_base": "https://huangguoai.com"}（或裸域名）。
 *  - 封面默认直接走 Netlify 中转；如需恢复本地代理优先，在 ext 里填
 *    {"coverRelayFirst": false}。中转可更换：在 ext 里直接粘贴中转
 *    链接，或填 {"coverRelay": "https://…/cover"}，设为空字符串则禁用。
 *
 * 兼容：Arcane tvbox_js（主目标）；Node 18+（测试用）。
 */

// ================= 域名与静态数据 =================

var DEFAULT_HOSTS = [
  'https://d1716d.bmikbxhi.cc', // 最新地址（address-poster），大陆可访问（默认首选）
  'https://huangguoai.io',       // 与最新地址同库
  'https://huangguoai.com',      // 永久域名（需梯子；upload.py 原版写死此站）
  'https://huangguoai.ai',       // 永久中转，API 实测 404（探测跳过）
  'https://hgai15.com',          // 最新中转，API 实测 404（探测跳过）
  'https://huangguo.video',      // 403（探测跳过）
  'https://hongguoduanju.com',   // API 404（探测跳过）
  'https://hgai12.com',          // API 404（探测跳过）
];
var POSTER_HOST = 'https://huangguoai.com'; // 地址发布接口的来源站
var PUBLISH_JS = 'https://huangguoai.pages.dev/publish.js'; // 地址发布页脚本

// upload.py 的 4 个基础分类（顺序与原版一致）
var BASE_CATES = [
  { id: 'ai-duanju', name: '🎬 AI成人短剧' },
  { id: 'ai-manju', name: '🎬 AI成人漫剧' },
  { id: 'ai-huanlian', name: '🎬 AI换脸' },
  { id: 'ai-mogai', name: '🎬 AI魔改' },
];

// 官网首页导航的 20 个题材分类（2026-11-15 实测；顺序与官网一致）。
// 每个都是独立分类，走 /tag/{slug}/ SSR 列表（已有 _categoryTag）。
// v1.0.5 起分类与官网一致：短剧/漫剧/换脸/魔改 + 这 20 个题材。
var HOME_TAGS = [
  { slug: 'dushi', name: '都市' },
  { slug: 'gufeng', name: '古风' },
  { slug: 'qihuan', name: '奇幻' },
  { slug: 'xiandai', name: '现代' },
  { slug: 'zhichang', name: '职场' },
  { slug: 'nixi', name: '逆袭' },
  { slug: 'xiaoyuan', name: '校园' },
  { slug: 'lvmao', name: '绿帽' },
  { slug: 'shunv', name: '熟女' },
  { slug: 'muzi', name: '母子' },
  { slug: 'luanlun', name: '乱伦' },
  { slug: 'xitong', name: '系统' },
  { slug: 'xianxia', name: '仙侠' },
  { slug: 'hougong', name: '后宫' },
  { slug: 'dananzhu', name: '大男主' },
  { slug: 'xingzhuan', name: '性转' },
  { slug: 'naodong', name: '脑洞' },
  { slug: 'xuanyi', name: '悬疑' },
  { slug: 'ntr', name: 'NTR' },
  { slug: 'wuxia', name: '武侠' },
];
var HOME_TAG_SET = {};
HOME_TAGS.forEach(function (t) { HOME_TAG_SET[t.slug] = true; });

// 集地址内部标记（upload.py EP_PREFIX / POST_PREFIX）
var EP_PREFIX = 'hgdj';        // 集地址：hgdj|{视频id}|{集号}
var POST_PREFIX = 'hgdjpost';  // 吃瓜视频：hgdjpost|{帖子id}|{序号}

// 壳代理前缀契约：三参数缺一不可（do=py 触发回调 / type=img 标记图片 / url= 真实图）
var PROXY_IMG_PREFIX = 'proxy://do=py&type=img&url=';
// 站点的 WebP 派生图床（crypto-image-config.cdn.webp）：同路径 + ".webp"
var WEBP_BASE = 'https://new2.drleao.cn';
var WEBP_HOSTS = { 'pic.drleao.cn': 1, 'new.drleao.cn': 1, 'image.drleao.cn': 1, 'pic.aluxvl.cn': 1, 'huangguoai.com': 1 };
// 当前站点的图床主域（命中即不再试镜像域，避免无谓超时叠加）
var GOOD_IMG_HOSTS = { 'pic.drleao.cn': 1, 'new2.drleao.cn': 1, 'new.drleao.cn': 1, 'image.drleao.cn': 1 };

var PAGE_SIZE = 20; // 服务端固定每页 20 条（吃瓜每页 12 条）
var HOST_TTL = 6 * 3600 * 1000; // 域名探测结果缓存 6 小时
var IMG_KEY = 'f5d965df75336270'; // 封面 AES-128-CBC key
var IMG_IV = '97b60394abc2fbe1'; // 封面 AES-128-CBC iv
// 封面解密中转（Brooks 部署的 Cloudflare Worker，2026-11-09，
// 实测 /health {"ok":true}、真封面 200 + Content-Length + image/jpeg）
// 用法：COVER_RELAY + '?u=' + encodeURIComponent(封面地址)
// ext 里可用 {"coverRelay": "https://…"} 覆盖，设为空字符串则禁用中转。
// 备选（Netlify，chunked、无 Content-Length，模块里会换标题海报）：
// https://rococo-entremet-86855d.netlify.app/.netlify/functions/cover
var COVER_RELAY = 'https://huangguo-cover.tang72276.workers.dev';
// 封面超时：直取 6 秒 / 中转 8 秒（单张挂住不再拖住整屏，失败快速让路）
var COVER_FETCH_TIMEOUT = 6000;
var COVER_RELAY_TIMEOUT = 8000;
// GET 文本短缓存（upload.py CACHE_TTL/CACHE_MAX 同款）
var CACHE_TTL = 30;
var CACHE_MAX = 240;
// 64x64 深灰占位图（站方缺图时返回，避免壳里裂图；upload.py _PLACEHOLDER_B64 同款）
var PLACEHOLDER_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAABOElEQVR42u3ZxXUDARAE0Q5H' +
  'uKRlFCyDJFP+qbiD8KWfJ4Jf98Ju5+z37uHgHY/+6RSczxfHCV038rzY95MgSC+XLAzzKCri' +
  'uEySKk3rLGvy/FoUt7K8V9Wjrtum6a7X/nYb7vfx8Zjadu66pe/XYdjG8TlNr3l+L8vHun5u' +
  '29fz+f16/fyVC+l6upCupwvperqQrqcL6Xq6kK6nC+l6upCupwvperqQrqcL6Xq6kK6nC+l6' +
  'upCupwvperqQrqcL6Xq6kK6nC+l6upCupwvperqQrqcL6Xq6kK6nC+l6upCupwvperqQrqcL' +
  '6Xq6kK6nC+l6upCupwvperqQrqcL6Xq6kK6nC+l6upCupwvperqwT2yf2D6xfWL7xPaJ7RPb' +
  'J7ZPbJ/YPrF9YvvE9ontE9sntk/8Lz/xL+bikyYK6cqoAAAAAElFTkSuQmCC';

/* ================= 小工具 ================= */

function _isObj(v) { return v !== null && typeof v === 'object'; }
function _num(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }
function _str(v) { return v === undefined || v === null ? '' : String(v); }
function _joinField(v) {
  if (!v) return '';
  if (Array.isArray(v)) return v.join('/');
  return String(v);
}
// HTML 实体解码（upload.py html.unescape 同款；JS 没有内置 unescape）
function _unescape(s) {
  s = String(s || '');
  if (s.indexOf('&') < 0) return s;
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
  s = s.replace(/&#(\d+);/g, function (m, code) {
    var n = parseInt(code, 10);
    return isNaN(n) ? m : String.fromCharCode(n);
  });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, function (m, code) {
    var n = parseInt(code, 16);
    return isNaN(n) ? m : String.fromCharCode(n);
  });
  return s;
}
// 裸链接是不是封面中转地址：URL 的路径里含 /cover（如 Netlify 函数
// …/.netlify/functions/cover），而不是裸域名（站源地址）。
function _isCoverRelayUrl(u) {
  if (typeof u !== 'string' || u.indexOf('http') !== 0) return false;
  var path = String(u).replace(/^https?:\/\/[^\/]*/, '');
  return path.indexOf('/cover') >= 0;
}
// 封面中转地址只留基础部分（去掉 ?u=… 等查询串，_pic 会自己拼 ?u=）
function _stripRelayQuery(u) {
  var s = String(u || '');
  var q = s.indexOf('?');
  return q >= 0 ? s.slice(0, q) : s;
}
// 中转地址归一化（v1.0.1 新增，v1.0.8 扩到 Worker）：裸 Netlify 站根
// （…netlify.app 或 …netlify.app/，没有 /cover 路径）自动补全
// /.netlify/functions/cover；已带 /cover 的原样返回；Cloudflare Worker
// 地址（*.workers.dev，根路径 /?u=）与 localhost（测试用）原样返回，
// 因为 Worker 响应自带 Content-Length、真图能直接显示；其它（裸域名、
// 别的地址、非 URL）返回 '' 表示无效。调用方对无效值一律不覆盖当前值，
// 避免存过的错地址把默认值污染掉。
function _normalizeRelayUrl(u) {
  if (typeof u !== 'string') return '';
  var s = _stripRelayQuery(u.trim());
  if (!s || s.indexOf('http') !== 0) return '';
  var m = s.match(/^https?:\/\/([^\/?#]+)(\/.*)?$/);
  if (!m) return '';
  var host = m[1].toLowerCase();
  var path = m[2] || '';
  if (path.indexOf('/cover') >= 0) return s;
  // v1.0.8：Cloudflare Worker 中转（*.workers.dev，根路径 /?u=）与
  // localhost（本地 wrangler 测试）直接可用——Worker 返回带
  // Content-Length 的真图，App 图片加载器能读出来。
  if (host.slice(-12) === '.workers.dev' || host === 'localhost' || host.indexOf('127.0.0.1') === 0) return s;
  if (host.slice(-12) === '.netlify.app' && (path === '' || path === '/')) {
    return s.replace(/\/?$/, '') + '/.netlify/functions/cover';
  }
  return '';
}
// v1.0.8：当前中转是不是 Cloudflare Worker（或 localhost 测试地址）。
// Worker 响应自带 Content-Length、真图能直接显示，Rex 里就不用换成
// 标题海报；Netlify 中转是 chunked、无 Content-Length，仍换标题海报。
function _isWorkerRelay(relay) {
  var base = _normalizeRelayUrl(relay) || COVER_RELAY;
  try {
    var h = new URL(base).hostname.toLowerCase();
    return h.slice(-12) === '.workers.dev' || h === 'localhost' || h.indexOf('127.0.0.1') === 0;
  } catch (e) { return false; }
}
// v1.0.7：标题海报（upload.js / Forward 的做法，保证列表有图）。
// placehold.co 实测 200、带 Content-Length、480x720 真 PNG，中文标题
// 正常渲染。Rex 里加密封面只能走 Netlify 中转，中转响应 chunked、无
// Content-Length，手机图片加载器读不出来；标题海报能正常显示。
function _titlePoster(title) {
  var label = String(title == null ? '' : title).trim() || '黄果';
  if (label.length > 18) label = label.slice(0, 18);
  return 'https://placehold.co/480x720/111111/FFD21C/png?font=source-sans-pro&text=' + encodeURIComponent(label);
}
// v1.0.7：一个封面地址是不是 Netlify 中转地址（是就说明它在 Rex 里
// 显示不出来，该换成标题海报）。中转地址由 _relayCover 用 _coverRelay
// 拼出来，所以前缀一定是归一化后的 _coverRelay（无效时回落默认）。
function _isRelayUrl(url, relay) {
  if (typeof url !== 'string' || !url) return false;
  var base = _normalizeRelayUrl(relay) || COVER_RELAY;
  return url.indexOf(base) === 0;
}
function _b64encode(str) {
  try {
    if (typeof Buffer !== 'undefined') return Buffer.from(String(str), 'utf8').toString('base64');
  } catch (e) { /* fall through */ }
  try {
    if (typeof base64Encode === 'function') return base64Encode(str);
  } catch (e) { /* fall through */ }
  return '';
}
function _b64decodeToBytes(b64) {
  try {
    if (typeof Buffer !== 'undefined') return Buffer.from(String(b64).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  } catch (e) { return null; }
  return null;
}
function _isImageBytes(buf) {
  if (!buf || buf.length < 4) return false;
  // JPEG / PNG / GIF / WEBP
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  if (buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  return false;
}
function _imageMime(buf, url) {
  if (buf && buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf && buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf && buf.length >= 3 && buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif';
  if (buf && buf.length >= 12 && buf[8] === 0x57) return 'image/webp';
  var p = String(url || '').split('?')[0].toLowerCase();
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}
// m3u8 里的相对 URI / 分片改成绝对地址（upload.py _m3u8_abs 同款；壳不认相对路径）
function _m3u8Abs(baseUrl, text) {
  var out = [];
  var changed = false;
  var lines = String(text || '').split('\n');
  for (var i = 0; i < lines.length; i++) {
    var s = lines[i].trim();
    if (!s) { out.push(lines[i]); continue; }
    if (s.charAt(0) === '#') {
      var m = s.match(/URI="([^"]+)"/);
      if (m && !/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//.test(m[1])) {
        s = s.replace(m[1], _urljoin(baseUrl, m[1]));
        changed = true;
      }
      out.push(s);
    } else if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//.test(s)) {
      out.push(s);
    } else {
      out.push(_urljoin(baseUrl, s));
      changed = true;
    }
  }
  return { text: out.join('\n') + '\n', changed: changed };
}
// 相对 URL 拼成绝对 URL（urllib.parse.urljoin 同款；URL 构造器优先）
function _urljoin(base, rel) {
  try {
    if (typeof URL !== 'undefined') return new URL(rel, base).toString();
  } catch (e) { /* fall through */ }
  if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//.test(rel)) return rel;
  var b = String(base || '');
  var slash = b.lastIndexOf('/');
  var origin = b.slice(0, slash + 1);
  if (rel.charAt(0) === '/') {
    var m = b.match(/^(https?:\/\/[^\/]+)/);
    return (m ? m[1] : '') + rel;
  }
  return origin + rel;
}

/* ================= Spider 主体（upload.py 的 Spider 转换成的 JS） ================= */

var spider = {
  name: '短剧·涩涩·黄果短剧',
  title: '黄果短剧',
  host: DEFAULT_HOSTS[0],
  _token: '',
  _cookie: '',
  _coverRelay: COVER_RELAY,
  _coverRelayFirst: false, // v1.0.6 起默认 false：站源里加密封面走本地代理优先（TVBox 原生 /proxy，解密后原图字节直供图片加载器）；Rex 里没有本地代理，仍走中转。ext {"coverRelayFirst": true} 恢复中转优先
  _hostOk: false,
  _hostCheckedAt: 0,
  _discovering: null,
  _playCache: {}, // "vid|ep" -> { url, header, at }，5 分钟有效
  _preheatPending: {},
  _cache: {}, // GET 文本短缓存（upload.py _cache 同款）
  _streamOkHosts: {}, // 已校验过取流的 CDN 主机（避免每次播放都探）
  _playHdrs: {}, // host -> 取流请求头（代理重写 m3u8 时要用）
  _recommendCache: null,
  _topicsCache: null,
  _tagsCache: null,

  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': DEFAULT_HOSTS[0] + '/',
    'Origin': DEFAULT_HOSTS[0],
  },

  /* ---------- 本地持久化（Arcane 沙箱 local；没有时退化为内存） ---------- */
  _localGet: function (key) {
    try {
      if (typeof local !== 'undefined' && local && typeof local.get === 'function') {
        return local.get('huangguo', key);
      }
    } catch (e) { /* ignore */ }
    try {
      if (typeof Widget !== 'undefined' && Widget && Widget.storage && typeof Widget.storage.get === 'function') {
        var v = Widget.storage.get('huangguo_' + key);
        if (v !== null && v !== undefined && v !== '') return v;
        return Widget.storage.get(key);
      }
    } catch (e) { /* ignore */ }
    return '';
  },
  _localSet: function (key, value) {
    try {
      if (typeof local !== 'undefined' && local && typeof local.set === 'function') {
        local.set('huangguo', key, value);
      }
    } catch (e) { /* ignore */ }
    try {
      if (typeof Widget !== 'undefined' && Widget && Widget.storage && typeof Widget.storage.set === 'function') {
        Widget.storage.set('huangguo_' + key, value);
      }
    } catch (e) { /* ignore */ }
  },

  _applyHost: function (host) {
    this.host = String(host).replace(/\/+$/, '');
    this.headers['Referer'] = this.host + '/';
    this.headers['Origin'] = this.host;
  },

  _authHeaders: function () {
    var h = {};
    var k;
    for (k in this.headers) h[k] = this.headers[k];
    if (this._token) h['Authorization'] = 'Bearer ' + this._token;
    if (this._cookie) h['Cookie'] = this._cookie;
    return h;
  },

  /* ---------- HTTP 适配层（upload.py _req → _raw；三环境归一） ---------- */
  _raw: async function (url, opts) {
    opts = opts || {};
    var headers = opts.headers || this._authHeaders();
    var timeout = opts.timeout || 12000;
    var callOpts = { headers: headers, timeout: timeout };
    if (opts.buffer) callOpts.buffer = opts.buffer;
    if (opts.method) callOpts.method = opts.method;
    if (opts.body !== undefined) callOpts.body = opts.body;
    var res = null;
    var isB64 = false; // Arcane req 在 buffer:2 时 content 为 base64
    try {
      if (typeof req === 'function') {
        res = await req(url, callOpts);
        isB64 = !!callOpts.buffer;
      } else if (typeof Widget !== 'undefined' && Widget && Widget.http && typeof Widget.http.get === 'function') {
        // Rex 桥接：Widget.http.get(url, options) / post(url, data, options)，
        // 返回 { data }（已解析的 JSON 或原始字符串）。这里不传 buffer，
        // 返回的 text 是原始字符串（base64: false）。
        if (callOpts.method && callOpts.method !== 'GET') {
          res = await Widget.http.post(url, callOpts.body !== undefined ? callOpts.body : '', { headers: headers });
        } else {
          res = await Widget.http.get(url, { headers: headers });
        }
      } else if (typeof request === 'function') {
        res = await request(url, callOpts);
      } else if (typeof http === 'function') {
        res = await http(url, { headers: headers, timeout: timeout, method: callOpts.method, body: opts.body });
      } else if (typeof fetch === 'function') {
        var r = await fetch(url, { method: opts.method || 'GET', headers: headers, body: opts.body });
        var t = '';
        try { t = await r.text(); } catch (e) { t = ''; }
        return { code: r.status || 200, text: t };
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
    if (res === null || res === undefined) return null;
    if (typeof res === 'string') return { code: 200, text: res };
    if (_isObj(res)) {
      if (typeof res.content === 'string') return { code: _num(res.code, 200), text: res.content, headers: res.headers, base64: isB64 };
      if (typeof res.data === 'string') return { code: _num(res.code, 200), text: res.data };
      if (_isObj(res.data)) return { code: _num(res.code, 200), text: JSON.stringify(res.data) };
      if (typeof res.body === 'string') return { code: _num(res.code, 200), text: res.body };
      return { code: _num(res.code, 200), text: '' };
    }
    return null;
  },

  _getJson: async function (path, params, retry) {
    var txt = await this._getText(path, params, null, retry === undefined ? 1 : retry);
    if (!txt) return null;
    try { return JSON.parse(txt); } catch (e) { return null; }
  },

  _postJson: async function (path, payload, timeout) {
    var body = JSON.stringify(payload === null || payload === undefined ? {} : payload);
    var headers = this._authHeaders();
    headers['Content-Type'] = 'application/json';
    var raw = await this._raw(this.host + '/' + String(path || '').replace(/^\/+/, ''), {
      method: 'POST', body: body, headers: headers, timeout: timeout || 15000,
    });
    if (!raw || !raw.text) return null;
    if (raw.code && (raw.code < 200 || raw.code >= 300)) return null;
    try { return JSON.parse(raw.text); } catch (e) { return null; }
  },

  // 软 404 / 盾页 / 空数据页识别（upload.py _looks_error 同款）
  _looksError: function (txt) {
    if (!txt) return true;
    var head = String(txt).slice(0, 4000);
    var marks = ['页面未找到', '页面不存在', '内容不存在', '该页面不存在', '系统维护', '正在维护', '请稍后再试', '访问受限'];
    for (var i = 0; i < marks.length; i++) {
      if (head.indexOf(marks[i]) >= 0) return true;
    }
    return false;
  },

  // GET 文本（upload.py _get_text 同款：短 TTL 缓存 + 软 404 识别 + 1 次重试）
  _getText: async function (path, params, headers, retry, ttl) {
    var self = this;
    var url = String(path || '');
    if (url.indexOf('http') !== 0) url = this.host + '/' + url.replace(/^\/+/, '');
    if (params && _isObj(params)) {
      var qs = [];
      Object.keys(params).forEach(function (k) { qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k])); });
      if (qs.length) url += (url.indexOf('?') >= 0 ? '&' : '?') + qs.join('&');
    }
    if (ttl === undefined || ttl === null) ttl = CACHE_TTL;
    var key = null;
    if (ttl > 0 && !headers) {
      key = url;
      var hit = this._cache[key];
      if (hit && hit[0] > Date.now()) return hit[1];
    }
    var attempts = (retry === undefined ? 1 : retry) + 1;
    for (var a = 0; a < attempts; a++) {
      var raw = await this._raw(url, { headers: headers || this._authHeaders(), timeout: 15000 });
      if (raw && raw.code === 200 && raw.text) {
        var txt = raw.text;
        if (this._looksError(txt)) return null;
        if (key) {
          var keys = Object.keys(this._cache);
          if (keys.length >= CACHE_MAX) {
            var oldest = null, oldestAt = Infinity;
            keys.forEach(function (k) { if (self._cache[k][0] < oldestAt) { oldestAt = self._cache[k][0]; oldest = k; } });
            if (oldest) delete this._cache[oldest];
          }
          this._cache[key] = [Date.now() + ttl * 1000, txt];
        }
        return txt;
      }
      if (a < attempts - 1) await new Promise(function (res) { setTimeout(res, 250); });
    }
    return null;
  },

  // 二进制 GET（upload.py _get_bin 同款：只接受 200 且有内容）
  _getBin: async function (url, timeout) {
    var raw = await this._raw(url, { timeout: timeout || 15000, buffer: 2 });
    if (!raw || raw.code !== 200 || !raw.text) return null;
    var buf = _b64decodeToBytes(raw.text);
    if (buf && buf.length > 0) return buf;
    // 经典环境 text 是二进制串而非 base64 时的兜底
    try {
      if (typeof Buffer !== 'undefined') return Buffer.from(raw.text, 'binary');
    } catch (e) { /* ignore */ }
    return null;
  },

  /* ---------- 域名自动发现（upload.py 原版只写死一个域名；本转换版加了发现） ---------- */
  _probeHost: async function (host) {
    try {
      var json = await this._getJson(host + '/api/videos?page=1&sort=hot', { timeout: 8000 }, 0);
      var items = json && json.data && json.data.items;
      var total = json && json.data && json.data.pagination && json.data.pagination.total;
      return Array.isArray(items) && items.length > 0 && _num(total, 0) > 0;
    } catch (e) {
      return false;
    }
  },

  _discoverHosts: async function () {
    var self = this;
    if (this._discovering) return this._discovering;
    this._discovering = (async function () {
      var pool = [];
      function push(u) {
        if (!u) return;
        u = String(u).trim().replace(/\/+$/, '');
        if (/^https?:\/\//.test(u) && pool.indexOf(u) < 0) pool.push(u);
      }
      // 1) 上次可用的域名优先；已存配置里如有 host/token/cookie 先应用
      push(self._localGet('host'));
      try { var sc = self._localGet('config'); if (sc) self._applyConfig(sc); } catch (e) { /* ignore */ }
      push(self.host);
      // 2) 官方地址发布接口（当前站 + 默认站各试一次）
      var posterHosts = [self.host, POSTER_HOST];
      for (var i = 0; i < posterHosts.length; i++) {
        try {
          var poster = await self._getJson(posterHosts[i] + '/api/site/address-poster', null, 0);
          var addrs = poster && poster.data && poster.data.config && poster.data.config.addresses;
          if (Array.isArray(addrs)) {
            addrs.forEach(function (a) { if (a && !a.hidden) push(a.url); });
          }
          if (poster) break;
        } catch (e) { /* ignore */ }
      }
      // 3) 地址发布页脚本（Cloudflare Pages，一般可达）
      try {
        var raw = await self._raw(PUBLISH_JS, { timeout: 8000 });
        if (raw && raw.text) {
          var m = raw.text.match(/https:\/\/[a-zA-Z0-9.\-]+/g) || [];
          m.forEach(function (u) {
            if (u.indexOf('pages.dev') < 0) push(u);
          });
        }
      } catch (e) { /* ignore */ }
      // 4) 内置候选
      DEFAULT_HOSTS.forEach(push);
      // 逐个探测，第一个可用的胜出
      for (var j = 0; j < pool.length; j++) {
        if (await self._probeHost(pool[j])) {
          self._applyHost(pool[j]);
          self._hostOk = true;
          self._hostCheckedAt = Date.now();
          self._localSet('host', pool[j]);
          return pool[j];
        }
      }
      // 全灭：保留原域名（可能是瞬时抖动），标记未确认
      self._hostOk = false;
      self._hostCheckedAt = Date.now();
      return self.host;
    })();
    try {
      return await this._discovering;
    } finally {
      this._discovering = null;
    }
  },

  _ensureHost: async function () {
    if (this._hostOk && Date.now() - this._hostCheckedAt < HOST_TTL) return;
    var cached = _str(this._localGet('host'));
    if (cached && cached !== this.host) {
      this._applyHost(cached);
      if (await this._probeHost(cached)) {
        this._hostOk = true;
        this._hostCheckedAt = Date.now();
        return;
      }
    } else if (cached && this._hostOk) {
      return;
    }
    await this._discoverHosts();
  },

  // 带域名轮换的 JSON 请求：当前域名失败时换下一个候选再试一次
  _api: async function (path, opts) {
    opts = opts || {};
    await this._ensureHost();
    var url = this.host + path;
    var json = await this._getJson(url, opts);
    if (json) return json;
    this._hostOk = false;
    await this._discoverHosts();
    if (this.host + path !== url) {
      json = await this._getJson(this.host + path, opts);
      if (json) return json;
    }
    return null;
  },

  // 带域名轮换的 POST JSON 请求（播放接口用；直接走 _raw 发 POST，
  // 不经过 _getText——POST 不走 GET 文本缓存，也不拼查询串）
  _apiPost: async function (path, body) {
    await this._ensureHost();
    var headers = this._authHeaders();
    headers['Content-Type'] = 'application/json';
    var payload = JSON.stringify(body || {});
    var raw = await this._raw(this.host + path, { method: 'POST', body: payload, headers: headers });
    if (raw && raw.text) {
      try { return JSON.parse(raw.text); } catch (e) { /* fall through */ }
    }
    this._hostOk = false;
    await this._discoverHosts();
    var raw2 = await this._raw(this.host + path, { method: 'POST', body: payload, headers: headers });
    if (raw2 && raw2.text) {
      try { return JSON.parse(raw2.text); } catch (e) { /* ignore */ }
    }
    return null;
  },

  /* ---------- 初始化（upload.py init 契约：ext 里 {"api_base": "https://…"} 换入口） ---------- */
  _applyConfig: function (cfg) {
    try {
      var c = cfg;
      if (typeof c === 'string') {
        var t = c.trim();
        if (!t) return;
        if (t.charAt(0) === '{') { try { c = JSON.parse(t); } catch (e) { return; } }
        else if (t.indexOf('http') === 0) {
          var nr = _normalizeRelayUrl(t);
          if (nr) { this._coverRelay = nr; return; }
          this._applyHost(t); return;
        } else {
          return;
        }
      }
      if (!_isObj(c)) return;
      if (c.api_base) this._applyHost(c.api_base);
      else if (c.host) this._applyHost(c.host);
      else if (c.site) this._applyHost(c.site);
      if (c.token) this._token = String(c.token);
      if (c.cookie) this._cookie = String(c.cookie);
      if (c.auth) this._token = String(c.auth);
      if (c.coverRelay !== undefined) {
        // 归一化后才收：裸站根自动补全函数地址；无效值（裸域名、别的地址）忽略，
        // 不覆盖当前值；只有显式的 '' 才是禁用（站源 ext 才用得到，Rex 里禁用也没意义）。
        var nr2 = _normalizeRelayUrl(c.coverRelay);
        if (nr2) this._coverRelay = nr2;
        else if (String(c.coverRelay).trim() === '') this._coverRelay = '';
      }
      if (c.coverRelayFirst !== undefined) this._coverRelayFirst = !!c.coverRelayFirst;
    } catch (e) { /* ignore */ }
  },

  init: async function (ext) {
    if (ext) this._applyConfig(ext);
    try { await this._ensureHost(); } catch (e) { /* ignore */ }
    return;
  },

  getName: function () { return this.name; },
  getHeaders: function () {
    return { 'User-Agent': this.headers['User-Agent'], 'Referer': this.host + '/', 'Accept': 'application/json, text/html, */*', 'Accept-Encoding': 'gzip' };
  },
  getDependence: function () { return []; },
  destroy: function () { return; },
  isVip: function () { return false; },

  /* ---------- 图片（封面）处理（upload.py _wrap_pic / _pic_proxy 同款） ---------- */
  // 封面统一走 localProxy（先判魔数，密文才解密），避免解析失败白屏。
  // 加密图床（drleao/aluxvl）且中转开着时，默认先走 Netlify 中转
  // （实测返回真 JPEG），不再经过手机上不稳的本地 127.0.0.1 /proxy
  // 链路；其余图走本地代理透传。upload.py 原版没有中转，这里是为
  // 手机实测加的默认值（ext {"coverRelayFirst": false} 可恢复本地优先）。
  // v1.0.1：Rex 没有本地图片代理，`proxy://do=py…` 在模块里打不开，
  // 所以 Rex 里加密图床一律走中转、且永不返回 proxy://；非加密图在
  // Rex 里直接返回原地址（App 能直取）。中转地址本身无效/被清空时
  // _relayCover 内部回落到默认中转。
  _wrapPic: function (pic) {
    if (!pic) return '';
    pic = _unescape(String(pic));
    pic = pic.replace(/\\u0026/g, '&').replace(/&amp;/g, '&').trim();
    if (pic.indexOf('//') === 0) pic = 'https:' + pic;
    else if (pic.charAt(0) === '/') pic = this.host + pic;
    if (pic.indexOf('http') !== 0 || pic.indexOf(this.host) === 0) return pic;
    var h = '';
    try {
      if (typeof URL !== 'undefined') h = new URL(pic).hostname.toLowerCase();
    } catch (e) { /* ignore */ }
    var encryptedHost = !!(WEBP_HOSTS[h] || GOOD_IMG_HOSTS[h]);
    var noLocalProxy = (typeof getProxyUrl !== 'function');
    if (encryptedHost && (this._coverRelayFirst || noLocalProxy)) {
      return this._relayCover(pic);
    }
    // 非加密图，或站源且中转关着：站源走本地代理；Rex 直接返回原地址
    // （App 能直取明文图；返回 proxy:// 在模块里是死地址）。
    if (noLocalProxy) return pic;
    return this._picProxy(pic);
  },

  // 代理地址：壳给了回环基址就用回环，否则用 proxy:// 自定义协议
  _picProxy: function (pic, kind) {
    kind = kind || 'img';
    var q = encodeURIComponent(pic);
    try {
      if (typeof getProxyUrl === 'function') {
        var base = getProxyUrl();
        if (base) {
          var sep = base.indexOf('?') >= 0 ? '&' : '?';
          return base + sep + 'type=' + kind + '&url=' + q;
        }
      }
    } catch (e) { /* ignore */ }
    if (kind === 'img') return PROXY_IMG_PREFIX + q;
    return 'proxy://do=py&type=' + kind + '&url=' + q;
  },

  /* ---------- 首页（upload.py homeContent 同款） ---------- */
  home: async function (filter) {
    var result = { 'class': [], filters: {}, list: [] };
    // v1.0.5：分类与官网一致（2026-11-15 实测官网导航）：
    // 热门推荐 / 最近上新 / 黄果原创 / 4 个基础分类 / 20 个题材 /
    // 专题合集 / 排行榜 / 黄果吃瓜。标题里的 emoji 与官网导航对应。
    result['class'].push({ type_id: 'recommend', type_name: '🔥热门推荐' });
    result['class'].push({ type_id: 'newest', type_name: '🆕最近上新' });
    result['class'].push({ type_id: 'original', type_name: '✨黄果原创' });
    var tags = await this._getTags();
    var tagValues = [{ n: '全部', v: '' }];
    tags.forEach(function (t) { tagValues.push({ n: t.name, v: t.slug }); });
    var self = this;
    BASE_CATES.forEach(function (c) {
      result['class'].push({ type_id: c.id, type_name: c.name });
      result.filters[c.id] = [
        { key: 'sort', name: '排序', value: [
          { n: '最新更新', v: 'latest' },
          { n: '当前热播', v: 'hot' },
          { n: '随机推荐', v: 'random' },
        ] },
        { key: 'tag', name: '题材', value: tagValues },
      ];
    });
    HOME_TAGS.forEach(function (t) {
      result['class'].push({ type_id: t.slug, type_name: t.name });
    });
    var topics = await this._getTopics();
    if (topics && topics.length > 0) {
      result['class'].push({ type_id: 'topics', type_name: '📚专题合集' });
      result.filters['topics'] = [{
        key: 'topic', name: '专题',
        value: topics.map(function (t) { return { n: t.name, v: t.slug }; }),
      }];
    }
    result['class'].push({ type_id: 'ranks', type_name: '📊排行榜' });
    result.filters['ranks'] = [{
      key: 'rank_type', name: '榜单', value: [
        { n: '🔥 热播榜', v: 'hot' },
        { n: '⭐ 推荐榜', v: 'recommend' },
        { n: '🚀 潜力榜', v: 'potential' },
      ],
    }];
    result['class'].push({ type_id: 'chigua', type_name: '🍉黄果吃瓜' });
    result.filters['chigua'] = [{
      key: 'cate', name: '分类', value: [
        { n: '全部', v: 'all' },
        { n: '热门吃瓜', v: 'remen' },
        { n: 'AI原创', v: 'yuanchuang' },
      ],
    }];
    // 首页推荐位（必须有 list，否则首页空白）
    try {
      var hv = await this.homeVideo();
      result.list = hv.list || [];
    } catch (e) {
      result.list = [];
    }
    return result;
  },

  // 题材标签（/api/tags，按热度取前 30；upload.py _get_tags 同款）
  _getTags: async function () {
    if (this._tagsCache !== null && this._tagsCache !== undefined) return this._tagsCache;
    var tags = [];
    try {
      var data = await this._api('/api/tags', null, 0);
      var cats = (data && data.data && data.data.categories) || [];
      var pool = {};
      cats.forEach(function (c) {
        (c.tags || []).forEach(function (t) {
          var slug = t.slug;
          if (!slug || pool[slug]) return;
          pool[slug] = { slug: slug, name: t.name || slug, hot: t.hot_score || 0 };
        });
      });
      tags = Object.keys(pool).map(function (k) { return pool[k]; })
        .sort(function (a, b) { return b.hot - a.hot; }).slice(0, 30);
    } catch (e) {
      tags = [];
    }
    this._tagsCache = tags;
    return tags;
  },

  // 专题列表（GET /topics/ 网页解析；upload.py _get_topics 同款，
  // 但 slug 匹配放宽到大小写（原版 [a-z0-9-] 会漏 AImori-chongsheng
  // 与 xiangcun-AIchengren 两个混合大小写 slug））
  _getTopics: async function () {
    if (this._topicsCache !== null && this._topicsCache !== undefined) return this._topicsCache;
    var topics = [];
    try {
      var html = await this._getText('/topics/', null, null, 1, 0);
      if (html) {
        // 注意：JS 的 . 默认不匹配换行（upload.py 用 re.DOTALL），
        // 专题卡片的 <a> 与 <h3> 之间有换行与 <img>，必须用 [\s\S]*?
        // slug 用 [^"/]+（不只 [A-Za-z0-9-]）：要能抓到混合大小写的
        // AImori-chongsheng、xiangcun-AIchengren，以及带全角破折号的
        // xiaoyuan—qingcun（upload.py 原版 [a-z0-9-] 会漏掉这三个）。
        var re = /href="\/topics\/([^"]+)\/"[^>]*>[\s\S]*?hg-topic-card__title">([^<]+)</g;
        var m;
        var seenNames = {};
        while ((m = re.exec(html)) !== null) {
          var name = _unescape(m[2]).trim();
          if (!name || seenNames[name]) continue;
          seenNames[name] = true;
          topics.push({ slug: m[1], name: name });
        }
      }
    } catch (e) {
      topics = [];
    }
    this._topicsCache = topics;
    return topics;
  },

  // 首页推荐行（/api/videos/category/ai-duanju?sort=latest；缓存一次）
  homeVideo: async function () {
    if (this._recommendCache !== null && this._recommendCache !== undefined) {
      return { list: this._recommendCache };
    }
    try {
      var data = await this._api('/api/videos/category/ai-duanju?page=1&size=20&sort=latest');
      var items = (data && data.data && data.data.items) || [];
      var vids = [];
      var seen = {};
      var self = this;
      items.forEach(function (it) {
        var vid = String(it.id || '');
        if (!vid || seen[vid]) return;
        seen[vid] = true;
        vids.push({
          vod_id: vid, vod_name: it.title || '',
          vod_pic: self._wrapPic(it.cover || ''),
          vod_remarks: self._remarks(it),
        });
      });
      this._recommendCache = vids;
      return { list: vids };
    } catch (e) {
      return { list: [] };
    }
  },

  // 部分壳会单独要首页推荐行
  homeVideoContent: async function () {
    return this.homeVideo();
  },

  _remarks: function (item) {
    if (!item) return '';
    var ep = item.episode_count || 0;
    if (item.is_finished) return ep ? ('全' + ep + '集') : '已完结';
    return ep ? ('更新至' + ep + '集') : '';
  },

  /* ---------- 分类（upload.py categoryContent 同款） ---------- */
  category: async function (tid, pg, filter, extend) {
    var page = 1;
    try { page = Math.max(_num(pg, 1), 1); } catch (e) { page = 1; }
    // v1.0.6：筛选值两个参数都读。TVBox 传 category(tid, pg, filter, extend)，
    // filter（第 3 个）是分类页当前选中的筛选值，extend（第 4 个）是站源配置；
    // 以前只读 extend，Arcane 若把筛选值放 filter 里就读不到。现在两个都读、
    // 任一有值就用，避免点进分类页因读不到筛选值而返回空。
    var f = (_isObj(filter)) ? filter : {};
    var ext = (_isObj(extend)) ? extend : {};
    var sel = function (k) { return (f[k] !== undefined && f[k] !== null && f[k] !== '') ? f[k] : ext[k]; };
    tid = _str(tid);
    if (tid === 'recommend') {
      // 热门推荐：官网 /recommend SSR（v1.0.5 起，不再用 ai-duanju hot）
      return this._categorySsrList('/recommend', page);
    }
    if (tid === 'newest') {
      // 最近上新：官网 /newest SSR（新剧来源；v1.0.5 新增）
      return this._categorySsrList('/newest', page);
    }
    if (tid === 'original') {
      // 黄果原创：官网 /original/ SSR（v1.0.5 新增）
      return this._categorySsrList('/original/', page);
    }
    if (tid === 'ranks') {
      return this._categoryRanks(sel('rank_type') || 'hot', page);
    }
    if (tid === 'topics') {
      return this._categoryTopics(sel('topic') || '', page);
    }
    if (tid === 'chigua') {
      return this._categoryChigua(sel('cate') || 'all', page);
    }
    if (HOME_TAG_SET[tid]) {
      // 官网题材分类（都市/古风/…）：走 /tag/{slug}/ SSR（v1.0.5 新增）
      return this._categoryTag(tid, page);
    }
    var tag = _str(sel('tag') || '').trim();
    if (tag) {
      return this._categoryTag(tag, page);
    }
    var sort = sel('sort') || 'latest';
    if (sort === 'random') {
      return this._categoryApi(tid, 'random', 1);
    }
    return this._categoryApi(tid, sort, page);
  },

  // 分类 JSON 接口（upload.py _category_api 同款）
  // 2026-11-14 实测：/api/videos/category/ai-huanlian 与 ai-mogai 已
  // 返回 {"data":[],"status":0,"msg":"内容已下线"}（站方下线了这两个
  // 分类的 category 接口），内容本身还在（搜索能搜到）。空结果时用
  // 搜索接口兜底，保证分类不空白。
  _categoryApi: async function (baseId, sort, page) {
    var per = 20;
    var result = { list: [], page: page, pagecount: 1, limit: per, total: 0 };
    // v1.0.6：ai-huanlian / ai-mogai 的 category 接口站方已下线（返回空 +
    // “内容已下线”），这两个分类直接调搜索，不再先调一次注定为空的
    // category 接口——点进分类页一次请求就出结果，不用串行等两次。
    var kw = { 'ai-huanlian': 'AI换脸', 'ai-mogai': 'AI魔改', 'ai-duanju': 'AI短剧', 'ai-manju': 'AI漫剧' }[baseId];
    var items = [];
    if (baseId === 'ai-huanlian' || baseId === 'ai-mogai') {
      var sdata0 = await this._api('/api/search?q=' + encodeURIComponent(kw) + '&page=' + page + '&size=' + per);
      var sd0 = (sdata0 && sdata0.data) || {};
      items = sd0.items || [];
      var spg0 = sd0.pagination || {};
      if (items.length > 0) {
        result.total = spg0.total || items.length;
        result.pagecount = Math.max(1, _num(spg0.pages, (items.length >= per ? page + 1 : page)));
      }
    } else {
      var data = await this._api('/api/videos/category/' + encodeURIComponent(baseId) + '?page=' + page + '&size=' + per + '&sort=' + sort);
      var d = (data && data.data) || {};
      items = d.items || [];
      if (items.length === 0 && kw) {
        var sdata = await this._api('/api/search?q=' + encodeURIComponent(kw) + '&page=' + page + '&size=' + per);
        var sd = (sdata && sdata.data) || {};
        items = sd.items || [];
        var spg = sd.pagination || {};
        if (items.length > 0) {
          result.total = spg.total || items.length;
          result.pagecount = Math.max(1, _num(spg.pages, (items.length >= per ? page + 1 : page)));
        }
      } else if (items.length > 0) {
        var pg0 = d.pagination || {};
        result.total = pg0.total || items.length;
        result.pagecount = Math.max(1, _num(pg0.pages, (items.length >= per ? page + 1 : page)));
      }
    }
    var seen = {};
    var self = this;
    items.forEach(function (it) {
      var vid = String(it.id || '');
      if (!vid || seen[vid]) return;
      seen[vid] = true;
      result.list.push({
        vod_id: vid,
        vod_name: it.title || '',
        vod_pic: self._wrapPic(it.cover || ''),
        vod_remarks: self._remarks(it),
      });
    });
    if (result.total === 0) {
      result.total = result.list.length;
      result.pagecount = Math.max(1, (result.list.length >= per ? page + 1 : page));
    }
    return result;
  },

  // ── SSR 卡片解析（榜单/专题/标签/搜索页共用）──────────
  // 只取主列表容器，避开侧栏「猜你喜欢」重复卡片（upload.py _grid_slice 同款）
  // 注意：marker 必须是 <div class="hg-card-grid（真实容器标签），
  // 不能是裸 hg-card-grid——页面 <style> 里的 CSS 规则（.hg-channel-page>
  // .hg-card-grid…）会先命中，截出来的只是几百字节的 CSS，没有卡片。
  _gridSlice: function (doc, marker) {
    marker = marker || '<div class="hg-card-grid';
    if (!doc) return '';
    var i = doc.indexOf(marker);
    if (i < 0) return doc;
    var seg = doc.slice(i);
    var j = seg.indexOf(marker, 10);
    if (j > 0) seg = seg.slice(0, j);
    var k = seg.indexOf('<footer');
    if (k > 0) seg = seg.slice(0, k);
    return seg;
  },

  // 解析短剧卡片（upload.py _parse_drama_cards 同款）
  _parseDramaCards: function (doc) {
    var seg = this._gridSlice(doc);
    var vids = [];
    var seen = {};
    var self = this;
    var chunks = seg.split('<div class="hg-drama-card"').slice(1);
    chunks.forEach(function (chunk) {
      var vm = chunk.match(/data-track-item-id="(\d+)"/);
      var tm = chunk.match(/data-track-title="([^"]+)"/);
      if (!vm && !tm) return;
      var cm = chunk.match(/<img[^>]*data-src="([^"]+)"/) || chunk.match(/<img[^>]*src="(https?:\/\/[^"]+)"/);
      var cover = cm ? _unescape(cm[1]) : '';
      if (cover.indexOf('placeholder') >= 0) cover = '';
      var title = tm ? _unescape(tm[1]).trim() : '';
      if (!title) {
        var tm2 = chunk.match(/alt="([^"]+)"/);
        title = tm2 ? _unescape(tm2[1]).trim() : '';
      }
      var vid = vm ? vm[1] : '';
      if (!vid) {
        var hm = chunk.match(/href="\/video\/(\d+)\/"/);
        vid = hm ? hm[1] : '';
      }
      if (!vid || seen[vid]) return;
      seen[vid] = true;
      var remark = '';
      var sm = chunk.match(/hg-drama-card__score">([^<]+)</);
      if (sm) remark = sm[1].trim();
      var em = chunk.match(/data-ep-base="([^"]+)"/);
      if (em && em[1].trim()) remark = (remark + ' ' + em[1].trim()).trim();
      vids.push({
        vod_id: vid,
        vod_name: title,
        vod_pic: cover ? self._wrapPic(cover) : '',
        vod_remarks: remark,
      });
    });
    return vids;
  },

  // 排行榜（upload.py _category_ranks 同款：单页 SSR，page>1 直接空）
  _categoryRanks: async function (rankType, page) {
    var per = 20;
    var result = { list: [], page: page, pagecount: 1, limit: per, total: 0 };
    if (rankType !== 'hot' && rankType !== 'recommend' && rankType !== 'potential') rankType = 'hot';
    if (page > 1) return result; // 榜单是单页 SSR（/ranks/x/page/2/ 为 404），没有第 2 页
    var doc = await this._getText('/ranks/' + rankType + '/', null, null, 1, 0);
    if (!doc) return result;
    var seg = doc.indexOf('hg-rank-list') >= 0 ? doc.slice(doc.indexOf('hg-rank-list')) : doc;
    var seen = {};
    var self = this;
    seg.split('<div class="hg-rank-item"').slice(1).forEach(function (chunk) {
      var vm = chunk.match(/data-track-id="(\d+)"/);
      var vid = '';
      if (vm) vid = vm[1];
      else {
        var hm = chunk.match(/href="\/video\/(\d+)\/"/);
        if (!hm) return;
        vid = hm[1];
      }
      if (seen[vid]) return;
      seen[vid] = true;
      var tm = chunk.match(/data-track-title="([^"]+)"/);
      var title = tm ? _unescape(tm[1]).trim() : '';
      if (!title) {
        var tm2 = chunk.match(/hg-rank-item__title"><a[^>]*>([^<]+)</);
        title = tm2 ? _unescape(tm2[1]).trim() : '';
      }
      var cm = chunk.match(/<img[^>]*data-src="([^"]+)"/);
      var cover = cm ? _unescape(cm[1]) : '';
      if (cover.indexOf('placeholder') >= 0) cover = '';
      var dm = chunk.match(/hg-rank-item__desc">([^<]+)</);
      var desc = dm ? _unescape(dm[1]).trim() : '';
      var remark = '';
      var sm = chunk.match(/([\d.]+分)/);
      if (sm) remark = sm[1];
      var em = chunk.match(/(全\d+集|更新至\d+集)/);
      if (em) remark = (remark + ' ' + em[1]).trim();
      result.list.push({
        vod_id: vid, vod_name: title,
        vod_pic: cover ? self._wrapPic(cover) : '',
        vod_remarks: remark, vod_content: desc,
      });
    });
    result.total = result.list.length;
    result.pagecount = 1;
    return result;
  },

  // 专题（upload.py _category_topics 同款：单页 SSR，limit 24）
  _categoryTopics: async function (topicSlug, page) {
    var result = { list: [], page: page, pagecount: 1, limit: 24, total: 0 };
    if (!topicSlug) {
      // 未选专题时用第一个专题兜底，避免「分类无数据」
      var ts = await this._getTopics();
      if (ts && ts.length > 0) topicSlug = ts[0].slug;
    }
    if (!topicSlug || page > 1) return result; // 专题页单页直出（/topics/{slug}/page/2/ 为 404）
    var doc = await this._getText('/topics/' + topicSlug + '/', null, null, 1, 0);
    if (!doc) return result;
    result.list = this._parseDramaCards(doc);
    result.total = result.list.length;
    result.pagecount = 1;
    return result;
  },

  // 标签（upload.py _category_tag 同款：SSR，data-pages 翻页）
  _categoryTag: async function (slug, page) {
    var per = 20;
    var result = { list: [], page: page, pagecount: 1, limit: per, total: 0 };
    var where = '/tag/' + slug + '/';
    if (page > 1) {
      if (!slug) return result;
      where = '/tag/' + slug + '/page/' + page + '/';
    }
    var doc = await this._getText(where, null, null, 1, 0);
    if (!doc) return result;
    result.list = this._parseDramaCards(doc);
    var pm = doc.match(/data-pages="(\d+)"/);
    var pages = pm ? _num(pm[1], 0) : 0;
    result.pagecount = pages ? pages : (result.list.length >= per ? page + 1 : page);
    result.total = result.list.length;
    return result;
  },

  // 通用 SSR 剧集列表页：/newest、/original/、/recommend（三者都是
  // hg-drama-card 卡片 + data-pages 分页，翻页都是 /{base}/{N}/，
  // 不是 /page/N/；卡片用 _parseDramaCards 解析）。
  // 2026-11-15 实测：
  //   /newest（最近上新）：62 页，每页 28 条
  //   /original/（黄果原创）：6 页，每页 39 条
  //   /recommend（热门推荐）：3 页，每页 28 条
  // 注意首页 URL 的斜杠有讲究：/newest 与 /recommend 不能带尾斜杠
  // （带了只返回 42 字节），/original/ 必须带尾斜杠（不带只返回 45
  // 字节）。所以 page=1 时原样用 base；page>1 时统一拼 base/{N}/。
  _categorySsrList: async function (base, page) {
    var result = { list: [], page: page, pagecount: 1, limit: 28, total: 0 };
    var where = base;
    if (page > 1) {
      where = base.replace(/\/$/, '') + '/' + page + '/';
    }
    var doc = await this._getText(where, null, null, 1, 0);
    if (!doc) return result;
    result.list = this._parseDramaCards(doc);
    var pm = doc.match(/data-pages="(\d+)"/);
    var pages = pm ? _num(pm[1], 0) : 0;
    result.pagecount = pages ? pages : (result.list.length >= 28 ? page + 1 : page);
    result.total = result.list.length;
    return result;
  },

  // 吃瓜（upload.py _category_chigua 同款：每页 12 条；注意子分类分页不是 page/N/）
  // 2026-11-14 实测：吃瓜已从 /chigua/ 迁到 /blog/——
  //   全部：/blog/，翻页 /blog/page/N/（data-pages=65）
  //   热门吃瓜（黑料吃瓜）：/blog/gossip/，翻页 /blog/gossip/N/（data-pages=36）
  //   AI原创（短剧剧评）：/blog/reviews/，翻页 /blog/reviews/N/（data-pages=29）
  // 卡片也换了：旧 <a class="hg-post-card"> 已只剩 CSS，真实卡片是
  // <a class="hg-cate-feed__card" href="/archives/{id}/">，
  // 标题在 data-track-item-name（或 h2.hg-cate-feed__title），
  // 日期在 span.hg-cate-feed__date。
  _categoryChigua: async function (cate, page) {
    var per = 12;
    var result = { list: [], page: page, pagecount: 1, limit: per, total: 0 };
    var base;
    if (cate === 'remen') base = '/blog/gossip/';
    else if (cate === 'yuanchuang') base = '/blog/reviews/';
    else base = '/blog/';
    var path;
    if (page <= 1) path = base;
    else if (base === '/blog/') path = base + 'page/' + page + '/';
    else path = base + page + '/';
    var doc = await this._getText(path, null, null, 1, 0);
    if (!doc) return result;
    var seen = {};
    var self = this;
    doc.split('<a class="hg-cate-feed__card"').slice(1).forEach(function (chunk) {
      var hm = chunk.match(/href="\/archives\/(\d+)\/"/);
      if (!hm) return;
      var pid = hm[1];
      if (seen[pid]) return;
      seen[pid] = true;
      var tm = chunk.match(/data-track-item-name="([^"]+)"/);
      var title = tm ? _unescape(tm[1]).trim() : '';
      if (!title) {
        var tm2 = chunk.match(/<h2[^>]*class="hg-cate-feed__title"[^>]*>(.*?)<\/h2>/);
        title = tm2 ? _unescape(tm2[1].replace(/<[^>]+>/g, '')).trim() : ('吃瓜' + pid);
      }
      var im = chunk.match(/<img[^>]*data-src="([^"]+)"/) || chunk.match(/<img[^>]*src="(https?:\/\/[^"]+)"/);
      var pic = im ? self._wrapPic(_unescape(im[1])) : '';
      var dm = chunk.match(/hg-cate-feed__date">([^<]+)</);
      var date = dm ? dm[1].trim() : '';
      result.list.push({
        vod_id: 'archives_' + pid,
        vod_name: title,
        vod_pic: pic,
        vod_remarks: date,
      });
    });
    var pm = doc.match(/data-pages="(\d+)"/);
    var pages = pm ? _num(pm[1], 0) : 0;
    result.pagecount = pages ? pages : (result.list.length >= per ? page + 1 : page);
    result.total = result.list.length;
    return result;
  },

  /* ---------- 详情（upload.py detailContent 同款） ---------- */
  detail: async function (ids) {
    var vid = '';
    if (Array.isArray(ids)) {
      if (!ids || ids.length === 0) return { list: [] };
      vid = _str(ids[0]).trim();
    } else {
      vid = _str(ids).trim();
    }
    if (!vid) return { list: [] };
    if (vid.indexOf('archives_') === 0) {
      return this._detailArchives(vid.replace('archives_', ''));
    }
    return this._detailVideo(vid);
  },

  // 兼容入口（部分壳调 detailContent）
  detailContent: async function (ids) {
    return this.detail(ids);
  },

  _cleanTitle: function (t) {
    t = _unescape(t || '').trim();
    t = t.replace(/\s*[-|_]\s*(黄果短剧|短剧视频在线观看|AI成人短剧).*$/, '').trim();
    return t;
  },

  // 短剧详情（upload.py _detail_video 同款：episodes[] 权威；只取 status 在 (None,1) 的集）
  _detailVideo: async function (vid) {
    var result = { list: [] };
    var data = {};
    try {
      var j = await this._api('/api/videos/' + encodeURIComponent(vid));
      data = (j && j.data) || {};
    } catch (e) {
      data = {};
    }
    var title = this._cleanTitle(data.title);
    var cover = data.cover || '';
    var descParts = [];
    if (data.description) descParts.push(String(data.description).trim());
    if (data.tags) descParts.push('题材：' + _joinField(data.tags));
    var author = (data.author && data.author.name) || '';
    if (author) descParts.push('作者：' + author);
    var cnt = data.counts || {};
    if (cnt && (cnt.hot !== undefined || cnt.collect !== undefined || cnt.like !== undefined)) {
      descParts.push('热度：' + (cnt.hot === undefined ? '-' : cnt.hot) + '  收藏：' + (cnt.collect === undefined ? '-' : cnt.collect) + '  点赞：' + (cnt.like === undefined ? '-' : cnt.like));
    }
    // ── 无 API 时退回网页解析 ──
    var html = null;
    if (!data || Object.keys(data).length === 0) {
      html = await this._getText('/video/' + vid + '/', null, null, 1, 0) || '';
      if (!title) {
        var tm = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        title = tm ? this._cleanTitle(tm[1]) : vid;
      }
      if (!cover) {
        var cm = html.match(/property="og:image"\s+content="([^"]+)"/);
        cover = cm ? cm[1] : '';
      }
      if (descParts.length === 0) {
        var dm = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
        if (dm) descParts.push(_unescape(dm[1]).trim());
      }
    }
    // ── 选集：以接口 episodes[] 为权威 ──
    var eps = data.episodes || [];
    var epNums = [];
    eps.forEach(function (e) {
      var n = 0;
      try { n = _num(e.ep_num, 0); } catch (err) { n = 0; }
      if (n > 0 && (e.status === null || e.status === undefined || e.status === 1)) epNums.push(n);
    });
    if (epNums.length === 0) {
      var total = 0;
      try { total = _num(data.episode_count, 0); } catch (e) { total = 0; }
      if (total > 0) {
        for (var i = 1; i <= total; i++) epNums.push(i);
      }
    }
    if (epNums.length === 0) {
      // 网页兜底：从 trackingEpisodes 拿集号
      if (html === null) html = await this._getText('/video/' + vid + '/', null, null, 1, 0) || '';
      var tm2 = (html || '').match(/"trackingEpisodes"\s*:\s*\{(.*?)\}\s*,\s*"trackingVideo"/s);
      if (tm2) {
        var set = {};
        var m;
        var re = /"(\d+)"\s*:\s*\{/g;
        while ((m = re.exec(tm2[1])) !== null) set[_num(m[1], 0)] = true;
        epNums = Object.keys(set).map(function (k) { return _num(k, 0); }).filter(function (n) { return n > 0; }).sort(function (a, b) { return a - b; });
      }
    }
    if (epNums.length === 0) epNums = [1];
    var segs = [];
    var self = this;
    epNums.forEach(function (n) {
      segs.push('第' + n + '集$' + EP_PREFIX + '|' + vid + '|' + n);
    });
    result.list.push({
      vod_id: vid,
      vod_name: title || vid,
      vod_pic: self._wrapPic(cover),
      vod_content: descParts.filter(function (p) { return !!p; }).join('\n'),
      vod_year: '',
      vod_area: '',
      vod_remarks: ('全' + epNums.length + '集') + (data.is_finished ? '' : '·连载'),
      vod_play_from: '黄果短剧',
      vod_play_url: segs.join('#'),
    });
    return result;
  },

  // 吃瓜详情（upload.py _detail_archives 同款：正文图与视频分两组，$$$ 分隔）
  _detailArchives: async function (postId) {
    var result = { list: [] };
    var doc = await this._getText('/archives/' + postId + '/', null, null, 1, 0);
    if (!doc) return result;
    var tm = doc.match(/<h1[^>]*class="hg-post-detail__title"[^>]*>(.*?)<\/h1>/s)
      || doc.match(/<h1[^>]*>(.*?)<\/h1>/s)
      || doc.match(/<title>(.*?)<\/title>/s);
    var title = tm ? this._cleanTitle(tm[1].replace(/<[^>]+>/g, '')) : ('吃瓜' + postId);
    var bm = doc.match(/<div class="hg-post-detail__body[^"]*"(.*?)(?:<div class="hg-post-detail__tags|<div class="hg-post-detail__nav|<\/article>|<footer)/s);
    var body = bm ? bm[1] : '';
    // 正文文字
    var desc = '';
    if (body) {
      var txt = body.replace(/<(script|style)[^>]*>.*?<\/\1>/gs, '')
        .replace(/<(video|source|iframe|img)[^>]*>/g, '')
        .replace(/<[^>]+>/g, ' ');
      txt = _unescape(txt);
      txt = txt.replace(/\s+/g, ' ').trim();
      desc = txt.slice(0, 1200);
    }
    // 正文图（懒加载真图在 data-src）
    var imgs = [];
    var self = this;
    var imgRe = /<img[^>]+>/g;
    var m;
    while ((m = imgRe.exec(body || doc)) !== null) {
      var tag = m[0];
      var um = tag.match(/data-src="([^"]+)"/) || tag.match(/src="(https?:\/\/[^"]+)"/);
      if (!um) continue;
      var u = _unescape(um[1]);
      if (u.indexOf('placeholder') >= 0 || u.toLowerCase().indexOf('logo') >= 0 || u.indexOf('/static/') >= 0) continue;
      imgs.push(u);
    }
    imgs = imgs.filter(function (u, i) { return imgs.indexOf(u) === i; });
    var pic = imgs.length > 0 ? imgs[0] : '';
    if (!pic) {
      var pm = doc.match(/property="og:image"\s+content="([^"]+)"/);
      pic = pm ? _unescape(pm[1]) : '';
    }
    // 正文视频（接口实时下发）
    var videos = [];
    try {
      var j = await this._postJson('/api/posts/' + postId + '/playback');
      var vs = (j && j.data && j.data.videos) || [];
      vs.forEach(function (v) {
        var u = (v || {}).url;
        if (u && String(u).indexOf('http') === 0) videos.push(String(u).replace(/\\u0026/g, '&'));
      });
    } catch (e) { /* ignore */ }
    if (videos.length === 0) {
      // 兜底：页面里直接出现的 m3u8/mp4
      var vm = doc.match(/https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*/g) || [];
      vm.forEach(function (u) {
        u = _unescape(u).replace(/&amp;/g, '&');
        if (videos.indexOf(u) < 0) videos.push(u);
      });
    }
    var lines = [];
    var urls = [];
    if (videos.length > 0) {
      var segs = [];
      videos.forEach(function (u, i) {
        var name = videos.length === 1 ? '视频' : ('视频' + (i + 1));
        segs.push(name + '$' + POST_PREFIX + '|' + postId + '|' + i);
      });
      lines.push('黄果视频');
      urls.push(segs.join('#'));
    }
    if (imgs.length > 0) {
      var isegs = [];
      imgs.forEach(function (u, i) {
        isegs.push('图' + (i + 1) + '$' + self._wrapPic(u));
      });
      lines.push('黄果图集');
      urls.push(isegs.join('#'));
    }
    if (lines.length === 0) {
      lines.push('黄果视频');
      urls.push('第1集$' + this.host + '/archives/' + postId + '/');
    }
    result.list.push({
      vod_id: 'archives_' + postId,
      vod_name: title,
      vod_pic: this._wrapPic(pic),
      vod_content: desc || '吃瓜内容',
      vod_remarks: videos.length > 0 ? ('视频' + videos.length) : ('图集' + imgs.length),
      vod_play_from: lines.join('$$$'),
      vod_play_url: urls.join('$$$'),
    });
    return result;
  },

  /* ---------- 搜索（upload.py searchContent 同款） ---------- */
  search: async function (key, quick, pg) {
    var result = { list: [], page: 1, pagecount: 1, limit: 20, total: 0 };
    var page = 1;
    try { page = Math.max(_num(pg, 1), 1); } catch (e) { page = 1; }
    var data = await this._api('/api/search?q=' + encodeURIComponent(key || '') + '&page=' + page + '&size=20');
    var d = (data && data.data) || {};
    var items = d.items || [];
    var seen = {};
    var self = this;
    items.forEach(function (it) {
      var vid = String(it.id || '');
      if (!vid || seen[vid]) return;
      seen[vid] = true;
      result.list.push({
        vod_id: vid,
        vod_name: it.title || '',
        vod_pic: self._wrapPic(it.cover || ''),
        vod_remarks: self._remarks(it),
      });
    });
    var pgd = d.pagination || {};
    result.page = page;
    result.total = pgd.total || result.list.length;
    result.pagecount = Math.max(1, _num(pgd.pages, (result.list.length >= 20 ? page + 1 : page)));
    return result;
  },

  /* ---------- 播放（upload.py playerContent 链路同款） ---------- */
  // 播放请求头（upload.py _play_header 同款：cdn 鉴权头 + x-cdn-app）
  _playHeader: function (cdn) {
    var hdr = { 'User-Agent': this.headers['User-Agent'], 'Referer': this.host + '/' };
    if (_isObj(cdn) && cdn.m3u8Enabled && cdn.authKey && cdn.authValue) {
      hdr[String(cdn.authKey)] = String(cdn.authValue);
      if (cdn.app) hdr['x-cdn-app'] = String(cdn.app);
    }
    return hdr;
  },

  // 播放流校验：取首 1KB 判型（upload.py _sniff_play 同款）
  // 返回 { kind: 'm3u8'|'ts'|'image'|'html'|'bin'|'', text: m3u8 文本（仅 m3u8 时） }
  _sniffPlay: async function (url, hdr, timeout) {
    var h = {};
    var k;
    for (k in (hdr || {})) h[k] = hdr[k];
    h['Range'] = 'bytes=0-1023';
    var raw = await this._raw(url, { headers: h, timeout: timeout || 8000, buffer: 2 });
    if (!raw || (raw.code !== 200 && raw.code !== 206) || !raw.text) return { kind: '', text: '' };
    var buf = _b64decodeToBytes(raw.text);
    if (!buf || buf.length === 0) {
      // 经典环境 text 可能是二进制串而非 base64 时的兜底
      try {
        if (typeof Buffer !== 'undefined') buf = Buffer.from(raw.text, 'binary');
      } catch (e) { /* ignore */ }
    }
    if (!buf || buf.length === 0) return { kind: '', text: '' };
    var b = buf.slice(0, 1024);
    var head7 = b.slice(0, 7).toString('utf8', 0, Math.min(7, b.length));
    var low200 = b.slice(0, Math.min(200, b.length)).toString('utf8').toLowerCase();
    if (head7 === '#EXTM3U' || low200.indexOf('#extm3u') >= 0) {
      var text = '';
      try { text = b.toString('utf8'); } catch (e) { text = ''; }
      return { kind: 'm3u8', text: text };
    }
    if (b[0] === 0x47) return { kind: 'ts', text: '' };
    if ((b.length >= 8 && b[0] === 0x89 && b[1] === 0x50) || (b.length >= 2 && b[0] === 0xff && b[1] === 0xd8) || (b.length >= 4 && b[0] === 0x52 && b[1] === 0x49)) {
      return { kind: 'image', text: '' };
    }
    if (low200.indexOf('<html') >= 0 || low200.indexOf('<!doctype') >= 0 || low200.indexOf('<script') >= 0) {
      return { kind: 'html', text: '' };
    }
    return { kind: 'bin', text: '' };
  },

  // 首播校验（upload.py _check_stream 同款：失败一律 fail-open；
  // 相对路径 m3u8 走代理重写为绝对地址再返回）
  _checkStream: async function (url, hdr) {
    var host = '';
    try {
      if (typeof URL !== 'undefined') host = new URL(url).hostname || '';
    } catch (e) { /* ignore */ }
    if (host && this._streamOkHosts[host]) return url;
    var sniff = await this._sniffPlay(url, hdr);
    if (sniff.kind === 'm3u8') {
      var abs = _m3u8Abs(url, sniff.text);
      if (host) this._streamOkHosts[host] = true;
      if (abs.changed) {
        // 相对路径：走代理把重写后的播放列表递给壳
        try { this._playHdrs[host] = Object.assign({}, hdr || {}); } catch (e) { /* ignore */ }
        return this._picProxy(url, 'm3u8');
      }
      return url;
    }
    if (sniff.kind === 'html' || sniff.kind === 'image') {
      // 拿到盾页/图片：不是视频流
      return '';
    }
    if (host) this._streamOkHosts[host] = true;
    return url;
  },

  // 短剧播放（upload.py _video_playback 同款；streams 取 main → hevc → preview，
  // 比原版多两档兜底——原版只取 main，这里不降级；ep==1 兜底详情 video_url）
  _videoPlayback: async function (vid, ep) {
    try { ep = _num(ep, 1); } catch (e) { ep = 1; }
    var url = '';
    var cdn = {};
    for (var attempt = 0; attempt < 2; attempt++) {
      var j = await this._apiPost('/api/videos/' + vid + '/episodes/' + ep + '/playback', {});
      var d = (j && j.data) || {};
      if (Array.isArray(d)) d = {};
      var streams = d.streams || {};
      url = streams.main || streams.hevc || streams.preview || '';
      if (url) {
        return { url: String(url).replace(/\\u0026/g, '&'), cdn: d.cdn || {} };
      }
      await new Promise(function (res) { setTimeout(res, 400); });
    }
    // 兜底：详情接口自带第1集地址
    if (ep === 1) {
      try {
        var j2 = await this._api('/api/videos/' + vid);
        var d2 = (j2 && j2.data) || {};
        var u2 = d2.video_url || '';
        if (u2) return { url: String(u2).replace(/\\u0026/g, '&'), cdn: {} };
      } catch (e) { /* ignore */ }
    }
    return { url: '', cdn: {} };
  },

  // 吃瓜播放（upload.py _post_playback 同款）
  _postPlayback: async function (pid, idx) {
    try { idx = _num(idx, 0); } catch (e) { idx = 0; }
    var j = await this._postJson('/api/posts/' + pid + '/playback');
    var d = (j && j.data) || {};
    var vids = d.videos || [];
    if (idx >= 0 && idx < vids.length) {
      return { url: String((vids[idx] || {}).url || '').replace(/\\u0026/g, '&'), cdn: d.cdn || {} };
    }
    if (vids.length > 0) {
      return { url: String((vids[0] || {}).url || '').replace(/\\u0026/g, '&'), cdn: d.cdn || {} };
    }
    return { url: '', cdn: {} };
  },

  // 播放（upload.py playerContent 同款；TVBox 的 lazy/play 都是它）
  playerContent: async function (flag, id, vipFlags) {
    var result = { parse: 0, url: '', header: this._playHeader() };
    var raw = _str(id || '').trim();
    if (!raw) return result;
    // 兼容壳传入 "第N集$xxx" 的完整片段
    if (raw.indexOf('$') >= 0 && raw.indexOf('http') !== 0) {
      raw = raw.split('$').pop().trim();
    }
    // 播放缓存：直链 5 分钟有效；同集重复点播不再重新取流
    // （签名 m3u8 每次取的 auth_key 都不同，缓存保证 play/lazy 一致）
    var cacheKey = raw;
    var hit = this._getPlayCache(cacheKey);
    if (hit) {
      return { parse: hit.parse || 0, url: hit.url, header: hit.header || this._playHeader(), format: hit.format || 'hls' };
    }
    var url = '';
    var cdn = {};
    var p, vid, ep, pid, idx;
    if (raw.indexOf(EP_PREFIX + '|') === 0) {
      p = raw.split('|');
      vid = p.length > 1 ? p[1] : '';
      ep = p.length > 2 ? p[2] : '1';
      if (vid) {
        var r1 = await this._videoPlayback(vid, ep);
        url = r1.url; cdn = r1.cdn;
        if (!url && ep !== '1') {
          // 不静默回落到第 1 集（会串集），交给壳打开对应剧集页
        } else if (!url) {
          var r1b = await this._videoPlayback(vid, 1);
          url = r1b.url; cdn = r1b.cdn;
        }
      }
    } else if (raw.indexOf(POST_PREFIX + '|') === 0) {
      p = raw.split('|');
      pid = p.length > 1 ? p[1] : '';
      idx = p.length > 2 ? p[2] : '0';
      if (pid) {
        var r2 = await this._postPlayback(pid, idx);
        url = r2.url; cdn = r2.cdn;
      }
    } else if (raw.indexOf('archives_') === 0) {
      var d = await this._detailArchives(raw.replace('archives_', ''));
      var line = ((d.list || [{}])[0].vod_play_url || '').split('$$$')[0];
      var seg = line.split('#')[0];
      if (seg.indexOf('$') >= 0) {
        var sub = seg.split('$', 2)[1];
        if (sub.indexOf(POST_PREFIX + '|') === 0) {
          p = sub.split('|');
          var r3 = await this._postPlayback(p[1], p.length > 2 ? p[2] : 0);
          url = r3.url; cdn = r3.cdn;
        } else if (sub.indexOf('http') === 0) {
          url = sub;
        }
      }
    } else if (raw.indexOf('http') === 0) {
      url = raw.replace(/\\u0026/g, '&');
    } else if (/^\d+$/.test(raw)) {
      var r4 = await this._videoPlayback(raw, 1);
      url = r4.url; cdn = r4.cdn;
    }
    if (url) {
      var hdr = this._playHeader(cdn);
      var checked = await this._checkStream(url, hdr);
      if (checked) {
        result.url = checked;
        result.header = hdr;
        this._setPlayCache(cacheKey, { url: checked, header: hdr, format: 'hls', parse: 0 });
        return result;
      }
    }
    // 取不到直链：交给壳解析网页
    result.parse = 1;
    if (raw.indexOf(EP_PREFIX + '|') === 0) {
      p = raw.split('|');
      vid = p.length > 1 ? p[1] : '';
      ep = p.length > 2 ? p[2] : '1';
      if (ep && ep !== '1') result.url = this.host + '/video/' + vid + '/ep-' + ep + '/';
      else result.url = this.host + '/video/' + vid + '/';
    } else if (raw.indexOf('archives_') === 0) {
      result.url = this.host + '/archives/' + raw.replace('archives_', '') + '/';
    } else if (/^\d+$/.test(raw)) {
      result.url = this.host + '/video/' + raw + '/';
    } else {
      result.url = this.host + '/';
    }
    return result;
  },

  // Arcane 常调用的两个播放入口都指向 playerContent
  play: async function (flag, id, vipFlags) {
    return this.playerContent(flag, id, vipFlags);
  },
  lazy: async function (flag, id, vipFlags) {
    return this.playerContent(flag, id, vipFlags);
  },
  playContent: async function (flag, id, vipFlags) {
    return this.playerContent(flag, id, vipFlags);
  },

  // 播放缓存（直链 5 分钟有效；同集重复点播不再重新取流）
  _getPlayCache: function (key) {
    var hit = this._playCache[key];
    if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit;
    return null;
  },
  _setPlayCache: function (key, value) {
    this._playCache[key] = { url: value.url, header: value.header, format: value.format, parse: value.parse, at: Date.now() };
  },

  isVideoFormat: function (url) {
    if (!url) return false;
    return /\.(m3u8|mp4|avi|flv|mkv|ts)\b/i.test(url) || String(url).toLowerCase().indexOf('m3u8') >= 0;
  },
  manualVideoCheck: function () { return false; },

  /* ---------- 封面中转（加密封面默认直接走 Netlify 中转） ---------- */
  // 封面统一走中转或本地代理（upload.py 的 _wrap_pic 在 _picProxy 之前先
  // 判一次：加密图床（drleao/aluxvl）且中转开着，就直接走中转，不再经过
  // 手机上不稳的本地 127.0.0.1 /proxy 链路；其余图走本地代理透传）
  // 中转封面地址：中转地址无效/被清空时回落到默认中转（v1.0.1：Rex 里
  // 没有别的出图路，宁可走默认中转也不要拼出 404 的地址）。
  _relayCover: function (pic) {
    var relay = _normalizeRelayUrl(this._coverRelay) || COVER_RELAY;
    return relay + '?u=' + encodeURIComponent(pic);
  },

  /* ---------- 图片代理（upload.py localProxy 同款） ---------- */
  proxy: async function (param) {
    var typ = '';
    var url = '';
    try {
      if (_isObj(param)) {
        typ = _str(param.type || '');
        url = _str(param.url || '');
      } else if (typeof param === 'string') {
        var p = param;
        if (p.indexOf('proxy://') === 0) p = p.slice('proxy://'.length);
        if (p.charAt(0) === '?') p = p.slice(1);
        var qs = {};
        p.split('&').forEach(function (kv) {
          var i = kv.indexOf('=');
          if (i >= 0) qs[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1));
        });
        typ = qs.type || '';
        url = qs.url || '';
      } else if (Array.isArray(param) && param.length === 2) {
        typ = _str(param[0]); url = _str(param[1]);
      }
    } catch (e) {
      return [404, 'text/plain', '', {}];
    }
    if (typ !== 'img' && typ !== 'm3u8') return [404, 'text/plain', '', {}];
    // URL 可能以三种形态传进来，都兼容：
    //  - Arcane /proxy 处理器经 URLSearchParams 解码后的原地址（直接 http 开头）
    //  - upload.py 式 percent-encoding（_picProxy 用 encodeURIComponent 拼的）
    //  - v4.0.0 式 base64（_picProxy 也可传 base64）
    var rawUrl = String(url || '').trim();
    var imgUrl = rawUrl;
    if (imgUrl.indexOf('http') !== 0) {
      try {
        var dec = decodeURIComponent(imgUrl);
        if (dec.indexOf('http') === 0) imgUrl = dec;
      } catch (e) { /* ignore */ }
    }
    if (imgUrl.indexOf('http') !== 0) {
      try {
        var b = _b64decodeToBytes(imgUrl);
        if (b) {
          var s = b.toString('utf8');
          if (s.indexOf('http') === 0) imgUrl = s;
        }
      } catch (e) { /* ignore */ }
    }
    if (imgUrl.indexOf('http') !== 0) return [400, 'text/plain', '', {}];
    if (typ === 'm3u8') {
      // 只用于「相对路径播放列表」兜底：抓下来改绝对地址再交给壳
      var hdr = { 'User-Agent': this.headers['User-Agent'], 'Referer': this.host + '/' };
      try {
        var host = '';
        if (typeof URL !== 'undefined') host = new URL(imgUrl).hostname || '';
        if (host && this._playHdrs[host]) {
          var ph = this._playHdrs[host];
          Object.keys(ph).forEach(function (k) { hdr[k] = ph[k]; });
        }
      } catch (e) { /* ignore */ }
      var rawM = await this._raw(imgUrl, { headers: hdr, timeout: 15000, buffer: 2 });
      if (!rawM || rawM.code !== 200 || !rawM.text) return [404, 'text/plain', '', {}];
      var text = '';
      try {
        var b = _b64decodeToBytes(rawM.text);
        text = b ? b.toString('utf8') : rawM.text;
      } catch (e) {
        text = rawM.text;
      }
      var fixed = _m3u8Abs(imgUrl, text);
      return [200, 'application/vnd.apple.mpegurl', fixed.text, {}];
    }
    // type=img：图源候选顺序逐个试（原图 → 去签名 → WebP 派生 → 镜像域）
    var lastRaw = null;
    var cands = this._imgCandidates(imgUrl);
    for (var i = 0; i < cands.length; i++) {
      var cand = cands[i];
      if (!cand) continue;
      // 中转优先：加密封面直接走 Netlify 中转解密
      if (this._coverRelayFirst && this._coverRelay) {
        var relayUrl = this._relayCover(cand);
        var rr = await this._raw(relayUrl, { timeout: COVER_RELAY_TIMEOUT, buffer: 2 });
        if (rr && rr.code === 200 && rr.text) {
          var rb = _b64decodeToBytes(rr.text);
          if (rb && _isImageBytes(rb)) {
            return [200, _imageMime(rb, cand), rb, {}];
          }
        }
      }
      var raw = await this._getBin(cand, COVER_FETCH_TIMEOUT);
      if (!raw || raw.length < 32 || raw[0] === 0x3c) continue; // '<' = HTML 错误页
      if (_isImageBytes(raw)) {
        return [200, _imageMime(raw, cand), raw, {}];
      }
      var dec = await this._aesCbcDecrypt(raw);
      if (dec) {
        var pad = dec[dec.length - 1];
        if (pad >= 1 && pad <= 16 && dec.length >= pad) {
          var ok = true;
          for (var q = dec.length - pad; q < dec.length; q++) {
            if (dec[q] !== pad) { ok = false; break; }
          }
          if (ok) dec = dec.slice(0, dec.length - pad);
        }
        if (_isImageBytes(dec)) {
          return [200, _imageMime(dec, cand), dec, {}];
        }
        if (lastRaw === null) lastRaw = dec;
      } else if (lastRaw === null) {
        lastRaw = raw;
      }
    }
    if (lastRaw) {
      return [200, _imageMime(lastRaw, imgUrl), lastRaw, {}];
    }
    // v1.0.6：直取全失败后，再走一次中转兜底。_coverRelayFirst 关着时
    // （v1.0.6 起站源默认关），循环里那次中转不会跑；但中转仍是最后一道
    // 防线——直取失败不代表图不存在，先问中转，实在不行才回占位图。
    if (this._coverRelay) {
      var relayUrl2 = this._relayCover(imgUrl);
      var rr2 = await this._raw(relayUrl2, { timeout: COVER_RELAY_TIMEOUT, buffer: 2 });
      if (rr2 && rr2.code === 200 && rr2.text) {
        var rb2 = _b64decodeToBytes(rr2.text);
        if (rb2 && _isImageBytes(rb2)) {
          return [200, _imageMime(rb2, imgUrl), rb2, {}];
        }
      }
    }
    // 站方缺图/全候选失败：回占位图 200，避免真机裂图
    return [200, 'image/png', _b64decodeToBytes(PLACEHOLDER_B64), {}];
  },

  // 64x64 深灰占位图（upload.py _placeholder 同款）
  _placeholder: function () {
    return _b64decodeToBytes(PLACEHOLDER_B64);
  },

  // 图源候选顺序：原图（带签名）→ 去签名原图 → CDN WebP 派生 →（旧域才试）同路径镜像
  // 实测该站 .webp 派生多为原图的 1.2~1.5 倍，只作兜底（upload.py _img_candidates 同款）
  _imgCandidates: function (url) {
    var out = [url];
    var bare = url.split('?')[0];
    if (bare !== url) out.push(bare);
    try {
      var u = null;
      if (typeof URL !== 'undefined') u = new URL(url);
      if (u) {
        var h = (u.hostname || '').toLowerCase();
        if (WEBP_HOSTS[h] && u.pathname) {
          out.push(WEBP_BASE + u.pathname + '.webp');
        }
        if (!GOOD_IMG_HOSTS[h] && u.pathname) {
          out.push('https://pic.drleao.cn' + u.pathname);
          out.push('https://new.drleao.cn' + u.pathname);
        }
      }
    } catch (e) { /* ignore */ }
    var seen = {};
    var res = [];
    out.forEach(function (x) {
      if (!seen[x]) { seen[x] = true; res.push(x); }
    });
    return res;
  },

  _isImgHead: function (b) {
    return _isImageBytes(b);
  },

  _imgMime: function (b) {
    return _imageMime(b);
  },

  // AES-128-CBC 解密（upload.py _aes_cbc_decrypt 同款；JS 侧用平台 AES，
  // 不搬纯 Python T 表——Arcane 有 aesX，Node 有 crypto）
  _aesCbcDecrypt: async function (data) {
    var key = this._aesKeyBytes();
    var iv = this._aesIvBytes();
    if (!key || !iv || !data || data.length < 16) return null;
    // Node crypto（测试环境）
    try {
      if (typeof require === 'function') {
        var crypto = require('crypto');
        if (crypto && crypto.createDecipheriv) {
          var d = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key), Buffer.from(iv));
          d.setAutoPadding(false);
          var out = Buffer.concat([d.update(Buffer.from(data)), d.final()]);
          return out;
        }
      }
    } catch (e) { /* ignore */ }
    // Arcane tvbox_js 的 aesX（真机；与 v4.0.0 已验证的调用一致）
    // aesX(mode, encrypt, input, inBase64, key, iv, outBase64)
    try {
      if (typeof aesX === 'function') {
        var b64 = '';
        try { b64 = Buffer.from(data).toString('base64'); } catch (e) { b64 = ''; }
        if (!b64) return null;
        var plainB64 = aesX('AES/CBC/PKCS7Padding', false, b64, true, IMG_KEY, IMG_IV, true);
        return plainB64 ? _b64decodeToBytes(plainB64) : null;
      }
    } catch (e) { /* ignore */ }
    return null;
  },

  _aesKeyBytes: function () {
    try {
      if (typeof Buffer !== 'undefined') return Buffer.from(IMG_KEY, 'utf8');
    } catch (e) { /* ignore */ }
    return null;
  },
  _aesIvBytes: function () {
    try {
      if (typeof Buffer !== 'undefined') return Buffer.from(IMG_IV, 'utf8');
    } catch (e) { /* ignore */ }
    return null;
  },

  /* ---------- Rex 首页推荐架（模块入口的辅助方法） ---------- */
  _toItem: function (it) {
    if (!it) return null;
    // v1.0.2：App 读的封面字段是 posterPath / backdropPath（官方 Rex 模块
    // rex-tmdb.js、bangumi.js 只用这两个），根本不认 cover；只给 cover
    // 时 App 拿不到图（v1.0.0/1.0.1 全屏空白的原因）。三个字段同时给，
    // 值都是中转后的封面地址（与 v4.0.0 的写法一致）。
    // v1.0.3：App 点条目时拿条目的 link 字段当 params.link 传给
    // loadDetail；没有 link 就报“模块未提供详情链接”。补上 type 与 link
    //（与 v4.0.0 的 _toItem 写法一致）。
    // v1.0.7（upload.js / Forward 的写法）：type 改成 App 认识的 'url'
    // 并补 mediaType: 'tv'——之前 `type: 'huangguo'` 是自造类型，App
    // 认不出这是可播剧集，才退回 TMDB 标题匹配（枪欲玫瑰被匹配成
    // Guns N' Roses 乐队就是这么来的）。link 仍是 'huangguo:<id>'，
    // loadDetail 按它解析，不动。
    // v1.0.7：Rex 里中转地址的图显示不出来（chunked、无 Content-Length），
    // 改成标题海报保证有图；明文图直链（有 Content-Length）保留；
    // 站源里本地代理的真图保留（有 getProxyUrl 就不是 Rex）。
    // v1.0.8：中转是 Cloudflare Worker（带 Content-Length）时不换海报，
    // 中转真图能直接显示；只有 Netlify 中转才换标题海报。
    var pic = it.vod_pic || '';
    var title = it.vod_name || '';
    if (pic && (typeof getProxyUrl !== 'function') && _isRelayUrl(pic, this._coverRelay) && !_isWorkerRelay(this._coverRelay)) {
      pic = _titlePoster(title);
    }
    var vid = 'huangguo:' + (it.vod_id || '');
    return {
      id: vid,
      type: 'url',
      link: vid,
      title: title,
      mediaType: 'tv',
      cover: pic,
      coverUrl: pic,
      posterPath: pic,
      backdropPath: pic,
      remark: it.vod_remarks || '',
      desc: it.vod_content || '',
    };
  },
  _toItems: function (list) {
    var self = this;
    return (list || []).map(function (it) { return self._toItem(it); }).filter(function (x) { return !!x; });
  },

  // 基础分类行（走 /api/videos/category/{id}）
  _videoPage: async function (baseId, page, sort) {
    var res = await this._categoryApi(baseId, sort || 'latest', page || 1);
    return this._toItems(res.list || []);
  },
  // 热门推荐行（官网 /recommend SSR；v1.0.5 起，不再用 ai-duanju hot）
  _recommendPage: async function (page) {
    var res = await this._categorySsrList('/recommend', page || 1);
    return this._toItems(res.list || []);
  },
  // 最近上新行（官网 /newest SSR；新剧来源；v1.0.5 新增）
  _newestPage: async function (page) {
    var res = await this._categorySsrList('/newest', page || 1);
    return this._toItems(res.list || []);
  },
  // 黄果原创行（官网 /original/ SSR；v1.0.5 新增）
  _originalPage: async function (page) {
    var res = await this._categorySsrList('/original/', page || 1);
    return this._toItems(res.list || []);
  },
  // 题材行（官网 /tag/{slug}/ SSR；v1.0.5 新增）
  _tagPage: async function (slug, page) {
    var res = await this._categoryTag(slug, page || 1);
    return this._toItems(res.list || []);
  },
  // 排行榜行（hot/recommend/potential；单页）
  _rankPage: async function (rankType, page) {
    var res = await this._categoryRanks(rankType || 'hot', page || 1);
    return this._toItems(res.list || []);
  },
  // 专题行（默认第一个专题；单页）
  _topicPage: async function (page) {
    var res = await this._categoryTopics('', page || 1);
    return this._toItems(res.list || []);
  },
  // 吃瓜行
  _chiguaPage: async function (page, cate) {
    var res = await this._categoryChigua(cate || 'all', page || 1);
    return this._toItems(res.list || []);
  },
  // 首页推荐行
  _featuredPage: async function () {
    var res = await this.homeVideo();
    return this._toItems(res.list || []);
  },
};

/* ================= TVBox 引擎取 spider 的第三条路 ================= */
// 不写 export（模块页不报 SyntaxError）；引擎 fallback 取
// globalThis.__JS_SPIDER__。
globalThis.__JS_SPIDER__ = spider;

/* ================= Rex 模块元数据 ================= */
// 模块入口走这里。行数、标题、参数与 upload.py 的 7 个分类一致，
// 再加精选推荐与播放入口。v1.0.1 删掉了封面中转设置入口行
// （Arcane 的模块行不渲染文本输入框，那个入口点进去是“暂无内容”）。
var WidgetMetadata = {
  name: '黄果短剧',
  version: '1.0.8',
  id: 'huangguo.duanju.upload',
  author: 'Muse',
  description: '黄果短剧（upload.py 转换版）：热门推荐/最近上新/黄果原创、AI短剧/漫剧/换脸/魔改、20 个官网题材、专题合集、排行榜、黄果吃瓜；域名自动发现，直链播放',
  modules: [
    { id: 'hot', title: '🔥热门推荐', functionName: 'listHot', params: [{ name: 'page', type: 'number', value: 1 }] },
    { id: 'newest', title: '🆕最近上新', functionName: 'listNewest', params: [{ name: 'page', type: 'number', value: 1 }] },
    { id: 'original', title: '✨黄果原创', functionName: 'listOriginal', params: [{ name: 'page', type: 'number', value: 1 }] },
    { id: 'ai-duanju', title: '🎬 AI成人短剧', functionName: 'listDuanju', params: [{ name: 'page', type: 'number', value: 1 }, { name: 'sort', type: 'text', value: 'latest' }] },
    { id: 'ai-manju', title: '🎬 AI成人漫剧', functionName: 'listManju', params: [{ name: 'page', type: 'number', value: 1 }, { name: 'sort', type: 'text', value: 'latest' }] },
    { id: 'ai-huanlian', title: '🎬 AI换脸', functionName: 'listHuanlian', params: [{ name: 'page', type: 'number', value: 1 }, { name: 'sort', type: 'text', value: 'latest' }] },
    { id: 'ai-mogai', title: '🎬 AI魔改', functionName: 'listMogai', params: [{ name: 'page', type: 'number', value: 1 }, { name: 'sort', type: 'text', value: 'latest' }] },
    { id: 'topics', title: '📚专题合集', functionName: 'listTopics', params: [{ name: 'page', type: 'number', value: 1 }] },
    { id: 'ranks', title: '📊排行榜', functionName: 'listRanks', params: [{ name: 'rank_type', type: 'text', value: 'hot' }, { name: 'page', type: 'number', value: 1 }] },
    { id: 'chigua', title: '🍉黄果吃瓜', functionName: 'listChigua', params: [{ name: 'page', type: 'number', value: 1 }, { name: 'cate', type: 'text', value: 'all' }] },
    { id: 'playResource', title: '播放', functionName: 'loadResource', type: 'stream', params: [] },
  ],
  search: { id: '__rexSearch', title: '搜索', functionName: 'searchVideos', params: [{ name: 'query', type: 'text' }] },
  detail: { id: '__rexDetail', title: '详情', functionName: 'loadDetail', params: [] },
};
// v1.0.5：官网题材分类（20 个）各是一行，走 /tag/{slug}/ SSR。
// 静态字面量里没法循环，用 HOME_TAGS 插到 topics 之前（脚本加载时同步
// 执行，App 读 WidgetMetadata.modules 时已经齐了）。行参数只进该行
// 自己的函数，所以 tag 用 entry.params 的默认值传进 listTag。
(function () {
  var at = 0;
  WidgetMetadata.modules.forEach(function (m, i) { if (m.id === 'topics') at = i; });
  HOME_TAGS.forEach(function (t, k) {
    WidgetMetadata.modules.splice(at + k, 0, {
      id: 'tag-' + t.slug, title: t.name, functionName: 'listTag',
      params: [{ name: 'tag', type: 'text', value: t.slug }, { name: 'page', type: 'number', value: 1 }],
    });
  });
})();

/* ================= Rex 全局函数 ================= */
// 桥接 __rexInvoke 把 WidgetMetadata.globalParams 与 entry.params 合并后
// 用 Object.assign(params, supplied) 覆盖——行参数只进该行自己的函数。

function _rexPageOf(params) {
  return _num((params && params.page !== undefined) ? params.page : 1, 1);
}
function _rexSortOf(params) {
  return (params && params.sort) ? String(params.sort) : 'latest';
}
// 行参数只进该行自己的函数；存过的配置（域名/token/中转）是全模块共用的——
// 读一次存储再应用。v1.0.1 删掉了「封面中转链接」入口行：Arcane 的模块行
// 点进去只会跑函数并显示结果，根本不渲染文本输入框（点进去是“暂无内容”），
// 那个入口填不了东西；中转地址本来就是默认写死的，不用填。
async function _applyRexParams(params) {
  try {
    await spider.init();
  } catch (e) { /* ignore */ }
  try {
    var stored = spider._localGet('config');
    if (stored) spider._applyConfig(stored);
  } catch (e) { /* ignore */ }
  if (params && params.coverRelay !== undefined) {
    spider._applyConfig({ coverRelay: params.coverRelay });
  }
  return params;
}
async function listHot(params) {
  await _applyRexParams(params);
  return spider._recommendPage(_rexPageOf(params));
}
async function listNewest(params) {
  await _applyRexParams(params);
  return spider._newestPage(_rexPageOf(params));
}
async function listOriginal(params) {
  await _applyRexParams(params);
  return spider._originalPage(_rexPageOf(params));
}
async function listTag(params) {
  await _applyRexParams(params);
  var tag = (params && (params.tag || params.slug)) ? String(params.tag || params.slug) : '';
  if (!tag) return [];
  return spider._tagPage(tag, _rexPageOf(params));
}
async function listDuanju(params) {
  await _applyRexParams(params);
  return spider._videoPage('ai-duanju', _rexPageOf(params), _rexSortOf(params));
}
async function listManju(params) {
  await _applyRexParams(params);
  return spider._videoPage('ai-manju', _rexPageOf(params), _rexSortOf(params));
}
async function listHuanlian(params) {
  await _applyRexParams(params);
  return spider._videoPage('ai-huanlian', _rexPageOf(params), _rexSortOf(params));
}
async function listMogai(params) {
  await _applyRexParams(params);
  return spider._videoPage('ai-mogai', _rexPageOf(params), _rexSortOf(params));
}
async function listTopics(params) {
  await _applyRexParams(params);
  return spider._topicPage(_rexPageOf(params));
}
async function listRanks(params) {
  await _applyRexParams(params);
  return spider._rankPage((params && params.rank_type) ? String(params.rank_type) : 'hot', _rexPageOf(params));
}
async function listChigua(params) {
  await _applyRexParams(params);
  return spider._chiguaPage(_rexPageOf(params), (params && params.cate) ? String(params.cate) : 'all');
}
async function searchVideos(params) {
  await _applyRexParams(params);
  var q = '';
  if (params) q = params.query || params.keyword || params.q || params.text || '';
  if (!q) return [];
  var res = await spider.search(q, false, _num(params.page, 1));
  return spider._toItems(res.list || []);
}
async function loadDetail(link) {
  var id = '';
  if (typeof link === 'string') id = link;
  else if (link && typeof link === 'object') id = link.link || link.id || link.vod_id || '';
  if (!id) return null;
  id = String(id);
  if (id.indexOf('huangguo:') === 0) id = id.slice('huangguo:'.length);
  await spider.init();
  var det;
  if (id.indexOf('archives_') === 0) {
    det = await spider._detailArchives(id.replace('archives_', ''));
  } else {
    det = await spider._detailVideo(id);
  }
  var item = (det && det.list && det.list[0]) || null;
  if (!item) return null;
  // 选集：从 vod_play_url（"第N集$hgdj|vid|n#…" 或 "视频$hgdjpost|pid|i#…"，$$$ 分组）
  var episodes = [];
  var playUrl = item.vod_play_url || '';
  var playFrom = item.vod_play_from || '';
  var groups = playUrl.split('$$$');
  var froms = playFrom.split('$$$');
  // v1.0.7：集号计数（Forward 的 episodeItems 要 seasonNumber /
  // episodeNumber；hgdj|vid|n 与 hgdjpost|pid|i 的第 3 段就是集号，
  // 解析不到时用自增序号兜底）。
  var epIndex = 0;
  groups.forEach(function (g, gi) {
    var parts = g.split('#').filter(function (s) { return !!s; });
    parts.forEach(function (seg) {
      var idx = seg.indexOf('$');
      var name = idx >= 0 ? seg.slice(0, idx) : seg;
      var pid = idx >= 0 ? seg.slice(idx + 1) : seg;
      // v1.0.4：App 认的选集字段是 title + id（v4.0.0 的 loadDetail
      // 就是 { title, id }，loadResource 接 link/id/url）。只给
      // name/url/source 时 App 报“模块未返回可播放集数”。六个字段
      // 同时给，id/url/link 都是集标记（hgdj|vid|n 或 hgdjpost|pid|i）。
      // v1.0.7（upload.js / Forward 的写法）：每集再补 type: 'url' +
      // mediaType: 'tv' + seasonNumber/episodeNumber + playerType:
      // 'app'，让 App 认得出这是可播的剧集。
      epIndex++;
      var epNum = 0;
      var pp = String(pid).split('|');
      if (pp.length >= 3) epNum = parseInt(pp[2], 10) || 0;
      if (!epNum) epNum = epIndex;
      episodes.push({
        title: name,
        id: pid,
        name: name,
        url: pid,
        link: pid,
        source: froms[gi] || froms[0] || '黄果短剧',
        type: 'url',
        mediaType: 'tv',
        seasonNumber: 1,
        episodeNumber: epNum,
        playerType: 'app',
        videoUrl: '',
      });
    });
  });
  // v1.0.7：Rex 里中转地址的图显示不出来（chunked、无 Content-Length），
  // 改成标题海报保证有图；明文图直链与站源本地代理的真图保留。
  // v1.0.8：中转是 Cloudflare Worker（带 Content-Length）时不换海报。
  var dpic = item.vod_pic || '';
  if (dpic && (typeof getProxyUrl !== 'function') && _isRelayUrl(dpic, spider._coverRelay) && !_isWorkerRelay(spider._coverRelay)) {
    dpic = _titlePoster(item.vod_name || '');
  }
  return {
    id: 'huangguo:' + (item.vod_id || id),
    type: 'url',
    title: item.vod_name || '',
    cover: dpic,
    coverUrl: dpic,
    posterPath: dpic,
    backdropPath: dpic,
    desc: item.vod_content || '',
    remark: item.vod_remarks || '',
    mediaType: 'tv',
    // v1.0.7：选集三个键同时给（episodes、episodeList、episodeItems），
    // 不管 App 读哪个键都有（rex-diag 只给了前两个；Forward 与
    // rexhome 用 episodeItems；二进制里 episodes 与 episodeList 都有）。
    episodes: episodes,
    episodeList: episodes,
    episodeItems: episodes,
  };
}
async function loadResource(link) {
  var id = '';
  if (typeof link === 'string') id = link;
  else if (link && typeof link === 'object') id = link.link || link.id || link.url || '';
  if (!id) return null;
  id = String(id);
  if (id.indexOf('huangguo:') === 0) id = id.slice('huangguo:'.length);
  await spider.init();
  var res = await spider.playerContent('', id);
  if (!res || !res.url) return null;
  // v1.0.7（upload.js / Forward 的资源形状）：原有的 url/parse/header/
  // format 保留，再补 playerType: 'app' + customHeaders + name/
  // description，让 App 不管按哪种约定读都有——播放仍用已验证的
  // POST playback 接口（upload.js 的旧 GET play 接口返回空，不要）。
  var desc = '黄果';
  var _pp = String(id).split('|');
  var _n = _pp.length >= 3 ? parseInt(_pp[2], 10) : 0;
  if (_pp[0] === 'hgdjpost') desc = '视频' + (_n + 1);
  else if (_n) desc = '第' + _n + '集';
  else if (/^\d+$/.test(id)) desc = '第1集';
  return {
    url: res.url,
    parse: res.parse || 0,
    header: res.header || {},
    format: 'hls',
    playerType: 'app',
    customHeaders: res.header || {},
    name: '黄果',
    description: desc,
  };
}
