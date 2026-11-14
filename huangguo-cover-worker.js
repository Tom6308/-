// 黄果封面解密中转 —— Cloudflare Worker（免费部署）
//
// 作用：App 里的模块拿不到图片二进制，解不了加密封面；
// 这个 Worker 替模块干这件事：
//   App（原生图片加载） → Worker（取密文 → AES-CBC 解密 → 返回真 JPEG）
// 模块里只要把封面地址改写成 Worker 地址就行，不用再在模块里解密。
// 密钥和 Python 版 AI.py 里的一致：key f5d965df75336270，iv 97b60394abc2fbe1。
// 解密用的是纯 JS AES（已验证，和 Node crypto 解出来逐字节一致），
// 不依赖 WebCrypto 的 padding，不会被 JPEG 尾字节顶掉。
//
// 部署：把这个文件粘贴到 Cloudflare Workers 里，得到
// https://xxx.workers.dev，再把它填进黄果模块的“封面中转地址”里。
// 部署后先打开 https://你的地址/health，应显示 {"ok":true}。

var _AES_SBOX = (function () {
    function gfMul(a, b) {
        var p = 0;
        for (var i = 0; i < 8; i++) { if (b & 1) p ^= a; var hi = a & 0x80; a = (a << 1) & 255; if (hi) a ^= 0x1b; b >>= 1; }
        return p;
    }
    function gfInv(a) {
        if (a === 0) return 0;
        var r = 1;
        for (var i = 0; i < 254; i++) r = gfMul(r, a);
        return r;
    }
    function rotl8(x, n) { return ((x << n) | (x >> (8 - n))) & 255; }
    var s = new Array(256);
    for (var i = 0; i < 256; i++) {
        var inv = gfInv(i);
        s[i] = (inv ^ rotl8(inv, 1) ^ rotl8(inv, 2) ^ rotl8(inv, 3) ^ rotl8(inv, 4) ^ 0x63) & 255;
    }
    return s;
})();
var _AES_RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d];
function _aesExpandKey(key) {
    var Nk = key.length / 4, Nr = Nk + 6, w = [];
    for (var i = 0; i < Nk; i++) w.push([key[i * 4], key[i * 4 + 1], key[i * 4 + 2], key[i * 4 + 3]]);
    for (var j = Nk; j < 4 * (Nr + 1); j++) {
        var t = w[j - 1].slice();
        if (j % Nk === 0) {
            t = [_AES_SBOX[t[1]] ^ _AES_RCON[j / Nk - 1], _AES_SBOX[t[2]], _AES_SBOX[t[3]], _AES_SBOX[t[0]]];
        } else if (Nk > 6 && j % Nk === 4) {
            t = [_AES_SBOX[t[0]], _AES_SBOX[t[1]], _AES_SBOX[t[2]], _AES_SBOX[t[3]]];
        }
        w.push([w[j - Nk][0] ^ t[0], w[j - Nk][1] ^ t[1], w[j - Nk][2] ^ t[2], w[j - Nk][3] ^ t[3]]);
    }
    return { w: w, Nr: Nr };
}

