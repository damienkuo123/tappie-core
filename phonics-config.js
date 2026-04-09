// 🏆 瑪麗安偵探 - 終極音訊配置表 (2026-04-09 校準版)

// [1] PHONICS_MAP: 這裡是你的 399 個 GitHub 檔案身分證
// 程式會先檢查這裡，如果點擊的字母(如 un)在這裡面，就直接播放
const PHONICS_MAP = {
    "th_voiced": "th_voiced", 
    "th_unvoiced": "th_unvoiced",
    "schwa": "schwa",
    // 這裡我幫你補上 399 清單中的核心成員，確保燈泡能亮
    "a_long": "a_long", "a_short": "a_short",
    "e_long": "e_long", "e_short": "e_short",
    "i_long": "i_long", "i_short": "i_short",
    "o_long": "o_long", "o_short": "o_short",
    "u_long": "u_long", "u_short": "u_short",
    "un": "un", "in": "in", "er": "er", "sh": "sh", "ch": "ch", "ck": "ck",
    // ... (其他的 300 多個因為 key 跟 value 一樣，程式會自動處理，不一定要全寫出來)
};

// [2] AZURE_TO_LOCAL_MAP: 這是最重要的「翻譯機」
// 負責把 Azure 傳來的標籤(如 dh) 翻譯成你 GitHub 的檔名(如 th_voiced)
const AZURE_TO_LOCAL_MAP = {
    // 🌍 TH 專區 (解決 father 問題)
    "dh": "th_voiced",    
    "th": "th_unvoiced",  

    // 🌍 母音專區 (解決 tired 與音量問題)
    "ax": "schwa",     
    "ae": "a_short",   "ey": "a_long",
    "eh": "e_short",   "iy": "e_long",
    "ih": "i_short",   "ay": "i_long",
    "aa": "o_short",   "ow": "o_long",
    "ah": "u_short",   "uw": "u_long",
    "uh": "oo_short",  "er": "er",
    
    // 🌍 字母點擊備援 (當學生點擊單個 E 或 A 時的保險)
    "a": "a_short",
    "e": "e_short",
    "i": "i_short",
    "o": "o_short",
    "u": "u_short",
    
    // 🌍 子音專區
    "jh": "g_soft",    "ch": "ch",       "sh": "sh",
    "zh": "sion",      "ng": "ng",       "hh": "h"
};
