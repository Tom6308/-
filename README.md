# 黄果短剧 · Arcane JS 模块 v4.0.0

> 给 Arcane（CatPaw，`com.catpaw.appleplayer.ios` 1.0.13）用的黄果短剧全量片源，
> AI.py（HiPY Python 源，原作者“无聊”）改写成的 JS 模块，一个文件两种入口
> 都能进（站源 + Rex 模块）。整合了之前全部资料，并按 2026-11-14
> 当天 20:00–23:15 的实测数据重写。

**v3.2.0 的变化（2026-11-14 晚）**：播放改走站点的新接口
`POST /api/videos/{id}/episodes/{ep}/playback`（upload.py v2 实测发现），
匿名可取真实签名 m3u8 直链，点开即播，不再回落网页解析；另加首播嗅探验流
与封面存在性检查，测试 67/67 通过。

**v3.2.1 的变化（2026-11-14 晚）**：封面加载慢的针对修复——单张封面
超时从 15 秒收紧到直取 6 秒 / 中转 8 秒，失败快速让路给下一条路；
`ext` 新增 `{"coverRelayFirst": true}`，可让加密封面跳过本地直取、
直接走 Netlify 中转。测试 71/71 通过。

**v3.2.2 的变化（2026-11-14 晚）**：封面全空的针对修复——手机上
标题能加载但封面全空：本地图片代理链路（`127.0.0.1 /proxy` 会话 +
直连 `pic.drleao.cn`）在手机网络上不出图，而 Netlify 中转实测正常
返回 JPEG；故 `coverRelayFirst` 默认改为 `true`，加密封面默认直接
走中转，不再经过本地代理；`ext` 填 `{"coverRelayFirst": false}` 可
恢复本地代理优先。另修正导入说明：正确入口是「添加 Python 链接」，
不是「添加订阅」（后者只认 Node 包或 JSON 订阅）。测试 73/73 通过
（含 2 项新默认行为检查；另有 2 项分类总量检查因站内上新由精确值
改为下限断言）。

**v3.3.0 的变化（2026-11-14 晚）**：站源版与模块版合并成一个文件
`huangguo.js`。TVBox 引擎取 spider 有三条路（`worker.js`：
`export default` → `__jsEvalReturn` → `sandbox.__JS_SPIDER__`），
本文件用第三条：不写任何 `export`，结尾
`globalThis.__JS_SPIDER__ = spider`；Rex 模块中心只认不带 `export`
的普通脚本，正好也满足。于是同一个文件既是 TVBox 站源（分类/标签
浏览、详情、播放、图片代理），也是 Rex 模块（首页 9 行推荐架、搜索、
详情、播放）；两边共用同一套域名发现、接口、封面中转与播放解析，只在
HTTP 层按运行时分流（TVBox 用 `req`，Rex 用 `Widget.http`）。装一个
入口就行，不用再分两个文件。测试 78/78 通过（含 5 项统一版新检查：
无 `export`、经 `__JS_SPIDER__` 取 spider、共用核心、Rex 版本 3.3.0、
Rex 加载时 `__JS_SPIDER__` 无害）。

**v3.3.1 的变化（2026-11-14 晚）**：封面中转入口。Brooks 提出想在模块
设置里直接粘贴中转链接——已实现，不用再写 JSON：站源配置 `ext` 里
直接粘贴中转链接就行（路径里含 `/cover` 的按中转地址，裸域名按站源
地址；`?u=` 参数会自动剥掉，只留基础地址）；Rex 每行推荐架的设置里
多了「封面中转链接」输入框，填在任意一行即可，全模块通用。不填就用
默认的 rococo 中转（`https://rococo-entremet-86855d.netlify.app/.netlify/functions/cover`）。
测试 84/84 通过（含 6 项 v3.3.1 新检查：裸中转链接识别、剥离 `?u=`、
裸域名仍当站源、各行有封面中转参数、行参数覆盖中转地址）。

**v3.3.2 的变化（2026-11-14 晚）**：设置页入口重写。Brooks 要入口放在
模块设置页上（不是每行参数里）——重写为功能设置里单独一行「封面中转
链接」，排在最前面。点进去粘贴中转链接保存后，值写进模块存储
（`Widget.storage` 的 `huangguo_config`，与已存的域名/token 合并保存），
所有行每次加载都会先读一次存储，所以一处改、全模块生效；不填就用默认
的 rococo 中转。原先每行参数里的封面中转框已去掉。入口行本身返回空
列表（首页如显示为空行可忽略）。测试 87/87 通过（含 5 项 v3.3.2 新
检查：设置入口排最前且参数带默认值、其他行不再有中转参数、入口返回
空列表、存入的值被其他行读到并应用）。

**v3.3.3 的变化（2026-11-14 晚）**：纯站源版。Brooks 只要 Arcane 站源，
不要 Rex 模块——从统一版 v3.3.2 剥离 Rex 部分而成：去掉 WidgetMetadata
与全部 Rex 全局函数、Rex 助手与 Widget 分支，恢复标准 `export default
spider`。只在站源页用（「添加 Python 链接」），不要导进模块中心（那里
只认不带 `export` 的普通脚本，会报 SyntaxError）。站源配置 ext 里可
直接粘贴中转链接（路径里含 `/cover` 的按中转地址，裸域名按站源地址，
不用写 JSON；贴基础地址，不带 `?u=` 参数）。不填就用默认的 rococo 中转。
纯站源测试 62/62 通过（`node --experimental-vm-modules test_source.mjs`，
含 3 项纯站源新检查：有 export default、无 __JS_SPIDER__/WidgetMetadata、
无 Rex 助手）。

**v4.0.0 的变化（2026-11-14 晚）**：全部推翻重写。Brooks 把 AI.py 原版发回
来，要求改成 JS 模块在 Arcane 上用——从零重写成 `huangguo.js` v4.0.0：
单个无 `export` 文件，两种入口都能进（站源走 `globalThis.__JS_SPIDER__`，
模块页走 `WidgetMetadata`），装一个入口就行，不用再分站源版/模块版。
AI.py 原版的问题都已修正：播放改走新 POST playback 接口（旧 play 接口
恒为空）、域名自动发现（原版只写死 huangguoai.com）、分类从 11 个扩到
31 个（原版非热门分类都走搜索接口）、封面默认走 Netlify 中转。
测试 87/87 通过（`node --experimental-vm-modules test_v4.mjs`，两种加载
都验：站源经 `__JS_SPIDER__`、模块经经典脚本）。