var _AES_INV_SBOX = (function () {
    var inv = new Array(256);
    for (var i = 0; i < 256; i++) inv[_AES_SBOX[i]] = i;
    return inv;
})();
function _gfMul(a, b) {
    var p = 0;
    for (var i = 0; i < 8; i++) { if (b & 1) p ^= a; var hi = a & 0x80; a = (a << 1) & 255; if (hi) a ^= 0x1b; b >>= 1; }
    return p;
}
function _aesDecryptBlock(input, exp) {
    var s = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) s[r][c] = input[c * 4 + r];
    function addKey(round) { for (var cc = 0; cc < 4; cc++) for (var rr = 0; rr < 4; rr++) s[rr][cc] ^= exp.w[round * 4 + cc][rr]; }
    function invSub() { for (var cc = 0; cc < 4; cc++) for (var rr = 0; rr < 4; rr++) s[rr][cc] = _AES_INV_SBOX[s[rr][cc]]; }
    function invShift() {
        for (var rr = 1; rr < 4; rr++) {
            var row = [s[rr][0], s[rr][1], s[rr][2], s[rr][3]];
            for (var cc = 0; cc < 4; cc++) s[rr][cc] = row[(cc - rr + 4) % 4];
        }
    }
    function invMix() {
        for (var cc = 0; cc < 4; cc++) {
            var a0 = s[0][cc], a1 = s[1][cc], a2 = s[2][cc], a3 = s[3][cc];
            s[0][cc] = _gfMul(a0, 14) ^ _gfMul(a1, 11) ^ _gfMul(a2, 13) ^ _gfMul(a3, 9);
            s[1][cc] = _gfMul(a0, 9) ^ _gfMul(a1, 14) ^ _gfMul(a2, 11) ^ _gfMul(a3, 13);
            s[2][cc] = _gfMul(a0, 13) ^ _gfMul(a1, 9) ^ _gfMul(a2, 14) ^ _gfMul(a3, 11);
            s[3][cc] = _gfMul(a0, 11) ^ _gfMul(a1, 13) ^ _gfMul(a2, 9) ^ _gfMul(a3, 14);
        }
    }
    addKey(exp.Nr);
    for (var round = exp.Nr - 1; round >= 1; round--) { invShift(); invSub(); addKey(round); invMix(); }
    invShift(); invSub(); addKey(0);
    var out = new Uint8Array(16);
    for (var c2 = 0; c2 < 4; c2++) for (var r2 = 0; r2 < 4; r2++) out[c2 * 4 + r2] = s[r2][c2];
    return out;
}
function _aesCbcDecrypt(cipherBytes, keyBytes, ivBytes) {
    var exp = _aesExpandKey(keyBytes);
    var out = new Uint8Array(cipherBytes.length);
    var prev = ivBytes;
    for (var i = 0; i < cipherBytes.length; i += 16) {
        var block = cipherBytes.slice(i, i + 16);
        var dec = _aesDecryptBlock(block, exp);
        for (var j = 0; j < 16; j++) out[i + j] = dec[j] ^ prev[j];
        prev = block;
    }
    return out;
}
function _b64Encode(bytes) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "";
    for (var i = 0; i < bytes.length; i += 3) {
        var b0 = bytes[i], b1 = i + 1 < bytes.length ? bytes[i + 1] : 0, b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
        out += chars[b0 >> 2] + chars[((b0 & 3) << 4) | (b1 >> 4)];
        out += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : "=";
        out += i + 2 < bytes.length ? chars[b2 & 63] : "=";
    }
    return out;
}
function _textEncode(str) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
    var utf8 = unescape(encodeURIComponent(str));
    var out = new Uint8Array(utf8.length);
    for (var i = 0; i < utf8.length; i++) out[i] = utf8.charCodeAt(i);
    return out;
}

function _sniffType(b) {
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
    if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
    if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
    if (b.length >= 12 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
    return "application/octet-stream";
}
function _isImage(b) {
    var t = _sniffType(b);
    return t !== "application/octet-stream";
}
export default {
    async fetch(request) {
        var url = new URL(request.url);
        if (request.method === "OPTIONS") {
            return new Response("", { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
        }
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({ ok: true, source: "huangguo-cover" }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
        }
        var u = url.searchParams.get("u") || "";
        if (!u || (u.indexOf("http://") !== 0 && u.indexOf("https://") !== 0)) {
            return new Response("need ?u=https://...", { status: 400 });
        }
        try {
            var r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36", "Referer": "https://huangguoai.com/" } });
            if (!r.ok) return new Response("upstream " + r.status, { status: 502 });
            var buf = new Uint8Array(await r.arrayBuffer());
            var out = buf;
            // 密文长度是 16 的倍数就解密；解出来是图片就用解密后的
            if (buf.length >= 16 && buf.length % 16 === 0) {
                try {
                    var plain = _aesCbcDecrypt(buf, _textEncode("f5d965df75336270"), _textEncode("97b60394abc2fbe1"));
                    if (_isImage(plain)) out = plain;
                } catch (e) {}
            }
            return new Response(out, { headers: { "Content-Type": _sniffType(out), "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=86400" } });
        } catch (e) {
            return new Response("cover error: " + String(e && e.message || e), { status: 502 });
        }
    }
};
