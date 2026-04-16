/**
 * Happy Marian 3.0 - 全域通用音效與配樂引擎 (Global Audio Engine - Web Audio API Edition)
 * 【法醫鑑定版】已植入微秒級時間戳記
 */

const GlobalAudio = {
    // 🚀 植入全域時間基準點 (法醫核心)
    startTime: performance.now(),
    
    log: function(msg) {
        const now = (performance.now() - this.startTime).toFixed(2);
        console.log(`[⏱️ ${now}ms] 🎵 GlobalAudio: ${msg}`);
    },

    soundUrls: {
        click: 'https://damienkuo123.github.io/marian-app/audio/click.mp3',
        popupOpen: 'https://damienkuo123.github.io/marian-app/audio/popupOpen.mp3',
        popupClose: 'https://damienkuo123.github.io/marian-app/audio/popupClose.mp3',
        countdown: 'https://damienkuo123.github.io/marian-app/audio/countdown.mp3',
        fireNormal: 'https://damienkuo123.github.io/marian-app/audio/fireNormal.mp3',
        fireUlt: 'https://damienkuo123.github.io/marian-app/audio/fireUlt.mp3',
        hit: 'https://damienkuo123.github.io/marian-app/audio/hit.mp3',
        cutin: 'https://damienkuo123.github.io/marian-app/audio/cutin.mp3',
        victory: 'https://damienkuo123.github.io/marian-app/audio/victory.mp3',
        shatter: 'https://damienkuo123.github.io/marian-app/audio/shatter.mp3'
    },

    bgm: {
        dashboard: new Audio('https://damienkuo123.github.io/marian-app/audio/cyberwave-orchestra-puzzle-game-loop-bright-casual-video-game-music-249201.mp3'), 
        lobby: new Audio('https://damienkuo123.github.io/marian-app/audio/決戦へ.mp3'),     
        arenaNormal: new Audio('https://damienkuo123.github.io/marian-app/audio/wind_feelings.mp3'), 
        arenaBattle: new Audio('https://damienkuo123.github.io/marian-app/audio/Devil_Disaster.mp3'), 
        gacha: new Audio('https://damienkuo123.github.io/marian-app/audio/Battle_in_the_Moonlight.mp3')        
    },

    audioCtx: null,
    audioBuffers: {}, 

    currentBGM: null,       
    isDucking: false,       

    // 🚀 強制喚醒武器 (加上監視器)
    unlockWebAudio: function() {
        this.log("嘗試解鎖 Web Audio API (unlockWebAudio 被呼叫)");
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.preloadAllSounds(); 
            this.log(`🆕 AudioContext 建立完成 (State: ${this.audioCtx.state})`);
        } else {
            this.log(`ℹ️ AudioContext 已存在 (State: ${this.audioCtx.state})`);
        }
        
        if (this.audioCtx.state === 'suspended') {
            this.log("⚠️ AudioContext 暫停中，發起 resume() 請求...");
            this.audioCtx.resume().then(() => {
                this.log(`✅ AudioContext resume 成功！(State: ${this.audioCtx.state})`);
            }).catch(e => {
                this.log(`❌ AudioContext resume 失敗: ${e.message}`);
            });
        }
        
        // 偷播空音訊
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            gain.gain.value = 0;
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(0);
            osc.stop(this.audioCtx.currentTime + 0.01);
            this.log("🔊 過水空音訊已發送至 Destination");
        } catch(e) {
            this.log(`❌ 過水空音訊發送失敗: ${e.message}`);
        }
    },

    init: function() {
        this.log("初始化 (init) 開始執行");
        for (let key in this.bgm) {
            this.bgm[key].volume = 0.1; 
            this.bgm[key].loop = true;
        }

        this.bindClickEvents();
        this.observeModals();
        this.bindMicDucking(); 
        this.autoPlayBGM();    
        
        const initWebAudio = () => {
            this.log("👉 偵測到全域 pointerdown 事件！準備呼叫 unlockWebAudio");
            this.unlockWebAudio(); 
            document.removeEventListener('pointerdown', initWebAudio);
        };
        document.addEventListener('pointerdown', initWebAudio);

        this.log("初始化 (init) 執行完畢，等待使用者全域點擊");
    },

    preloadAllSounds: function() {
        this.log("開始下載短音效 (preloadAllSounds)");
        for (let key in this.soundUrls) {
            fetch(this.soundUrls[key])
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => this.audioCtx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.audioBuffers[key] = audioBuffer; 
                })
                .catch(e => {}); 
        }
    },

    play: function(soundName) {
        if (!this.audioCtx || !this.audioBuffers[soundName]) return; 
        
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.audioBuffers[soundName];

        const gainNode = this.audioCtx.createGain();
        let vol = 1.0; 
        
        switch (soundName) {
            case 'click': vol = 0.8; break;
            case 'popupOpen': vol = 1.8; break;
            case 'popupClose': vol = 1.6; break;
            case 'hit': vol = 1; break;
            case 'countdown': vol = 1.5; break;
        }
        
        gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        source.start(0);
    },

    playGachaBGM: function() {
        if (this.currentBGM) {
            this.currentBGM.pause();
        }
        this.bgm.gacha.currentTime = 0;
        this.bgm.gacha.play().catch(e => {});
        document.body.dataset.gachaBgmPlaying = "true";
    },

    resumeNormalBGM: function() {
        if (document.body.dataset.gachaBgmPlaying) {
            this.bgm.gacha.pause();
            if (this.currentBGM) {
                this.currentBGM.play().catch(e => {});
            }
            delete document.body.dataset.gachaBgmPlaying;
        }
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
            targetBGM = this.bgm.lobby; 
        }

        if (targetBGM) {
            this.currentBGM = targetBGM;
            const startBgmInteraction = () => {
                this.log("👉 偵測到全域 pointerdown 事件！嘗試播放 BGM");
                this.currentBGM.play().then(() => {
                    this.log("✅ BGM 播放成功");
                }).catch(e => {
                    this.log("❌ BGM 播放失敗: " + e.message);
                });
                document.removeEventListener('pointerdown', startBgmInteraction);
            };
            document.addEventListener('pointerdown', startBgmInteraction);
        }
    },

    bindMicDucking: function() {
        document.addEventListener('pointerdown', (e) => {
            if (e.target.closest('#record-btn') || e.target.closest('#battle-record-btn')) {
                if (this.currentBGM && !this.currentBGM.paused) {
                    this.currentBGM.pause(); 
                    this.isDucking = true;
                }
            }
        });

        const resumeAudio = (e) => {
            if (this.isDucking && (e.target.closest('#record-btn') || e.target.closest('#battle-record-btn'))) {
                setTimeout(() => {
                    if (this.currentBGM) this.currentBGM.play().catch(e=>{});
                    this.isDucking = false;
                }, 500); 
            }
        };

        document.addEventListener('pointerup', resumeAudio);
        document.addEventListener('pointercancel', resumeAudio);
        document.addEventListener('pointerout', resumeAudio);
    },

    bindClickEvents: function() {
        document.addEventListener('pointerdown', (e) => {
            const target = e.target.closest('button, a, .btn, .btn-dock, .btn-play-pill, .ws-letter, .btn-image-choice');
            const noClickClasses = ['history-btn', 'btn-close-modal', 'btn-glory']; 
            if (target && !target.disabled && !target.classList.contains('disabled') && target.id !== 'record-btn' && target.id !== 'battle-record-btn') {
                const isNoClickClass = noClickClasses.some(cls => target.classList.contains(cls));
                if (target.hasAttribute('data-no-click-sound') || isNoClickClass) {
                    return; 
                }
                this.play('click');
            }
        });
    },

    observeModals: function() {
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

window.GlobalAudio = GlobalAudio;

document.addEventListener('DOMContentLoaded', () => {
    GlobalAudio.init();
});