**v1.0.0 的变化（2026-11-14 晚，upload.py 转换版）**：Brooks 把 upload.py
（TVBox / 影视仓 Python 源，原作者“无聊”，v2 2026-11-08）发回来要求
“转换js”——完整转写成 `huangguo-upload.js` v1.0.0，同样是单个无 `export`
文件、两种入口都能进。upload.py 的结构原样保留：首页 8 个分类（精选推荐
+ 4 个基础分类 AI成人短剧/漫剧/换脸/魔改 + 专题合集 + 排行榜 + 黄果吃瓜）
带筛选；列表基础分类走 `/api/videos/category/{id}`（latest/hot/random），
排行榜/专题/标签走 SSR 网页解析，**吃瓜是新增的完整功能**（列表、详情、
播放全套：正文图与视频分两组，视频直链）；详情短剧走 `/api/videos/{id}`
（集标记 `hgdj|{vid}|{n}`），吃瓜走 `/archives/{id}/` + POST
`/api/posts/{id}/playback`（视频标记 `hgdjpost|{pid}|{i}`）；播放 Range
嗅探后相对路径 m3u8 走代理重写；封面 AES 解密 + 图源候选链 + 缺图占位图。
另保留 v4.0.0 的域名自动发现、封面默认 Netlify 中转、main→hevc→preview、
5 分钟播放缓存。
测试 104/104 通过（`node --experimental-vm-modules test_upload.mjs`，
两种加载都验，含吃瓜与播放）。

转写中发现并修掉的站方变化（2026-11-14 晚实测）：
- `/api/videos/category/ai-huanlian` 与 `ai-mogai` 已下线（返回
  `{"data":[],"status":0,"msg":"内容已下线"}`），空结果时改走搜索兜底
  （AI换脸 38、AI魔改 33），分类不空白；
- 吃瓜从 `/chigua/` 迁到 `/blog/`（全部 `/blog/`、热门 `/blog/gossip/`、
  原创 `/blog/reviews/`；翻页分别是 `/blog/page/N/`、`/blog/gossip/N/`、
  `/blog/reviews/N/`），卡片从 `<a class="hg-post-card">` 换成
  `<a class="hg-cate-feed__card"`（标题 `data-track-item-name`，日期
  `hg-cate-feed__date`），每页 12 条；
- `_getTopics` 原版 `[a-z0-9-]` 会漏混合大小写 slug（`AImori-chongsheng`、
  `xiangcun-AIchengren`）与全角破折号 slug（`xiaoyuan—qingcun`），改
  `[^"/]+` 后 11 个专题全抓到；
- `_parseDramaCards` 的 `_gridSlice` 裸搜 `hg-card-grid` 会先命中 `<style>`
  里的 CSS，改搜 `<div class="hg-card-grid` 才找到真实容器；
- JS 的 `.` 不匹配换行，专题正则的 `.*?` 改 `[\s\S]*?`。

**v1.0.1 的变化（2026-11-14 晚）**：模块里封面全空的修复。Brooks 截图：
模块首页标题都正常，只有封面全是占位符。根因是 `_wrapPic` 在 Rex 里
可能返回 `proxy://do=py…`——Rex 没有本地图片代理，这个地址在模块里
打不开；且存过的中转地址若是裸站根（`…netlify.app`，没有 `/cover`
路径）会直接覆盖默认值、拼出 404 的封面地址。三处修复：① `_wrapPic`
在 Rex 里加密图床一律走中转，且永不返回 `proxy://`（非加密图直接返回
原地址，App 能直取）；② 中转地址归一化——裸 Netlify 站根自动补全
`/.netlify/functions/cover`，无效值不再覆盖默认值，中转被清空时
`_relayCover` 回落到默认中转；③ 删掉模块设置里的「封面中转链接」
入口行：Arcane 的模块行点进去只会跑函数并显示结果，根本不渲染文本
输入框（Brooks 点进去是“暂无内容”），那个入口填不了东西；中转地址
本来就是默认写死的，不用填。另验证：中转函数只解加密图，对明文图
返回 502，所以非加密图床不走中转（直接返回原地址）。测试 110/110
通过（`node --experimental-vm-modules test_upload.mjs`，含 6 项 v1.0.1
新检查：封面是中转地址、永不 `proxy://`、裸站根自愈、无效值回落默认、
入口行已删）。

**v1.0.2 的变化（2026-11-14 晚）**：封面还是没有的修复。v1.0.1 装上后
标题正常、封面仍全是占位符——查官方 Rex 模块（`rex-tmdb.js`、
`bangumi.js`）才发现：App 读的封面字段是 `posterPath` / `backdropPath`，
根本不认 `cover` 字段；v1.0.0/1.0.1 的 `_toItem` / `loadDetail` 只给了
`cover`，所以 App 拿不到图。本版列表与详情同时给 `posterPath`、
`backdropPath` 和 `cover` 三个字段（值都是中转后的封面地址，与 v4.0.0
的写法一致）。v4.0.0 和 rexhome 本来就是这么写的，只有 upload 转换版
漏了这两个字段。测试 114/114 通过（含 4 项 v1.0.2 新检查：
列表/详情的 `posterPath`/`backdropPath` 是中转地址、永不 `proxy://`）。

**v1.0.3 的变化（2026-11-14 晚）**：点条目报“模块未提供详情链接”的
修复。点模块首页的条目时，App 是拿条目的 `link` 字段当 `params.link`
传给 `loadDetail`；v1.0.2 的 `_toItem` 只给了 `id`、`title`、`cover`、
`posterPath`、`backdropPath`，没有 `link`（也没有 `type`），App 找不到
详情链接就直接报这个错。本版 `_toItem` 补上 `type: 'huangguo'` 与
`link: 'huangguo:' + vod_id`（与 v4.0.0 的 `_toItem` 写法一致，rexhome
的条目也都带 `link`）。测试 118/118 通过（含 4 项 v1.0.3 新检查：
条目带 `type`/`link`，且拿条目的 `link` 调 `loadDetail` 能拿到详情
和集数——模拟 App 点条目的完整链路）。

