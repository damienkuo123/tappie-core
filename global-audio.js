/**
 * Happy Marian 3.0 - 全域通用音效引擎 (Global Audio Engine)
 * * 負責自動捕捉所有按鈕點擊、介面彈出等通用行為，並播放對應的無版權音效。
 * 採用非侵入式設計，直接監聽 document 事件。
 */

const GlobalAudio = {
    // 預先準備好的音效實體 (使用可靠的無版權短音效 CDN)
    sounds: {
        // 點擊音效：清脆的木質/果凍感 (適合按鈕)
        click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        
        // 彈出音效：輕柔的「啵」聲 (適合 Popup / Modal 開啟)
        popupOpen: new Audio('https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3'),
        
        // 收起音效：輕微的「咻」聲 (適合 Popup / Modal 關閉)
        popupClose: new Audio('https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3')
    },

    // 初始化引擎：設定音量與綁定全域監聽器
    init: function() {
        // 統一調低音量，避免刺耳 (可依需求調整 0.0 ~ 1.0)
        this.sounds.click.volume = 0.4;
        this.sounds.popupOpen.volume = 0.5;
        this.sounds.popupClose.volume = 0.4;

        this.bindClickEvents();
        this.observeModals();
        console.log("🎵 Global Audio Engine Initialized");
    },

    // 播放指定音效 (支援快速連按，每次播放會將進度歸零)
    play: function(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            // 解決連按時聲音播不出來的問題
            sound.currentTime = 0; 
            // 捕捉可能因為瀏覽器自動播放政策而被擋下的錯誤
            sound.play().catch(e => console.warn("音效播放被瀏覽器攔截 (需使用者先互動):", e));
        }
    },

    // 🌟 1. 自動綁定「按鈕點擊」音效
    bindClickEvents: function() {
        // 監聽整個畫面的點擊事件
        document.addEventListener('pointerdown', (e) => {
            // 尋找被點擊的元素，或其父層是否為按鈕 (button, a, 或帶有 btn class 的元素)
            const target = e.target.closest('button, a, .btn, .btn-dock, .btn-play-pill, .ws-letter, .btn-image-choice');
            
            // 如果點擊的是我們定義的按鈕類型，且沒有被 disabled
            if (target && !target.disabled && !target.classList.contains('disabled')) {
                // 如果該按鈕帶有特定的免音效標記 (可選用)，則跳過
                if (target.hasAttribute('data-no-click-sound')) return;
                
                this.play('click');
            }
        });
    },

    // 🌟 2. 自動綁定「介面彈出/收起」音效 (透過 MutationObserver 監聽 DOM 變化)
    observeModals: function() {
        // 定義哪些 class 的顯示/隱藏代表彈出視窗 (依據你的專案結構調整)
        // 例如：結算畫面 (summary)、抽獎畫面 (gacha-overlay)、自訂 Popup
        const modalSelectors = ['#summary', '#gacha-overlay', '#impact-overlay', '#phonic-helper-overlay'];

        // 建立觀察者，監視 document.body 內屬性的變化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target;
                    
                    // 檢查這個變動的元素，是不是我們定義的彈跳視窗之一
                    const isModal = modalSelectors.some(selector => target.matches(selector));
                    
                    if (isModal) {
                        const displayStyle = window.getComputedStyle(target).display;
                        const opacityStyle = window.getComputedStyle(target).opacity;
                        
                        // 判斷開啟：display 變成不是 none，且 opacity 不是 0
                        if (displayStyle !== 'none' && opacityStyle !== '0' && !target.dataset.audioStateOpen) {
                            this.play('popupOpen');
                            target.dataset.audioStateOpen = "true"; // 標記已開啟，防重複觸發
                        } 
                        // 判斷關閉：display 變回 none
                        else if (displayStyle === 'none' && target.dataset.audioStateOpen) {
                            this.play('popupClose');
                            delete target.dataset.audioStateOpen; // 移除標記
                        }
                    }
                }
            });
        });

        // 開始監視整個 body 及其子元素的屬性變化
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['style', 'class'] // 監視 style 和 class 的變化
        });
    }
};

// 當網頁 DOM 載入完成後，啟動音效引擎
document.addEventListener('DOMContentLoaded', () => {
    GlobalAudio.init();
});