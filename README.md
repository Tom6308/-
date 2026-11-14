# 黄果短剧 · Arcane JS 模块

`huangguo-upload.js` 是黄果短剧的 Arcane JS 模块（upload.py 转换版，v1.0.5）。

- 一个文件，两个入口：站源（`__JS_SPIDER__`）与 Rex 模块（`WidgetMetadata`），都不写 `export`，装一个就行。
- 分类与黄果短剧官网一致：热门推荐 / 最近上新 / 黄果原创 / AI短剧 / AI漫剧 / AI换脸 / AI魔改 / 20 个题材 / 专题合集 / 排行榜 / 黄果吃瓜。
- 直链播放（POST playback + Range 嗅探，`parse: 0`），封面走 Netlify 中转解密。

直链（jsDelivr）：

```
https://cdn.jsdelivr.net/gh/Tom6308/-@main/huangguo-upload.js
```

备用（GitHub raw）：

```
https://raw.githubusercontent.com/Tom6308/-/main/huangguo-upload.js
```

> 直链的版本号以文件头注释为准；更新时直接覆盖本文件即可，链接不变。