**v1.0.5 的变化（2026-11-15，分类与官网一致 + 新剧来源）**：Brooks
说“新剧的片源也要有，分类也要跟黄果短剧官网上一样”。按官网（2026-11-15
实测）补了三个 SSR 分类与 20 个题材分类：① **最近上新** `/newest`
（新剧来源，SSR，62 页，每页 28 条，最新一条是 13727 纯情校花堕落记）；
② **热门推荐** `/recommend`（官网的推荐榜，SSR，3 页，每页 28 条；
推荐行改走这个，不再用 ai-duanju hot 接口）；③ **黄果原创**
`/original/`（官网原创区，SSR，6 页，每页 39 条）；④ 官网首页导航的
20 个题材：都市/古风/奇幻/现代/职场/逆袭/校园/绿帽/熟女/母子/乱伦/
系统/仙侠/后宫/大男主/性转/脑洞/悬疑/NTR/武侠，走 `/tag/{slug}/` SSR。
三者翻页都是 `/{base}/{N}/`（不是 `/page/N/`）；首页 URL 的斜杠有讲究：
`/newest` 与 `/recommend` 不能带尾斜杠（带了只返回 42 字节），
`/original/` 必须带尾斜杠（不带只返回 45 字节）。站源分类从 8 个变成
30 个（推荐/上新/原创/4 个基础/20 个题材/专题/排行/吃瓜），Rex 从
9 行变成 31 行。测试 150/150 通过（含 28 项 v1.0.5 新检查）。

**v1.0.6 的变化（2026-11-15，站源封面全空 + 三个分类页为空）**：Brooks
录屏证实站源已装上、首页 30 个分类全有内容（标题+评分都显示），但
封面整屏全空，点进 AI换脸/熟女/乱伦三个分类页是空的（筛选栏能加载，
列表空白）。三处修复：① **封面改走本地代理优先**——站源里加密封面
不再默认走 Netlify 中转（中转响应是 chunked、无 Content-Length，手机
图片加载器整屏读不出来），改走 TVBox 原生本地代理（`vod_pic` =
`http://127.0.0.1:端口/proxy?source=…&type=img&url=…`，经 spider.proxy()
解密后原图字节直供图片加载器）；Rex 里没有本地代理，仍走中转。修时
顺带补了一个真 bug：`_coverRelayFirst` 关掉后 proxy() 循环里那次中转
也不跑了，直取全失败就直接回占位图——已在循环后补了一次中转兜底；
② **AI换脸/AI魔改改走搜索优先**（category 接口已下线，不再先调一次
注定为空的接口，一次请求出结果）；③ **category() 筛选值 filter
（第 3 参数）和 extend（第 4 参数）两个都读**，不管 Arcane 把筛选值放
哪个参数里都不会读不到。测试 162/162 通过（含 11 项 v1.0.6 新检查：
本地代理封面全链路、filter 双参数、三个分类页回归）。已推到同一
GitHub 仓库（commit 07670682，jsDelivr purge 后已是 v1.0.6，200、
97,733 字节、md5 `0dbced1c…` 与本地逐字节一致）。

**v1.0.7 的变化（2026-11-15，模块里封面仍全空 + 点条目仍无选集）**：
Brooks 又录屏：v1.0.6 装在**模块**里（不是站源），封面还是全空，
点条目还是“模块未返回可播放集数”；点 枪欲玫瑰 时 App 把它匹配成了
Guns N' Roses 乐队（2018 音乐电影）——**模块详情页是 TMDB 驱动的**，
App 拿标题去 TMDB 模糊匹配，黄果的标题不在 TMDB 上所以匹配不到，
选集也就出不来。随后 Brooks 发来 upload.js（Forward 播放器的黄果
模块，作者 rex，v1.4.3）参考，四处借鉴：① 条目与选集用
`type: 'url'` + `mediaType: 'tv'`（Forward/官方模块的通用写法；
之前 `type: 'huangguo'` 是自造类型，App 认不出可播剧集才退回 TMDB
匹配）；② 选集同时给 `episodes`、`episodeList`、`episodeItems`
三个键（不管 App 读哪个键都有），每集再补 `seasonNumber`/
`episodeNumber`/`playerType: 'app'`；③ Rex 里封面改用标题海报
（placehold.co，实测 200、带 Content-Length、480x720 真 PNG，中文
标题正常渲染），保证列表有图——站源里本地代理能出真图，不受影响；
④ loadResource 再补 `playerType: 'app'` + `customHeaders` +
`name`/`description`。upload.js 的旧 GET play 接口（返回空
video_url）与它的封面代理 ai.wulii.de5.net（实测连不上，Empty
reply）都不要；播放仍用已验证的 POST playback 接口。测试 169/169
通过（含 7 项 v1.0.7 新检查）。已推到同一 GitHub 仓库（commit
a06c52c9，jsDelivr purge 后已是 v1.0.7，200、103,565 字节、md5
`93c570e7…` 与本地逐字节一致）。

