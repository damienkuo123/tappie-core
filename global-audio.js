/**
 * Happy Marian 3.0 - 全域通用音效與配樂引擎 (Global Audio Engine)
 * 修正：平滑音量控制 (Smooth Ducking)、正確的 Gacha ID、強化防呆
 */

const GlobalAudio = {
    sounds: {
        click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        popupOpen: new Audio('https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3'),
        popupClose: new Audio('https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3')
    },

    bgm: {
        dashboard: new Audio('https://damienkuo123.github.io/marian-app/audio/cyberwave-orchestra-puzzle-game-loop-bright-casual-video-game-music-249201.mp3'), 
        lobby: new Audio('https://damienkuo123.github.io/marian-app/audio/決戦へ.mp3'),      
        arenaNormal: new Audio('https://damienkuo123.github.io/marian-app/audio/wind_feelings.mp3'), 
        arenaBattle: new Audio('https://damienkuo123.github.io/marian-app/audio/Devil_Disaster.mp3'), 
        gacha: new Audio('https://damienkuo123.github.io/marian-app/audio/wind_feelings.mp3')        
    },

    currentBGM: null,
    baseBGMVolume: 0.15, // 統一的預設 BGM 音量
    isInteracted: false, // 紀錄使用者是否已經互動過畫面

    init: function() {
        this.sounds.click.volume = 0.4;
        this.sounds.popupOpen.volume = 0.5;
        this.sounds.popupClose.volume = 0.4;

        for (let key in this.bgm) {
            this.bgm[key].volume = this.baseBGMVolume;
            this.bgm[key].loop = true;
        }

        // 🚀 全局互動解鎖器：解決瀏覽器自動播放限制
        const unlockAudio = () => {
            if (!this.isInteracted) {
                this.isInteracted = true;
                // 只要點了任何地方，就開始嘗試播放應該播的音樂
                if (this.currentBGM && this.currentBGM.paused) {
                    this.currentBGM.play().catch(e => console.warn("BGM Play Error:", e));
                }
                document.removeEventListener('pointerdown', unlockAudio);
            }
        };
        document.addEventListener('pointerdown', unlockAudio);

        this.bindClickEvents();
        this.observeModals();
        this.bindMicDucking(); 
        this.autoPlayBGM();    
        
        console.log("🎵 Global Audio Engine 3.1 Initialized (Smooth Ducking)");
    },

    autoPlayBGM: function() {
        const currentPath = window.location.pathname.toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);
        let targetBGM = null;

        if (currentPath.includes('dashboard')) {
            targetBGM = this.bgm.dashboard;
        } else if (currentPath.includes('arena')) {
            if (urlParams.get('mode') === 'battle' || urlParams.get('roomId')) {
                targetBGM = this.bgm.arenaBattle;
            } else {
                targetBGM = this.bgm.arenaNormal;
            }
        } else if (currentPath.includes('lobby')) {
            targetBGM = this.bgm.lobby; // 🚀 確認 Lobby 有抓到專屬音樂
        }

        if (targetBGM) {
            this.currentBGM = targetBGM;
            // 如果使用者之前已經在其他頁面互動過了，就直接播
            if (this.isInteracted) {
                this.currentBGM.play().catch(e => console.warn("BGM Play Error:", e));
            }
        }
    },

    // ==========================================
    // 🎤 麥克風防干擾機制：改用「平滑音量調整 (Smooth Volume Ducking)」
    // ==========================================
    bindMicDucking: function() {
        let fadeOutInterval, fadeInInterval;

        document.addEventListener('pointerdown', (e) => {
            if (e.target.closest('#record-btn') || e.target.closest('#battle-record-btn')) {
                if (this.currentBGM) {
                    clearInterval(fadeInInterval);
                    // 平滑降低音量到 0
                    fadeOutInterval = setInterval(() => {
                        if (this.currentBGM.volume > 0.02) {
                            this.currentBGM.volume -= 0.02;
                        } else {
                            this.currentBGM.volume = 0;
                            clearInterval(fadeOutInterval);
                        }
                    }, 20); // 每 20ms 降一次，創造漸弱效果
                }
            }
        });

        const resumeAudio = (e) => {
            if (e.target.closest('#record-btn') || e.target.closest('#battle-record-btn')) {
                if (this.currentBGM) {
                    clearInterval(fadeOutInterval);
                    // 確保 BGM 正在播放中，然後平滑恢復音量
                    if (this.currentBGM.paused) this.currentBGM.play().catch(err=>{});
                    
                    fadeInInterval = setInterval(() => {
                        if (this.currentBGM.volume < this.baseBGMVolume - 0.02) {
                            this.currentBGM.volume += 0.02;
                        } else {
                            this.currentBGM.volume = this.baseBGMVolume;
                            clearInterval(fadeInInterval);
                        }
                    }, 50); // 每 50ms 升一次，創造漸強效果
                }
            }
        };

        document.addEventListener('pointerup', resumeAudio);
        document.addEventListener('pointercancel', resumeAudio);
        document.addEventListener('pointerout', resumeAudio);
    },

    play: function(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0; 
            sound.play().catch(e => {});
        }
    },

    bindClickEvents: function() {
        document.addEventListener('pointerdown', (e) => {
            const target = e.target.closest('button, a, .btn, .btn-dock, .btn-play-pill, .ws-letter, .btn-image-choice');
            if (target && !target.disabled && !target.classList.contains('disabled') && target.id !== 'record-btn' && target.id !== 'battle-record-btn') {
                if (target.hasAttribute('data-no-click-sound')) return;
                this.play('click');
            }
        });
    },

    observeModals: function() {
        // 🚀 修正 Gacha ID 為 #epic-reward-zone
        const displayModals = ['#summary', '#impact-overlay', '#phonic-helper-overlay', '#logModal'];
        const classModals = [{ selector: '#lb-panel', activeClass: 'open' }];

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const target = mutation.target;

                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    
                    const isDisplayModal = displayModals.some(selector => target.matches(selector));
                    if (isDisplayModal) {
                        const displayStyle = window.getComputedStyle(target).display;
                        const opacityStyle = window.getComputedStyle(target).opacity;
                        if (displayStyle !== 'none' && opacityStyle !== '0' && !target.dataset.audioStateOpen) {
                            this.play('popupOpen');
                            target.dataset.audioStateOpen = "true";
                        } else if (displayStyle === 'none' && target.dataset.audioStateOpen) {
                            this.play('popupClose');
                            delete target.dataset.audioStateOpen;
                        }
                    }

                    // 🚀 處理抽卡畫面 (使用正確的 #epic-reward-zone)
                    if (target.matches('#epic-reward-zone')) {
                        const displayStyle = window.getComputedStyle(target).display;
                        if (displayStyle !== 'none' && !target.dataset.gachaBgmPlaying) {
                            if (this.currentBGM) this.currentBGM.pause();
                            this.bgm.gacha.currentTime = 0;
                            // 抽卡音樂稍微大聲一點才有氣勢
                            this.bgm.gacha.volume = 0.4; 
                            this.bgm.gacha.play().catch(e=>{});
                            target.dataset.gachaBgmPlaying = "true";
                        } else if (displayStyle === 'none' && target.dataset.gachaBgmPlaying) {
                            this.bgm.gacha.pause();
                            if (this.currentBGM) this.currentBGM.play().catch(e=>{});
                            delete target.dataset.gachaBgmPlaying;
                        }
                    }
                }

                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    classModals.forEach(config => {
                        if (target.matches(config.selector)) {
                            const isOpen = target.classList.contains(config.activeClass);
                            if (isOpen && !target.dataset.audioStateOpen) {
                                this.play('popupOpen');
                                target.dataset.audioStateOpen = "true";
                            } else if (!isOpen && target.dataset.audioStateOpen) {
                                this.play('popupClose');
                                delete target.dataset.audioStateOpen;
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GlobalAudio.init();
});