**v1.0.8 的变化（2026-11-15，模块封面的真正解法：Cloudflare Worker）**：
Brooks 又发来 huangguo-fixed.js（合并版 v1.1.3）与
huangguo-cover-worker.js（Cloudflare Worker 封面解密中转，纯 JS
AES-CBC，密钥与 AI.py 一致）。Worker 已逐字节验证：拿 id=12 的真实
加密封面实测，Worker 的 `_aesCbcDecrypt` 输出与 Node crypto **逐字
节一致**；本地 workerd 实测 `/?u=<加密图>` 返回 200、image/jpeg、
**Content-Length: 174816**（不 chunked）——这正是手机图片加载器要
的，Netlify 中转 chunked、无 Content-Length 才是 v1.0.0–v1.0.6 模块
里封面全空的根因。改动：① `_normalizeRelayUrl` 认 Cloudflare
Worker 地址（`*.workers.dev`，根路径 `/?u=` 直接可用）与 localhost
（测试用）；② 新增 `_isWorkerRelay(relay)`：中转是 Worker 时 Rex
里封面用中转真图，不再换标题海报；中转是 Netlify 时仍换标题海报
（v1.0.7 的兜底）；③ **默认中转 COVER_RELAY 改成 Brooks 已部署的
Cloudflare Worker `https://huangguo-cover.tang72276.workers.dev`**
（2026-11-09 部署，2026-11-15 实测 `/health` 返回
`{"ok":true,"source":"huangguo-cover"}`、真封面 200 +
Content-Length 174816 + image/jpeg；另有同名 Pages 项目
`huangguo-cover.pages.dev` 与 `huangguo-cover2.pages.dev`，是 6 天
前另两次部署，与 Worker 不是同一个东西，别用 Pages 的地址当中
转）。部署过程小插曲：云端浏览器登 Cloudflare 被 Google 验证卡住
（不认的设备要手机点 47），且该 Google 账号一度被 Cloudflare 弹回
“Unable to sign in”；Brooks 自己在手机上登进 dash.cloudflare.com
后截图证实 Worker 早已在账号里（`huangguo-cover.tang72276.workers.dev`，
6 天前），直接实测通过，不用重新部署。测试 180/180 通过（含 11 项
v1.0.8 新检查：Worker 地址识别、默认中转是 Worker、Rex 封面是
Worker 中转真图、线上 Worker 实时解密 200 + Content-Length + JPEG；
另有 1 次 probe_tap 里 Worker 对 枪欲玫瑰 封面返回 503，重试即
200，是一过性上游波动）。已推到同一 GitHub 仓库（commit f71ee95f，
jsDelivr purge 后已是 v1.0.8，200、106,856 字节、md5 `bb652142…` 与
本地逐字节一致）。

> 直链（GitHub，永久，2026-11-15 01:15 已验证：200、106,856 字节、与本地
> v1.0.8 逐字节一致）：主用 jsDelivr
> `https://cdn.jsdelivr.net/gh/Tom6308/-@main/huangguo-upload.js`
> （Content-Type: application/javascript），备用 GitHub raw
> `https://raw.githubusercontent.com/Tom6308/-/main/huangguo-upload.js`。
> 文件存在 Brooks 的 GitHub 账号 Tom6308 的公开仓库 `-`（main 分支），
> 更新时直接覆盖同名文件即可，链接不变。Netlify 本周期免费额度已用完
> （2026-11-15 00:02 确认，到 12月8日恢复），不再用 Netlify 部署新版；
> v1.0.3 的旧链 `https://gorgeous-beijinho-70a410.netlify.app/huangguo-upload.js`
> 仍在线但内容是 v1.0.3，别用它装新版。
>
> v4.0.0（AI.py 改写版）的直链仍是
> `https://aquamarine-melba-809656.netlify.app/huangguo.js`。两个文件都能
> 独立用，装一个就行；upload.py 版多了吃瓜，v4.0.0 版分类更多（31 个）。

## 文件结构

```text
huangguo_arcane/
├── huangguo-upload.js   # JS 模块 v1.0.8（upload.py 转换，站源 + Rex 二合一，无 export）
│                         # 站源入口加载它：首页/分类/详情/搜索/播放/图片代理；
│                         # 模块入口加载它：首页推荐架 + 搜索 + 详情 + 播放源
├── huangguo.js           # JS 模块 v4.0.0（AI.py 改写，站源 + Rex 二合一，无 export）
│                         # 站源入口加载它：首页/分类/详情/搜索/播放/图片代理；
│                         # 模块入口加载它：首页推荐架 + 搜索 + 详情 + 播放源
├── huangguo-arcane.js   # 纯站源版 v3.3.3（ESM，export default），仅作参照
├── rex-huangguo.js      # 旧版：Rex 模块 v3.2.0（WidgetMetadata），仅作参照
├── manifest.json        # Rex 模块清单（与 Arcane 内置 rex-official/manifest.json 同格式）
├── test_upload.mjs      # 测试桩：用 Node 模拟 Arcane 两种运行时，对 v1.0.0 做全量 live 测试
├── test_v4.mjs          # 测试桩：用 Node 模拟 Arcane 两种运行时，对 v4.0.0 做全量 live 测试
├── test_arcane.mjs      # 测试桩：v3.3.2 统一版的两种运行时测试（参照）
├── test_source.mjs      # 测试桩：v3.3.3 纯站源版的测试（参照）
└── README.md            # 本说明
```

主文件有两个（都能独立用，装一个就行）：`huangguo-upload.js` v1.0.8
（upload.py 转换版，多了吃瓜）和 `huangguo.js` v4.0.0（AI.py 改写版，
分类更多，31 个）。一个文件两个入口，行为一致；**装一个入口就行**。
旧的纯站源版（`huangguo-arcane.js` v3.3.3）保留在目录里仅作参照，
不用再装。

> ⚠️ 今晚实踩的教训（2026-11-14）：带 `export` 的 TVBox 源文件
> （纯站源版 `huangguo-arcane.js`）导进「设置 → 模块」会报
> `SyntaxError: Unexpected keyword 'export'`，因为模块中心只认不带
> `export` 的普通脚本。v4.0.0 `huangguo.js` 没有任何 `export`，
> 两个入口都能进，不会再报这个错。

## 为什么旧版在 Arcane 上不能直接用

Arcane 的 `assets/tvbox_js/worker.js` 是这样加载 JS 源的（IPA 静态分析）：

- 模块以 `vm.SourceTextModule` 加载，取 `export default`（或 `__jsEvalReturn`，
  或 `sandbox.__JS_SPIDER__`——纯站源版用第一条 `export default`，
  统一版用的第三条），方法按名调用，单次调用 30 秒超时；
- 沙箱只提供 `req / http / getProxyUrl / local / aesX / Buffer` 等全局变量，
  **没有 TVBox 经典的 `request()`**；而且 `req()` 返回的是
  `{ code, content, headers, url }` 对象，不是纯文本。

旧版 `huangguo_ai.js` 写的是 `JSON.parse(request(url))`，在 Arcane 里会把
`"[object Object]"` 当 JSON 解析，全部请求静默失败返回空列表。本版的
`_raw()` 适配层同时兼容三种形态：Arcane 对象、经典纯文本、`fetch`，
这是在 Arcane 上能用的根本前提。

Rex 模块的契约同样来自 IPA 二进制内嵌的桥接代码（`__rexInvoke`）：
沙箱预置 `Widget.http.get`（返回 `{ data }`）、`Widget.storage`，
`__rexSearch` 走 `WidgetMetadata.search`，`__rexDetail` 调全局
`loadDetail(params.link)`，`__rexResource` 找 `type === 'stream'` 或
`functionName === 'loadResource'` 的入口。本版严格按这个契约实现。

## 片源有多全（2026-11-14 实测）

### 域名：自动发现，死的自动跳过

| 域名 | 实测 | 状态 |
|---|---|---|
| `https://d1716d.bmikbxhi.cc` | `/api/videos` 1717 条 | 最新地址，大陆可访问（默认首选） |
| `https://huangguoai.io` | 1717 条 | 与最新地址同库 |
| `https://huangguoai.com` | 1714 条 | 永久域名（需梯子） |
| `https://huangguoai.ai` | API 404 | 永久中转，探测跳过 |
| `https://hgai15.com` | API 404 | 最新中转，探测跳过 |
| `https://huangguo.video` | 403 | Cloudflare 拦截，探测跳过 |
| `https://hongguoduanju.com` | API 404 | 探测跳过 |
| `https://hgai12.com` | API 404 | 探测跳过 |

模块启动时先读官方地址发布接口 `/api/site/address-poster`
（发布页 `https://huangguoai.pages.dev`，当天公布的最新地址就是
`d1716d.bmikbxhi.cc`、最新中转 `hgai15.com`），再读发布页脚本，
把所有新地址逐个探测 `/api/videos`，只用真正能返回数据的域名；
当前域名一旦失败，自动轮换到下一个。官方换域名后不用等发版。

i短剧里那个 Firebase 远程配置
（`reserve-5a846.firebaseio.com/ipconfigv3.json`）返回的是加密串，
没有密钥解不开；本模块用等效的明文地址发布接口实现同样的动态发现。

### 分类：31 个（原来 11 个全保留）

- **原始 11 个**（顺序不变）：热门、最新、排行榜、AI换脸、AI魔改、短剧、
  漫剧、都市、古风、修仙、甜宠。原始分类走标签 → 专题 → 搜索三级级联。
- **新增 11 个专题分类**（`/api/topics` 全量，之前只知道 1 个）：
  精品高分 81、家庭伦理 68、天菜男同 77、仙侠奇幻 34、末世重生 29、
  古风穿越 27、百合女同 15、灵异诡事 13、校园青春 11、欧美精选 9、
  乡村成人 7。专题详情走 `/api/topics/{slug}`，视频在 `data.videos.items`。
- **新增 9 个标签组、161 个标签**（`/api/tags` 全量）：短剧题材 25、
  短剧架空 12、短剧男频 5、短剧女频 4、短剧伦理 8、短剧共用 11、
  成人外貌 39、成人玩法 40、成人场景 17。每个组默认取组内最热标签，
  筛选里可切换组内全部标签；单个标签也可直接进（`tag:霸总` 54 条）。
  标签接口只认中文名（`/api/videos/tag/{中文名}`），slug 形式返回 0 条。

标签与专题在首页刷新（24 小时缓存，存在 Arcane 本地存储里），
站内上新标签/专题后自动出现。**视频列表本身不缓存**：首页、热门、最新、
各分类、搜索每次打开都是实时请求 API，新上架的片立刻出现，不用等
24 小时。测试时段内总库就从 1717 涨到 1718、古风从 192 涨到 194，
站内确实在持续上新。

### 首页

优先用 `/api/home`（banners + featured + latest + 分类/专题推荐），
失败退回热门列表。另有 `/api/search/hot` 热搜词（黄果短剧、黄果成人短剧…）。

### 封面图片

封面是 AES-128-CBC 加密的（key `f5d965df75336270`、iv `97b60394abc2fbe1`，
已用 openssl 验证可解出正常 JPEG），旧 JS 版直接返回原地址，播放器
解不出图。本版把 `drleao.cn` 的封面走 `proxy()` 解密后返回
（Arcane 沙箱的 `aesX`，与 `AI.py` 的解密逻辑一致）。

**v3.1.0 新增：Netlify 中转兜底**。Brooks 部署的封面解密中转
`https://rococo-entremet-86855d.netlify.app/.netlify/functions/cover?u=封面地址`
在云端解密封面并返回正常 JPEG（已实测：`image/jpeg`，174816 字节，
跨域允许，24 小时缓存）。封面加载顺序（v3.2.2 起）：

1. 加密封面默认直接走 Netlify 中转（本地代理链路在手机上不出图）；
2. 本地 `proxy()` 仍保留：中转被禁用时走本地解密，非加密图仍走
   本地代理；直取/解密失败时，`proxy()` 内部改走中转；
3. Rex 模块没有本地图片代理，封面一律走中转地址。

中转地址可在源配置 `ext` 里覆盖：`{"coverRelay": "https://…/cover"}`，
设为空字符串则禁用中转。

**v3.2.1 新增：封面加载慢的修复**。慢的原因是封面本身就是 175KB 左右
的加密大图（1086×1448 的 JPEG），一屏 20 张要拉约 3.5MB 再逐张解密；
而旧版单张超时是 15 秒，直取一卡就拖住整屏，失败再走中转又要 15 秒。
本版把超时收紧到直取 6 秒 / 中转 8 秒（实测：直取 0.5~1.1 秒、
中转 1.3 秒，6 秒对慢网络仍有余量），一张图最迟 14 秒必有结果。
另外 `ext` 新增开关 `{"coverRelayFirst": true}`：如果直连图床
`pic.drleao.cn` 在你那边慢、但 Netlify 中转快，封面会跳过本地直取、
直接走中转；默认仍是本地直取优先。注意实测否掉了两个“省流量”
想法：`new2.drleao.cn` 的 `.webp` 派生图反而比原图大 1.5 倍
（266752 vs 174816 字节，且同样是加密的），站上也没有更小的缩略图
接口，所以仍用原图。

**v3.2.2 新增：封面全空的修复**。手机上标题能加载、封面全空——
中转实测正常（`image/jpeg`，174816 字节），问题在本地代理链路：
封面地址是本地 `127.0.0.1 /proxy` 地址，Arcane 的 `/proxy` 处理器
要按 `?source=` 查会话（会话释放或端口变化就 500），且 `proxy()`
还要从手机直连 `pic.drleao.cn` 取加密图再解密；任一环节在手机网络
上出问题就是整屏空白。v3.2.2 把 `coverRelayFirst` 默认改为 `true`，
加密封面不再经过本地代理，直接由 App 从中转加载已解密的 JPEG；
本地代理仍作兜底（中转禁用、非加密图、以及 `proxy()` 内部失败时）。
`ext` 填 `{"coverRelayFirst": false}` 可恢复本地代理优先。

### 封面有没有（每次打开都会验）

测试会验三件事：首页、热门、详情前 5 条的封面地址非空；抽查 3 条首页
封面的原图走中转能解出真 JPEG（`ffd8ff`）；`proxy()` 解密后为真 JPEG
（174813 字节）。在使用中如果某条没图：先看它的封面地址是否为空
（站内极个别老片确实没传封面），再看中转是否可达（`cover` 函数
24 小时缓存，换了封面地址后最迟一天后刷新）。

## 播放（v3.2.0：匿名直连已通）

**旧结论已过时**：之前认为匿名拿不到直链，是因为当时测的是旧接口
`GET /api/videos/{id}/play?ep=`（它的 `video_url` 恒为空）。站点
其实早在 11 月 8 日就升级为播放地址实时下发，主接口是：

```http
POST /api/videos/{id}/episodes/{ep}/playback
Content-Type: application/json
Body: {}
```

匿名返回 `data.streams.main`（真实签名 m3u8）、`hevc`、`preview` 与
`data.cdn`（`m3u8Enabled` + `x-cdn-auth` 鉴权头）。实测 id=12 第 1/2 集
与新片 13679 都能取，m3u8 本身拉下来是合法 AES-128 HLS 播放列表，
镜像站 `d1716d.bmikbxhi.cc` 同样可用。

播放链路（三个文件一致）：

1. 先调新 playback 接口，取 `streams.main`（没有再取 `hevc`/`preview`）；
2. 取到直链后先 **Range 嗅探验流**：取前 1KB 判魔数，`#EXTM3U`/TS 放行，
   HTML（盾页）/图片判死回落；探测本身失败（网络抖动、CDN 不支持 Range）
   一律 fail-open，不把能播的源判死；
3. 返回 `parse: 0` + 直链 + 播放头（基础头 + `x-cdn-auth` / `x-cdn-app`），
   并预热后 5 集（现在直链可取，预热真正生效）；
4. 旧 play 接口、详情接口同名字段保留作兜底，全部落空才返回 `parse: 1`
   交给 Arcane 解析网页版播放页 `/video/{id}/`。

直链是带时间戳签名的，播放缓存只有 5 分钟，过期重新下发，不会用旧链。

## 安装与使用（Arcane）

> **一个文件，两个入口，装一个就行。**v1.0.7 `huangguo-upload.js` 与
> v4.0.0 `huangguo.js` 都没有任何 `export`，站源入口和模块入口都能进，
> 不会再报 `SyntaxError: Unexpected keyword 'export'`。两个入口都装也
> 可以（内容一致，互不冲突）。换版时要先删掉旧源/旧模块，再用新地址
> 重新添加（Arcane 会把下载的 JS 按地址缓存，同一地址不会重新下载）。
>
> 直链（v1.0.7，GitHub 永久直链，2026-11-15 已验证）：
> `https://cdn.jsdelivr.net/gh/Tom6308/-@main/huangguo-upload.js`
> （备用 `https://raw.githubusercontent.com/Tom6308/-/main/huangguo-upload.js`）。
> 旧的 Netlify 链（v1.0.3 `gorgeous-beijinho`、v1.0.2 `frolicking-faloodeh`、
> v1.0.1 `calm-pixie`、v1.0.0 `kaleidoscopic-sherbet`）都别再用。
>
> 这是 upload.py 转换版（v1.0.7）的直链，多了吃瓜。v4.0.0（AI.py 改写版，
> 分类更多）的直链是
> `https://aquamarine-melba-809656.netlify.app/huangguo.js`（2026-11-14
> 23:15 验证：200，61,920 字节，与本地逐字节一致）。两个文件都能独立用，
> 装一个就行。下面的安装步骤用 upload.py 版的直链；要装 v4.0.0 就把
> 地址换成上面那个。

### 站源入口（分类浏览）

1. 在 Arcane 里点「设置」→「站源订阅」，在站源列表点右上角 + →
   「添加 Python 链接」，名称填 `黄果短剧`，地址填上面那个直链，
   点添加。注意：不要走「添加订阅」（它只认 Node 包或 JSON 订阅，
   单个 .js 会报 `index.js.md5` 错误）。
2. 不用填任何配置：首次打开自动探测最优域名（大陆一般是
   `d1716d.bmikbxhi.cc`）。
3. 可选配置（源配置 `ext`，填域名或 JSON）：
   - 固定域名：`https://huangguoai.com`
   - 固定域名 + 登录：`{"host": "https://huangguoai.com", "token": "..."}`
     或 `{"cookie": "..."}`。token/cookie 只放内存，不写磁盘。
   - **封面中转**：默认就是 Brooks 的 rococo 中转，不用填。想换一个，
     在 `ext` 里直接粘贴新的中转链接（基础地址，不带 `?u=` 参数，例如
     `https://xxx.netlify.app/.netlify/functions/cover`），不用写 JSON；
     或填 `{"coverRelay": ""}` 禁用中转。

### 模块入口（首页推荐架）

1. 在 Arcane 里点「设置」→「模块」，点「链接添加」，粘贴上面那个
   直链；也可以点「本地导入」，直接选 `huangguo.js` 这个文件。
   （`manifest.json` 是同格式的清单，供注册/对照用。）
2. 首页会出现热门、最新上新、排行榜、精选推荐、精品短剧、家庭伦理、
   天菜男同、都市、甜宠九个推荐架；搜索走模块的搜索入口。
3. 点击条目走 `loadDetail`（`huangguo:<id>`），播放走 `loadResource`
  （`type: 'stream'`，`huangguo:<id>|<集数>`）。
4. 封面中转：默认就是 Brooks 的 rococo 中转，不用填。v1.0.1 起模块设置
   里不再有「封面中转链接」入口行——Arcane 的模块行点进去只会跑函数并
   显示结果，根本不渲染文本输入框（点进去是“暂无内容”），那个入口填
   不了东西，所以删掉了。想换中转地址用站源入口的 `ext`（见上面）。

## 测试结果

测试方法：`node --experimental-vm-modules test_v4.mjs`，用 Node 模拟
Arcane 两种运行时的真实语义（tvbox 沙箱的 `req()` 对象返回 +
`getProxyUrl/local/aesX`，以 `vm.SourceTextModule` 加载、经
`__JS_SPIDER__` 取 spider；Rex 沙箱的 `Widget.http.get/post` 返回
`{ data }` + `Widget.storage`，以经典脚本加载、读全局 `WidgetMetadata`
与全局函数），再对真实 API 做全量 live 测试。2026-11-14 23:15 结果：
**87/87 通过**（v4.0.0 从零重写，两种加载都验）。

| 检查点 | 结果 |
|---|---|
| 首页分类 31 个，列表 20 条，封面走中转（v3.2.2 起默认）/ 非加密图走代理 | 通过 |
| 热门 1723 条 / 87 页，最新 1723 条 | 通过（测试中涨到 1723） |
| 排行榜 20 条，第 2 页为空 | 通过 |
| AI换脸 38、AI魔改 33、短剧 81、漫剧 19 | 通过 |
| 都市 755、古风 194、修仙 42、甜宠 128；都市第 2 页正常 | 通过（站内持续上新，精确值改为下限断言） |
| 专题：天菜男同 77、校园青春 11 | 通过 |
| 标签组：短剧题材默认 24、切标签“性转”24、“3P”1；`tag:霸总` 54 | 通过 |
| 详情 id=12：21 集，`第1集$12|1`，导演/年份正常 | 通过 |
| 搜索“AI换脸”38 条；热搜含“黄果短剧” | 通过 |
| **播放 12\|1：`parse: 0` + 真实 m3u8 直链 + `x-cdn-auth` 头；`play` 与 `lazy` 一致；12\|2 同样直连** | **通过（v3.2.0 新增）** |
| **嗅探：真 m3u8 放行，站首页 HTML 判死** | **通过（v3.2.0 新增）** |
| **封面有没有：首页/热门/详情前 5 条封面非空；抽查 3 条经中转得真 JPEG** | **通过（v3.2.0 新增）** |
| 图片代理：解密后为真 JPEG（174813 字节，`ffd8ff`） | 通过 |
| 中转直取：`_relayCover` 返回真 JPEG；直取被强制失败时 `proxy()` 改走中转仍 200；无本地代理时 `_pic()` 直接返回中转地址 | 通过 |
| **封面 fail-fast（v3.2.1 新增，v3.2.2 改默认）：`proxy()` 直取超时 6 秒、中转超时 8 秒；`coverRelayFirst` 默认 `true`，`_pic()` 默认直接返回中转地址，`false` 时走本地代理** | **通过（v3.2.2 更新）** |
| 域名轮换：host 指到死域名后自动回到可用域名并返回内容 | 通过 |
| Rex：元数据、10 个模块、搜索、详情 21 集、播放源 | 通过 |
| **Rex 播放：`loadResource` 12\|1/12\|2 均为 `parse: 0` + m3u8 + `x-cdn-auth`，`format: hls`；Rex 列表/详情封面非空** | **通过** |
| **模块设置页入口：功能设置第一行「封面中转链接」，值写进存储后所有行通用** | **通过（v4.0.0 保留）** |

复现：

```bash
node --experimental-vm-modules test_v4.mjs
# RESULT: PASS 87 / FAIL 0
```

### v1.0.8（upload.py 转换版）测试结果

测试方法：`node --experimental-vm-modules test_upload.mjs`，与 v4.0.0
同样的两种运行时模拟（tvbox 沙箱 `vm.SourceTextModule` +
`__JS_SPIDER__`；Rex 沙箱经典脚本 + `WidgetMetadata`），再对真实 API
做全量 live 测试。2026-11-15 01:15 结果：**180/180 通过**（v1.0.7
为 169/169，新增 11 项 v1.0.8 检查：Worker 地址识别（workers.dev
与 localhost 原样通过）、`_isWorkerRelay`（Worker 真、Netlify 假、
默认中转真）、Worker 中转下列表/详情封面是 Worker 中转真图、线上
Worker 实时解密 200 + Content-Length + JPEG、Netlify 中转仍回落
标题海报）。

| 检查点 | 结果 |
|---|---|
| 首页 30 个分类（热门推荐/最近上新/黄果原创 + 4 基础 + 20 题材 + 专题 + 排行 + 吃瓜），顺序正确，列表 20 条 | 通过（v1.0.5 更新） |
| **新分类：最近上新 28 条/62 页（首条 13727 纯情校花堕落记，最新剧）、黄果原创 39 条/6 页（首条 13688 逍遥安平王）、热门推荐 28 条/3 页（首条 12175 枪欲玫瑰）；题材 dushi/xianxia/ntr 均有内容** | **通过（v1.0.5 新增）** |
| 专题 11 个（含混合大小写 `AImori-chongsheng`、全角破折号 `xiaoyuan—qingcun`） | 通过 |
| 基础分类：AI短剧 1609、AI漫剧 114、AI换脸 38（搜索兜底）、最新/热门/随机各 20 条 | 通过 |
| 排行榜：热播/潜力/推荐榜各 20 条，第 2 页为空；专题默认/天菜男同各 28 条，limit 24，第 2 页为空 | 通过 |
| 标签：前 30 个，`tag=muzi` 28 条 | 通过 |
| 吃瓜：全部/热门/原创/第 2 页各 12 条，`vod_id` 带 `archives_` 前缀 | 通过 |
| 详情 id=12：21 集，`第1集$hgdj|12|1`，`vod_play_from=黄果短剧`，含热度/收藏/点赞 | 通过 |
| 吃瓜详情：正文图与视频分两组（`$$$` 分隔），视频标记 `hgdjpost|` | 通过 |
| 搜索“女”292 条、“AI换脸”38 条 | 通过 |
| **播放 `hgdj|12|1`/`hgdj|12|2`：`parse: 0` + 真实 m3u8 直链 + `x-cdn-auth` 头；`play` 与 `lazy` 一致；完整片段 `第1集$hgdj|12|1` 与裸数字 `12` 也能取流** | **通过** |
| **吃瓜播放：带视频的帖子 `hgdjpost|` 直链 `parse: 0` + m3u8** | **通过** |
| **m3u8 相对 URI 重写：`key.bin`/`seg1.ts` 拼成绝对地址** | **通过** |
| **封面有没有：首页/分类/详情前 5 条封面非空** | **通过** |
| 图片代理：解密后为真 JPEG（174816 字节，`ffd8ff`）；`proxy://` 字符串参数也通；直取被强制失败时改走中转仍 200；全候选失败返回占位 PNG 200（不裂图） | 通过 |
| **`_wrapPic` v1.0.6 起默认走本地代理（`coverRelayFirst=false`，`vod_pic` 是 `127.0.0.1` 本地 /proxy 地址）；`coverRelayFirst=true` 时走中转；`api_base` 换入口；裸中转链接识别与 `?u=` 剥离** | **通过（v1.0.6 更新）** |
| **本地代理封面全链路：拿一条首页 `vod_pic`（本地 /proxy 地址），按 Arcane /proxy 处理器的方式调 `spider.proxy()`，返回 200 真图（JPEG 或 PNG）** | **通过（v1.0.6 新增）** |
| **分类页回归：AI换脸（filter 与 extend 两种传法都通，20/28 条）、熟女 28 条、乱伦 28 条、ai-duanju filter sort=hot、排行榜 filter rank_type=potential** | **通过（v1.0.6 新增）** |
| 域名轮换：host 指到死域名后自动回到可用域名并返回内容 | 通过 |
| Rex：元数据 v1.0.8、31 个模块、搜索、详情 21 集、吃瓜详情、播放源 | 通过 |
| **Rex 播放：`loadResource` `hgdj|12|1`/`hgdj|12|2` 均为 `parse: 0` + m3u8 + `x-cdn-auth`，`format: hls`；对象 `{link}` 参数也通** | **通过** |
| **Rex 封面 v1.0.8：列表/详情的 `posterPath`/`backdropPath`/`cover`/`coverUrl` 都是 Worker 中转真图地址（`huangguo-cover.tang72276.workers.dev?u=…`，线上 Worker 实测 200 + Content-Length + JPEG）；默认中转已是 Worker，不再是 Netlify；Netlify 中转时仍换标题海报（v1.0.7 兜底）；永不 `proxy://`** | **通过（v1.0.8 更新）** |
| **Rex 点条目：条目带 `type: 'url'` + `mediaType: 'tv'` 与 `link: 'huangguo:<id>'`；拿条目的 `link` 调 `loadDetail` 能拿到详情和集数（模拟 App 点条目链路）** | **通过（v1.0.7 更新，v1.0.3 新增）** |
| **Rex 点选集：选集带 `title` + `id`（`hgdj|vid|n`）+ `seasonNumber`/`episodeNumber`/`playerType: 'app'`；详情同时给 `episodes`/`episodeList`/`episodeItems` 三个键；拿选集的 `id` 调 `loadResource` 能取到 `parse: 0` 直链（模拟 App 点选集 → 播放链路）** | **通过（v1.0.7 新增）** |
| **Rex loadResource：再补 `playerType: 'app'` + `customHeaders`（含 x-cdn-auth）+ `name: '黄果'` + `description: '第1集'`（Forward 的资源形状）** | **通过（v1.0.7 新增）** |
| **Rex 中转自愈：存了裸站根 → 自动补全函数地址；存了无效值 → 用默认；`coverRelayFirst=false` 时仍走中转、永不 `proxy://`；「封面中转链接」入口行已删** | **通过（v1.0.1 新增）** |
| **Rex 新分类：最近上新 28 条（首条 13727 纯情校花堕落记）、黄果原创 39 条（首条 13688 逍遥安平王）、题材行 dushi/xianxia 均有内容且封面为 Worker 中转真图** | **通过（v1.0.8 更新，v1.0.5 新增）** |

复现：

```bash
node --experimental-vm-modules test_upload.mjs
# RESULT: PASS 169 / FAIL 0
```

> 注意：`gorgeous-beijinho-70a410` 站上的仍是 v1.0.3（v1.0.4 与
> v1.0.5 都因 Netlify 额度用完未部署成功），不要用它装新版。

## 已知问题（诚实说明，不藏着）

1. **Arcane 真机上的 POST 透传尚未验证**：`_raw()` 会把 `method`/`body`
   传给沙箱的 `req()`；本机测试桩用 Node `fetch` 验证了完整链路
   （62/62），但 Arcane 的 `tvbox_js/network.js` 是否真的透传这两个
   选项，没法在真机外 100% 确认。如果在你手机上点播放后仍是网页解析
   （`parse: 1`）而不是直连，把现象告诉我，我按你那版 Arcane 再调。
2. **排行榜只有一页**，第 2 页起返回空列表（服务端忽略 `page` 参数）。
3. 个别标签只有 1 条（如“巨乳”“3P”“宿舍”各 1 条），这是站内真实数据。
4. 分类总数、专题数、标签数以站内实时为准；文件里的数字是
   2026-11-14 的快照，运行时首页刷新会更新。

## 注意事项

本模块仅供学习研究接口与播放器适配使用，请遵守当地法律法规与目标站点的
使用条款；请勿将 AI 换脸相关功能用于未经授权的真人。本模块不下载、不传播
任何视频内容，只做分类浏览与播放地址解析。
