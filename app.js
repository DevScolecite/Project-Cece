/* ==========================================================================
   1. GLOBAL STATE & TRACKING KEYS
   ========================================================================== */
const GitHubConfig = {
    get token() { return localStorage.getItem("my_github_token"); }, 
    gistId: "8ca46bae0198e82cbe16ff514e314e06",
    filename: "project_cece_diary.json",
    username: "DevScolecite", 
    repoName: "Project-Cece"     
};

const AppState = {
    isAuthenticated: false,
    defaultPin: "0412",
    currentTheme: "theme-dark",
    editingId: null, 
    logs: [],
    privacyConcealed: false,
    userRole: null
};

const MASTER_PASSCODE = "0412"; 
let pinBuffer = "";
const MAX_PIN_LENGTH = 4;
let activeSfxVol = localStorage.getItem('sfx_volume') !== null ? parseFloat(localStorage.getItem('sfx_volume')) : 0.4;         

// Full Chronological Array Database Fallback
const initialBackupEntries = [
    {
        id: 1,
        title: "Outlook: Senior High School Acquaintance Party Tomorrow",
        date: "2026-07-03",
        month: "july",
        content: "No classes today, pero tomorrow is the Senior High School Acquaintance Party. It's just for Grade 11 and Grade 12. There are only about a hundred students total, plus some new transferees. Since the crowd is going to be pretty small, there's a huge chance na magkikita kami uli. I don't really know how to approach her yet, so I think I'm just gonna go with the flow and see what happens.",
        createdAt: "2026-07-03T09:00:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false,
        isPrivate: false,
        spotifyId: "",
        musicTitle: ""
    },
    {
        id: 2,
        title: "Classroom Teasing Incident",
        date: "2026-07-02",
        month: "july",
        content: "Then just yesterday, July 2, things took a totally different turn from our usual eye contacts. After eating lunch, I was standing up by my seat, fixing my bag and putting away my lunchbox. I was facing the back of the classroom. Chin was at the back right of our room chatting with her friends. Out of nowhere, my classmate Jillian shouted, 'Lance, Lance, hide out!' to tease her. When I looked over, Chin turned around to face me. I initially thought the teasing was about someone else, but when she turned, we locked eyes for three to four seconds. Neither of us broke eye contact. After a few seconds, she walked away to make space for Jillian, who was actually sitting right behind her. Jillian looked so embarrassed because of the teasing, but Chin just kept that natural connection with me the wholetime.",
        createdAt: "2026-07-02T14:15:00.000Z",
        lastEditedAt: null,
        isCoreMemory: true,
        isPrivate: false,
        spotifyId: "",
        musicTitle: ""
    },
    {
        id: 3,
        title: "Unbroken Corridor Eye Contact",
        date: "2026-06-29",
        month: "june",
        content: "Umuulan nung umagang 'yon, kayasa corridor sa harap ng room namin ginawa yung morning assembly. Fast forward to our second afternoon break around 2:00 PM. I usually switch seats to sit next to my close friend during breaks. I was sitting in the middle row, facing the door, when she walked by. She was already looking at me before she even crossed the doorway. As she walked past, she literally turned her head toward me and kept her eyes locked on mine until she disappeared from my view. That was a solid three to four seconds of unbroken eye contact. After that, medyo nagka-gap yung sequence namin kasi I got sick. I was absent nung Friday for the defreezing activity kasi medyo mahiyain ako, and then I caught a stomach ache over the weekend na umabot hanggang Monday.",
        createdAt: "2026-06-29T14:00:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false,
        isPrivate: false,
        spotifyId: "",
        musicTitle: ""
    }
];

/* ==========================================================================
   2. PERSISTENCE STORAGE HANDLING
   ========================================================================== */
function saveToLocalStorage() {
    localStorage.setItem("projectCece_logs_v120", JSON.stringify(AppState.logs));
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem("projectCece_logs_v120");
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                AppState.logs = parsedData.map(log => ({ ...log, isRuntimeUnlocked: false }));
                return;
            }
        }
    } catch (e) {
        console.log("Local sync cache empty or clearing.");
    }
    AppState.logs = initialBackupEntries.map(log => ({ ...log, isRuntimeUnlocked: false }));
}

async function loadFromGist() {
    if (!GitHubConfig.token || !GitHubConfig.gistId) {
        console.warn("Cloud credentials missing. Falling back to local backup entries.");
        loadFromLocalStorage();
        return;
    }

    const url = `https://api.github.com/gists/${GitHubConfig.gistId}?t=${Date.now()}`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${GitHubConfig.token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) throw new Error(`GitHub API returned status: ${response.status}`);
        
        const gistData = await response.json();
        const diaryFile = gistData.files[GitHubConfig.filename];

        if (diaryFile && diaryFile.content) {
            try {
                const parsedCloudData = JSON.parse(diaryFile.content);
                if (Array.isArray(parsedCloudData)) {
                    AppState.logs = parsedCloudData.map(log => ({ ...log, isRuntimeUnlocked: false }));
                    saveToLocalStorage(); 
                    console.log("Cloud sync successful: Live logs pulled and secured from Gist.");
                } else {
                    console.warn("Cloud sync payload is structurally invalid (not an array). Reverting to local cache.");
                    loadFromLocalStorage();
                }
            } catch (parseError) {
                console.error("Failed to parse cloud content string payload:", parseError);
                loadFromLocalStorage();
            }
        } else {
            loadFromLocalStorage();
            await saveToGist();
        }
    } catch (error) {
        console.error("Cloud Fetch Failed. Using local storage backup array:", error);
        loadFromLocalStorage();
    }
}

async function saveToGist() {
    if (!GitHubConfig.token || !GitHubConfig.gistId) {
        showGithubErrorModal();
        return false;
    }

    const url = `https://api.github.com/gists/${GitHubConfig.gistId}`;
    const payload = {
        files: {
            [GitHubConfig.filename]: {
                content: JSON.stringify(AppState.logs, null, 2)
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${GitHubConfig.token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify(payload)
        });

        return response.ok;
    } catch (error) {
        console.error("Cloud Save Failed:", error);
        return false;
    }
}

/* ==========================================================================
   3. APPLICATION RUNTIME INITIALIZATION
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    loadFromLocalStorage();
    updateDashboardMetrics();
    renderTimeline(AppState.logs);
    initPersonalizationControls();
    initFormAudioDropZone(); 

    const initialTokenInput = document.getElementById('githubTokenInput');
    if (initialTokenInput) {
        const savedTokenCache = localStorage.getItem('my_github_token') || '';
        initialTokenInput.value = savedTokenCache;
        
        if (savedTokenCache) {
            const initialStatusText = document.getElementById('tokenStatusText');
            if (initialStatusText) {
                initialStatusText.innerHTML = `<i class="fas fa-check-circle" style="font-size: 0.85rem;"></i> Token active and loaded from cache`;
                initialStatusText.style.color = "#22c55e";
                initialStatusText.style.opacity = "1";
            }
        }
    }

    document.getElementById('globalNav')?.classList.add('hidden');

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.dots-trigger-btn') && !event.target.closest('.action-menu-dropdown')) {
            closeAllActionMenus();
        }
        if (!event.target.closest('.track-option-delete-trigger') && !event.target.closest('.track-context-menu-panel')) {
            document.querySelectorAll(".track-context-menu-panel").forEach(el => el.remove());
        }
    });

    const authPage = document.getElementById('auth-page');
    if (authPage) {
        authPage.classList.add('hidden');
        authPage.style.display = "none";
    }

    const sfxSlider = document.getElementById('sfx-volume');
    const sfxIndicator = document.getElementById('sfx-vol-indicator');
    const sfxToggle = document.getElementById('sfxToggle');
    
    const savedPreference = localStorage.getItem('sfxEnabled');
    if (sfxToggle && savedPreference !== null) {
        sfxToggle.checked = savedPreference === 'true';
    }

    if (sfxSlider) {
        let savedVol = localStorage.getItem('sfx_volume') !== null ? parseFloat(localStorage.getItem('sfx_volume')) : 0.4;
        if (savedVol > 1) savedVol = savedVol / 100;
        savedVol = Math.max(0, Math.min(1, savedVol));

        const sliderMaxBoundary = parseFloat(sfxSlider.max) || 1;
        sfxSlider.value = sliderMaxBoundary > 1 ? savedVol * 100 : savedVol;

        if (sfxIndicator) {
            sfxIndicator.textContent = Math.round(savedVol * 100) + '%';
        }

        const processVolumeUpdate = (rawValue) => {
            let volumeCalculated = parseFloat(rawValue);
            if (isNaN(volumeCalculated)) volumeCalculated = 0.4;
            if (sliderMaxBoundary > 1 || volumeCalculated > 1) volumeCalculated = volumeCalculated / 100;
            volumeCalculated = Math.max(0, Math.min(1, volumeCalculated));

            localStorage.setItem('sfx_volume', volumeCalculated);
            activeSfxVol = volumeCalculated;

            if (sfxIndicator) {
                sfxIndicator.textContent = Math.round(volumeCalculated * 100) + '%';
            }

            for (let key in sfxSounds) {
                if (sfxSounds[key] instanceof Audio) {
                    sfxSounds[key].volume = volumeCalculated;
                }
            }
        };

        sfxSlider.addEventListener('input', (e) => { processVolumeUpdate(e.target.value); });
        sfxSlider.addEventListener('change', () => {
            processVolumeUpdate(sfxSlider.value);
            playSFX('click');
        });
    }

    switchPage('landing-page'); 
});

/* ==========================================================================
   4. GATEWAY SECURITY & NAVIGATION ENGINE
   ========================================================================== */
const CREDENTIALS = {
    master: {
        username: "lnc.gbrl.crisostomo@gmail.com",
        password: "hasacrushoncece"
    },
    visitor: {
        username: "visitor@projectcece.com",
        password: "exploreworkspace"
    }
};

let enteredPin = "";

function showAuthGate() {
    const authPage = document.getElementById('auth-page');
    if (!authPage) return;
    
    // SFX: Triggered when pin interface appears
    try { playSFX('aiStart'); } catch(e) {}

    authPage.classList.remove('hidden');
    authPage.style.display = ""; 
    
    const isRegistered = localStorage.getItem('cece_user_authenticated') === 'true';
    const activeRole = localStorage.getItem('cece_active_role') || 'master';
    AppState.userRole = activeRole;

    if (isRegistered) {
        document.getElementById('auth-stage-login')?.classList.add('hidden');
        document.getElementById('auth-stage-pin')?.classList.remove('hidden');
        
        if (activeRole === 'master') {
            const hasPin = localStorage.getItem('cece_master_pin');
            updateLockscreenStatus(hasPin ? "Enter Master Key" : "Create Your 4-Digit PIN", false);
        } else {
            const hasVisitorPin = localStorage.getItem('cece_visitor_pin');
            updateLockscreenStatus(hasVisitorPin ? "Enter Visitor PIN" : "Create Visitor 4-Digit PIN", false);
        }
    } else {
        document.getElementById('auth-stage-login')?.classList.remove('hidden');
        document.getElementById('auth-stage-pin')?.classList.add('hidden');
    }
}

function handleAccountLogin() {
    const userIn = document.getElementById('loginUsername').value.trim().toLowerCase();
    const passIn = document.getElementById('loginPassword').value;
    const statusText = document.getElementById('login-status-text');

    if (userIn === CREDENTIALS.master.username && passIn === CREDENTIALS.master.password) {
        AppState.userRole = 'master';
        localStorage.setItem('cece_user_authenticated', 'true');
        localStorage.setItem('cece_active_role', 'master');
        
        document.getElementById('auth-stage-login').classList.add('hidden');
        document.getElementById('auth-stage-pin').classList.remove('hidden');
        
        const hasPin = localStorage.getItem('cece_master_pin');
        updateLockscreenStatus(hasPin ? "Enter Master Key" : "Create Your 4-Digit PIN", false);
    } else if (userIn === CREDENTIALS.visitor.username && passIn === CREDENTIALS.visitor.password) {
        AppState.userRole = 'visitor';
        localStorage.setItem('cece_user_authenticated', 'true');
        localStorage.setItem('cece_active_role', 'visitor');
        
        document.getElementById('auth-stage-login').classList.add('hidden');
        document.getElementById('auth-stage-pin').classList.remove('hidden');
        
        const hasVisitorPin = localStorage.getItem('cece_visitor_pin');
        updateLockscreenStatus(hasVisitorPin ? "Enter Visitor PIN" : "Create Visitor 4-Digit PIN", false);
    } else {
        if (statusText) {
            statusText.innerText = "Invalid Credentials. Try Again.";
            statusText.style.color = "#ef4444";
        }
        try { playSFX('error'); } catch(e) {}
    }
}

function pressPinKey(num) {
    if (enteredPin.length >= MAX_PIN_LENGTH) return;
    try { playSFX('click'); } catch(e) {}
    enteredPin += num;
    updatePinDots();
    if (enteredPin.length === MAX_PIN_LENGTH) {
        setTimeout(processPinSubmission, 200);
    }
}

function pressModalPinKey(num) {
    if (modalPinBuffer.length >= 4) return;
    try { playSFX('click'); } catch(e) {}
    
    modalPinBuffer += num;
    const nativeInput = document.getElementById("modalPinInput");
    if (nativeInput) nativeInput.value = modalPinBuffer;
    
    updateModalPinDots();

    if (modalPinBuffer.length === 4) {
        setTimeout(verifyMasterPIN, 150);
    }
}

async function processPinSubmission() {
    const role = AppState.userRole || localStorage.getItem('cece_active_role') || 'master';
    const pinStorageKey = role === 'master' ? 'cece_master_pin' : 'cece_visitor_pin';
    const savedPin = localStorage.getItem(pinStorageKey);
    
    if (!savedPin) {
        localStorage.setItem(pinStorageKey, enteredPin);
        updateLockscreenStatus(`${role === 'master' ? 'Master' : 'Visitor'} PIN Set Success!`, false);
        try { playSFX('star'); } catch(e) {}
        await unlockApplication();
    } else {
        if (enteredPin === savedPin) {
            updateLockscreenStatus(role === 'master' ? "Welcome back, Lance!" : "Visitor Session Granted", false);
            try { playSFX('star'); } catch(e) {}
            await unlockApplication();
        } else {
            updateLockscreenStatus("Access Denied. Incorrect PIN.", true);
            triggerShakeAnimation();
            try { playSFX('error'); } catch(e) {}
            clearPin();
        }
    }
}

function switchAuthUser() {
    localStorage.removeItem('cece_user_authenticated');
    localStorage.removeItem('cece_active_role');
    AppState.userRole = null;
    clearPin();
    document.getElementById('auth-stage-pin').classList.add('hidden');
    document.getElementById('auth-stage-login').classList.remove('hidden');
    const statusText = document.getElementById('login-status-text');
    if (statusText) statusText.innerText = "";
}

function showLogoutModal() {
    const overlay = document.getElementById('logout-modal-overlay');
    if (!overlay) return;
    try { playSFX('aiStart'); } catch(e) {} 
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '1';
        const card = overlay.querySelector('.dialog-card-surface');
        if (card) card.style.transform = 'scale(1)';
    }, 20);
}

function closeLogoutModal() {
    const overlay = document.getElementById('logout-modal-overlay');
    if (!overlay) return;
    try { playSFX('swishClose'); } catch(e) {} 
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    
    const card = overlay.querySelector('.dialog-card-surface');
    if (card) card.style.transform = 'scale(0.92)';
    
    setTimeout(() => { 
        overlay.style.display = 'none'; 
        overlay.style.pointerEvents = ''; 
    }, 200);
}

function executeLogout() {
    try {
        try { playSFX('delete'); } catch(e) {} 
        closeLogoutModal();
        
        AppState.isAuthenticated = false;
        AppState.userRole = null;
        AppState.logs = []; 
        
        localStorage.removeItem('cece_user_authenticated');
        localStorage.removeItem('cece_active_role');
        clearPin();
        
        document.getElementById('globalNav')?.classList.add('hidden');
        const authPage = document.getElementById('auth-page');
        if (authPage) {
            authPage.style.display = "none"; 
            authPage.classList.add('hidden'); 
            authPage.classList.remove('auth-success-fade'); 
        }
        switchPage('landing-page');
    } catch (error) {
        console.error("Error during logout navigation:", error);
        window.location.reload();
    }
}

async function unlockApplication() {
    const authPage = document.getElementById('auth-page');
    AppState.isAuthenticated = true;

    const keypad = document.querySelector('.custom-keypad');
    const dotsContainer = document.querySelector('.pin-dots-container');
    if (keypad) keypad.style.opacity = "0";
    if (dotsContainer) dotsContainer.style.opacity = "0";

    await loadFromGist(); 

    setTimeout(() => {
        document.getElementById('globalNav')?.classList.remove('hidden');
        renderTimeline(AppState.logs);
        updateDashboardMetrics();
        enforceRolePermissions(); 
        switchPage('logs-page'); 
        if (authPage) authPage.classList.add('auth-success-fade');
    }, 600); 

    setTimeout(() => {
        if (authPage) {
            authPage.classList.add('hidden');
            authPage.classList.remove('auth-success-fade');
            authPage.style.display = "none";
        }
        if (keypad) keypad.style.opacity = "1";
        if (dotsContainer) dotsContainer.style.opacity = "1";
        clearPin();
    }, 1200);
}

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        if (index < enteredPin.length) dot.classList.add('filled');
        else dot.classList.remove('filled');
    });
}

function clearPin() { enteredPin = ""; updatePinDots(); }
function backspacePin() { if (enteredPin.length > 0) { enteredPin = enteredPin.slice(0, -1); updatePinDots(); } }
function updateLockscreenStatus(message, isError) {
    const statusText = document.getElementById('lockscreen-status');
    if (statusText) { statusText.textContent = message; statusText.style.color = isError ? "#ef4444" : "#64748b"; }
}
function triggerShakeAnimation() {
    const container = document.querySelector('.pin-dots-container, .modal-pin-display');
    if (container) { container.style.animation = 'none'; container.offsetHeight; container.style.animation = 'shake 0.35s ease'; }
}

/* ==========================================================================
   5. NAVIGATION ENGINE & DRAWER
   ========================================================================= */
function switchPage(pageId) {
    console.log(`[Router] Navigating to view: #${pageId}`);
    const pages = document.querySelectorAll('.app-page');
    
    pages.forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active');
        page.style.display = ''; 
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active');
        window.scrollTo(0, 0); 
    } else {
        console.error(`Page Identity View "${pageId}" not found in HTML DOM structure.`);
    }
}

function toggleDrawer(action) {
    const drawer = document.getElementById('sideDrawer') || document.getElementById('navDrawer') || document.getElementById('globalNavLinks');
    if (!drawer) return;

    if (action === false) {
        drawer.classList.remove('drawer-open');
    } else if (action === true) {
        drawer.classList.add('drawer-open');
    } else {
        const isOpen = drawer.classList.toggle('drawer-open');
        try { playSFX(isOpen ? 'swishOpen' : 'swishClose'); } catch(e) {}
    }
}

function handleSfxToggle(checkbox) {
    localStorage.setItem('sfxEnabled', checkbox.checked);
}

function navigateFromMenu(targetFrame) {
    try { playSFX('click'); } catch(e) {}
    switchPage(`${targetFrame}-page`);
    toggleDrawer(false); 
}

/* ==========================================================================
   6. METRICS DASHBOARD REFRESH
   ========================================================================== */
function updateDashboardMetrics() {
    const totalLogsEl = document.getElementById("statTotalLogs");
    const coreMemsEl = document.getElementById("statCoreMemories");
    if (totalLogsEl) totalLogsEl.innerText = AppState.logs.length;
    if (coreMemsEl) coreMemsEl.innerText = AppState.logs.filter(l => l.isCoreMemory).length;
}

/* ==========================================================================
   7. INTERACTIVE TIMELINE ENGINE RENDERING (WITH CENTERED PIN WRAPPERS)
   ========================================================================== */
function renderTimeline(dataArray) {
    const container = document.getElementById("timelineContainer");
    if (!container) return;

    container.innerHTML = "";

    if (!dataArray || dataArray.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No logs found.</p>`;
        return;
    }

    const sortedData = [...dataArray].sort((a, b) => new Date(b.date) - new Date(a.date));
    const isConcealed = AppState && AppState.privacyConcealed;

    sortedData.forEach((item, index) => {
        const timelineItem = document.createElement("div");
        timelineItem.className = "timeline-item animate-slide-up";
        timelineItem.style.animationDelay = `${index * 0.04}s`;

        const isLocked = item.isPrivate && !item.isRuntimeUnlocked;
        const shouldBlurCard = isLocked || isConcealed;
        const cardBlurClass = shouldBlurCard ? "private-card-locked" : "";
        const memoryGlowClass = item.isCoreMemory ? "core-memory-active" : "";

        let publishedDateFormatted = formatDisplayDate(item.date);
        let updateStampMark = '';
        if (item.lastEditedAt) {
            const editDate = new Date(item.lastEditedAt);
            if (!isNaN(editDate.getTime())) {
                updateStampMark = `<div class="timestamp-node-stamp">| Last edited: <span>${editDate.toLocaleDateString("en-US", {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span></div>`;
            }
        }

        let audioPlayerMarkup = "";
        if (item.spotifyId && item.spotifyId.trim().length > 0 && !shouldBlurCard) {
            let filenameTimeline = item.musicTitle && item.musicTitle.trim().length > 0 ? item.musicTitle.trim() : "";
            if (!filenameTimeline) {
                try {
                    const urlParts = item.spotifyId.trim().split('/');
                    const rawName = urlParts[urlParts.length - 1];
                    filenameTimeline = decodeURIComponent(rawName).replace(/^\d+_+/, '');
                } catch(e) {
                    filenameTimeline = "Workspace Track";
                }
            }

            audioPlayerMarkup = `
                <div class="timeline-audio-card-capsule" onclick="handleFeedAudioPlay('${item.id}', '${item.spotifyId.trim()}', event)" style="margin-top: 14px; padding: 12px 20px; background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 100px; display: flex; align-items: center; justify-content: space-between; font-size: 0.86rem; color: var(--text-main); width: 100%; box-shadow: 0 2px 8px var(--shadow-color); box-sizing: border-box; cursor: pointer; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;">
                    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
                        <span style="color: var(--primary); font-size: 1rem;"><i class="fas fa-music"></i></span>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600;">${filenameTimeline}</span>
                    </div>
                    <div id="feedPlayBtn-${item.id}" style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 0.8rem; transition: transform 0.1s ease;">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            `;
        }

        let actionMenuMarkup = "";
        if (!shouldBlurCard) {
            actionMenuMarkup = `
                <div style="position: relative; display: inline-block;">
                    <button class="dots-trigger-btn" type="button" onclick="toggleActionMenu('${item.id}', event)">⋯</button>
                    <div id="dropdown-${item.id}" class="action-menu-dropdown" onclick="event.stopPropagation()">
                        <button type="button" onclick="prepareEditForm('${item.id}', event)"><i class="fas fa-edit" style="margin-right: 6px;"></i> Edit Entry</button>
                        <button type="button" onclick="toggleCoreMemoryState('${item.id}', event)"><i class="${item.isCoreMemory ? 'fas' : 'far'} fa-star" style="margin-right: 6px;"></i> ${item.isCoreMemory ? 'Unstar Core' : 'Star Core Memory'}</button>
                        <button type="button" class="delete-action-btn" onclick="deleteEntry('${item.id}', event)"><i class="fas fa-trash-alt" style="margin-right: 6px;"></i> Delete Log</button>
                    </div>
                </div>
            `;
        }

        timelineItem.innerHTML = `
            <div class="timeline-left">
                <div class="timeline-date">${publishedDateFormatted}</div>
            </div>
            <div class="timeline-badge"></div>
            <div class="timeline-right" style="position: relative;">
                <div class="timeline-body-card ${memoryGlowClass} ${cardBlurClass}">
                    
                    <div class="timeline-card-blur-capture-layer">
                        <div class="timeline-header-wrapper" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div class="timeline-title" style="margin-bottom: 0; flex: 1;">${item.title}</div>
                            ${actionMenuMarkup}
                        </div>
                        
                        <div class="text-narrative-container" onclick="handleTimelineCardClick('${item.id}', event)">
                            <div class="timeline-text-content">${item.content}</div>
                            <div class="read-more-indicator"><i class="fas fa-chevron-down" style="font-size: 0.8rem; margin-right: 4px;"></i> Read More</div>
                        </div>

                        ${audioPlayerMarkup}

                        <div class="timestamp-matrix-row">
                            <div class="timestamp-node-stamp">Published: <span>${publishedDateFormatted}</span></div>
                            ${updateStampMark}
                        </div>
                    </div>

                    ${shouldBlurCard ? `
                    <!-- 🛠️ FIXED LOCK LAYER: Transformed with absolute positioning and flexbox to frame text to the exact dead center -->
                    <div class="private-card-lock-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.02); backdrop-filter: blur(0px); border-radius: inherit; margin-top: 0; cursor: pointer; z-index: 10;" onclick="handleTimelineCardClick('${item.id}', event)">
                        <div class="lock-overlay-badge" style="display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--input-bg, #1e293b); border: 1px solid var(--border-color); border-radius: 50px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); pointer-events: none;">
                            <i class="fas fa-lock" style="font-size: 0.88rem; color: var(--primary);"></i>
                            <span style="font-weight: 700; font-size: 0.82rem; letter-spacing: 0.3px; color: var(--text-main);">Protected Entry</span>
                        </div>
                    </div>` : ''}

                </div>
            </div>
        `;
        container.appendChild(timelineItem);
    });
}

/* ==========================================================================
   🎵 TIMELINE FEED AUDIO CONTROLLER CORE SYSTEM
   ========================================================================== */
let globalFeedAudioEngine = null;
let currentPlayingFeedId = null;

function handleFeedAudioPlay(id, trackUrl, event) {
    event.stopPropagation(); 

    if (window.activeLocalBgmNode) {
        window.activeLocalBgmNode.pause();
        window.activeLocalBgmNode = null;
    }

    const targetedBtn = document.getElementById(`feedPlayBtn-${id}`);

    if (currentPlayingFeedId === id && globalFeedAudioEngine) {
        if (!globalFeedAudioEngine.paused) {
            globalFeedAudioEngine.pause();
            if (targetedBtn) targetedBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            globalFeedAudioEngine.play();
            if (targetedBtn) targetedBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        return;
    }

    if (globalFeedAudioEngine) {
        globalFeedAudioEngine.pause();
        const pastActiveBtn = document.getElementById(`feedPlayBtn-${currentPlayingFeedId}`);
        if (pastActiveBtn) pastActiveBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    globalFeedAudioEngine = new Audio(trackUrl);
    globalFeedAudioEngine.volume = 0.7;
    currentPlayingFeedId = id;
    window.activeLocalBgmNode = globalFeedAudioEngine;

    globalFeedAudioEngine.play()
        .then(() => { if (targetedBtn) targetedBtn.innerHTML = '<i class="fas fa-pause"></i>'; })
        .catch(() => { if (targetedBtn) targetedBtn.innerHTML = '<i class="fas fa-play"></i>'; });

    globalFeedAudioEngine.addEventListener("ended", () => {
        if (targetedBtn) targetedBtn.innerHTML = '<i class="fas fa-play"></i>';
        currentPlayingFeedId = null;
        globalFeedAudioEngine = null;
    });
}

/* ==========================================================================
   🔒 INTERACTIVE MODAL ENTRY LOCK CONTROLS
   ========================================================================== */
let modalPinBuffer = "";
let currentTargetLogId = null; 
let currentTargetMode = "reveal"; 

function handleTimelineCardClick(id, event) {
    if (event.target.closest('.dots-trigger-btn') || event.target.closest('.action-menu-dropdown') || event.target.closest('.timeline-audio-card-capsule')) return;
    
    const selectedMemory = AppState.logs.find(log => log.id == id);
    if (selectedMemory) {
        if (selectedMemory.isPrivate && !selectedMemory.isRuntimeUnlocked) {
            openPinModalForLog(id, "reveal");
        } else {
            openEntryModal(id);
        }
    }
}

function openPinModalForLog(logId, mode = "reveal") {
    currentTargetLogId = logId;
    currentTargetMode = mode;
    clearModalPin(); 
    
    const errNode = document.getElementById("pinErrorMessage");
    const modalNode = document.getElementById("pinVerificationModal");
     // SFX: Triggered when log-pin modal appears
    try { playSFX('aiStart'); } catch(e) {}
    if (errNode) errNode.style.display = "none";
    if (modalNode) {
        modalNode.style.display = "flex";
        modalNode.classList.remove("hidden");
    }
}

function clearModalPin() {
    modalPinBuffer = "";
    const nativeInput = document.getElementById("modalPinInput");
    if (nativeInput) nativeInput.value = "";
    updateModalPinDots();
}

function backspaceModalPin() {
    if (modalPinBuffer.length > 0) {
        modalPinBuffer = modalPinBuffer.slice(0, -1);
        const nativeInput = document.getElementById("modalPinInput");
        if (nativeInput) nativeInput.value = modalPinBuffer;
        updateModalPinDots();
        try { playSFX('click'); } catch(e) {}
    }
}

function updateModalPinDots() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`mpd-${i}`);
        if (dot) {
            if (i <= modalPinBuffer.length) dot.classList.add('filled');
            else dot.classList.remove('filled');
        }
    }
}

function closePinModal() {
    const modalNode = document.getElementById("pinVerificationModal");
    if (modalNode) modalNode.style.display = "none";
    clearModalPin();
}

function verifyMasterPIN() {
    const savedMasterPin = localStorage.getItem('cece_master_pin') || MASTER_PASSCODE;
    const errorAlertNode = document.getElementById("pinErrorMessage");

    if (modalPinBuffer === savedMasterPin.toString()) {
        try { playSFX('star'); } catch(e) {}
        if (errorAlertNode) errorAlertNode.style.display = "none";
        
        if (currentTargetLogId) {
            AppState.logs = AppState.logs.map(log => {
                if (log.id == currentTargetLogId) {
                    return { ...log, isRuntimeUnlocked: true };
                }
                return log;
            });
        }
        
        renderTimeline(AppState.logs);
        
        if (currentTargetMode === "reveal") {
            // Repaint sync execution complete
        } else if (currentTargetMode === "edit") {
            executeActualEditForm(currentTargetLogId);
        } else if (currentTargetMode === "capsule") {
            executeActualCapsuleDisplay(currentTargetLogId);
        }
        
        closePinModal();
    } else {
        try { playSFX('delete'); } catch(e) {}
        if (errorAlertNode) errorAlertNode.style.display = "block";
        triggerShakeAnimation();
        clearModalPin(); 
    }
}

/* ==========================================================================
   10. FLOATING CARD MODAL ENGINE
   ========================================================================== */
function openEntryModal(id) {
    const selectedMemory = AppState.logs.find(log => log.id == id);
    if (!selectedMemory) return;

    document.getElementById('modalEntryTitle').innerText = selectedMemory.title;
    document.getElementById('modalEntryBody').innerText = selectedMemory.content;

    const selectorsToFlush = ['.spotify-embed-wrapper', '.song-playing-card', '#modalTrackTopIndicator', '.custom-audio-capsule-wrapper', '#modalNowPlayingCard'];
    selectorsToFlush.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    });

    if (window.activeLocalBgmNode) {
        window.activeLocalBgmNode.pause();
        window.activeLocalBgmNode = null;
    }

    const modalDateEl = document.getElementById('modalEntryDate');
    if (modalDateEl) {
        const targetDate = selectedMemory.createdAt || selectedMemory.date;
        let formattedDate = formatDisplayDate(selectedMemory.date);
        if (targetDate) {
            const parsed = new Date(targetDate);
            if (!isNaN(parsed.getTime())) {
                formattedDate = parsed.toLocaleDateString("en-US", {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
            }
        }
        modalDateEl.innerText = formattedDate;
    }

    const tagNode = document.getElementById('modalEntryTag');
    if (tagNode) {
        tagNode.innerHTML = selectedMemory.isCoreMemory ? `<i class="fas fa-star" style="font-size: 0.85rem; margin-right: 4px;"></i> CORE MEMORY` : `<i class="fas fa-history" style="font-size: 0.85rem; margin-right: 4px;"></i> TIMELINE NARRATIVE`;
        tagNode.style.color = selectedMemory.isCoreMemory ? "#60a5fa" : "var(--primary)";
    }

    if (selectedMemory.spotifyId && selectedMemory.spotifyId.trim().length > 0) {
        const trackTarget = selectedMemory.spotifyId.trim();
        let filename = selectedMemory.musicTitle && selectedMemory.musicTitle.trim().length > 0 ? selectedMemory.musicTitle.trim() : "";
        
        if (!filename) {
            try {
                const urlParts = trackTarget.split('/');
                const rawName = urlParts[urlParts.length - 1];
                filename = decodeURIComponent(rawName).replace(/^\d+_+/, '');
            } catch(e) {
                filename = "Workspace Audio Track";
            }
        }

        const capsuleWrapper = document.createElement('div');
        capsuleWrapper.className = 'custom-audio-capsule-wrapper';
        capsuleWrapper.style = 'width: 100%; max-width: 100%; margin: 14px 0 20px 0; display: block; box-sizing: border-box;';

        capsuleWrapper.innerHTML = `
            <div class="audio-capsule-surface" style="padding: 12px 20px; border-radius: 100px; border: 1px solid var(--border-color); background: var(--input-bg); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 14px var(--shadow-color); box-sizing: border-box; width: 100%;">
                <div class="capsule-title-zone" style="display: flex; align-items: center; gap: 12px; font-size: 0.88rem; font-weight: 600; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 78%;">
                    <span style="font-size: 1rem; color: var(--primary); display: flex; align-items: center;"><i class="fas fa-music"></i></span>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${filename}</span>
                </div>
                <button id="capsulePlayActionBtn" type="button" style="background: var(--primary); color: #ffffff; border: none; outline: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s ease, opacity 0.2s; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15); padding: 0;"><i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i></button>
            </div>
            <audio id="diaryCloudAudioEngine" style="display: none;">
                <source src="${trackTarget}" type="audio/mpeg">
            </audio>
        `;
        
        if (modalDateEl) {
            modalDateEl.parentNode.insertBefore(capsuleWrapper, modalDateEl.nextSibling);
        } else {
            const modalTitleNode = document.getElementById('modalEntryTitle');
            if (modalTitleNode) modalTitleNode.parentNode.insertBefore(capsuleWrapper, modalTitleNode.nextSibling);
        }

        const nativeEngine = document.getElementById("diaryCloudAudioEngine");
        const playToggleBtn = document.getElementById("capsulePlayActionBtn");
        window.activeLocalBgmNode = nativeEngine; 

        if (nativeEngine && playToggleBtn) {
            nativeEngine.volume = 0.7; 

            playToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (nativeEngine.paused) {
                    nativeEngine.play();
                    playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 1.25rem; display: block;"></i>';
                } else {
                    nativeEngine.pause();
                    playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i>';
                }
            });

            nativeEngine.addEventListener("ended", () => {
                playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i>';
            });

            nativeEngine.play()
                .then(() => { playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 1.25rem; display: block;"></i>'; })
                .catch(err => { playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i>'; });
        }
    }

    const detailModal = document.getElementById('entryDetailModalOverlay');
    if (detailModal) {
        detailModal.classList.remove('hidden');
        detailModal.style.display = 'flex';
        detailModal.style.zIndex = '999999'; 
        try { playSFX('popup'); } catch(e) {}
    }
}

function closeEntryModal() {
    if (window.activeLocalBgmNode) {
        window.activeLocalBgmNode.pause();
        window.activeLocalBgmNode = null;
    }
    const detailModal = document.getElementById('entryDetailModalOverlay');
    if (detailModal) {
        detailModal.classList.add('hidden');
        detailModal.style.display = 'none';
        try { playSFX('swishClose'); } catch(e) {}
    }
}

function handleOutsideClick(event) {
    const detailModal = document.getElementById('entryDetailModalOverlay');
    if (event.target === detailModal) closeEntryModal();
}

/* ==========================================================================
   11. DIARY ENTRY LOG MANAGEMENT
   ========================================================================== */
function closeAllActionMenus() {
    document.querySelectorAll(".action-menu-dropdown").forEach(dropdown => {
        dropdown.classList.remove("open-active");
        const itemContainer = dropdown.closest('.timeline-item');
        if (itemContainer) itemContainer.style.zIndex = "";
    });
}

function toggleActionMenu(id, event) {
    if (event) event.stopPropagation();
    const targetDropdown = document.getElementById(`dropdown-${id}`);
    const isCurrentlyOpen = targetDropdown ? targetDropdown.classList.contains("open-active") : false;
    
    closeAllActionMenus();
    
    if (targetDropdown && !isCurrentlyOpen) {
        targetDropdown.classList.add("open-active");
        const itemContainer = targetDropdown.closest('.timeline-item');
        if (itemContainer) {
            itemContainer.style.zIndex = "100";
        }
        playSFX('popup');
    }
}

function filterTimelineByMonth() {
    playSFX('click');
    const filterValue = document.getElementById("monthFilter").value;
    if (filterValue === "all") {
        renderTimeline(AppState.logs);
    } else {
        const filtered = AppState.logs.filter(log => log.month === filterValue);
        renderTimeline(filtered);
    }
}

function prepareCreateForm() {
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }

    AppState.editingId = null;
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0]; 
    
    if (document.getElementById('eventSpotifyId')) document.getElementById('eventSpotifyId').value = ''; 
    if (document.getElementById('eventMusicTitle')) document.getElementById('eventMusicTitle').value = ''; 
    
    const contentField = document.getElementById('eventContent');
    if (contentField) contentField.value = '';
    
    const privacyCheckbox = document.getElementById('eventPrivacy');
    if (privacyCheckbox) privacyCheckbox.checked = false;
    
    const formTitle = document.getElementById('formPageTitle');
    if (formTitle) formTitle.textContent = 'Add New Entry';
    
    refreshMusicDropdown("");
    switchPage('create-log-page');
}

function prepareEditForm(logId, event) {
    if (event) event.stopPropagation();
    closeAllActionMenus();

    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }

    const targetLog = AppState.logs.find(item => item.id == logId);
    if (!targetLog) return;
    
    if (targetLog.isPrivate && !targetLog.isRuntimeUnlocked) {
        openPinModalForLog(logId, "edit");
        return; 
    }
    executeActualEditForm(logId);
}

function executeActualEditForm(logId) {
    const targetLog = AppState.logs.find(item => item.id == logId);
    if (!targetLog) return;

    AppState.editingId = Number(logId);
    
    const formTitle = document.getElementById('formPageTitle');
    if (formTitle) formTitle.textContent = 'Edit Entry';
    
    document.getElementById('eventTitle').value = targetLog.title || '';
    document.getElementById('eventDate').value = targetLog.date || '';
    
    if (document.getElementById('eventSpotifyId')) document.getElementById('eventSpotifyId').value = targetLog.spotifyId || ''; 
    if (document.getElementById('eventMusicTitle')) document.getElementById('eventMusicTitle').value = targetLog.musicTitle || ''; 
    
    const contentField = document.getElementById('eventContent');
    if (contentField) contentField.value = targetLog.content || '';
    
    const privacyCheckbox = document.getElementById('eventPrivacy');
    if (privacyCheckbox) privacyCheckbox.checked = targetLog.isPrivate || false;
    
    refreshMusicDropdown(targetLog.spotifyId || "");
    switchPage('create-log-page');
}

async function publishNewEvent() {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const content = document.getElementById('eventContent').value.trim();
    const isPrivate = document.getElementById('eventPrivacy').checked;

    const musicUrl = document.getElementById('eventSpotifyId') ? document.getElementById('eventSpotifyId').value.trim() : "";
    const customMusicTitle = document.getElementById('eventMusicTitle') ? document.getElementById('eventMusicTitle').value.trim() : "";

    if (!title || !content) {
        alert("Please write a title and content for your entry first.");
        return;
    }

    const dateObj = new Date(date);
    const monthsMatrix = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const parsedMonthStr = !isNaN(dateObj.getTime()) ? monthsMatrix[dateObj.getMonth()] : "july";

    if (AppState.editingId !== null) {
        AppState.logs = AppState.logs.map(log => {
            if (log.id == AppState.editingId) {
                return {
                    ...log,
                    title: title,
                    date: date,
                    month: parsedMonthStr,
                    content: content,
                    spotifyId: musicUrl,
                    musicTitle: customMusicTitle, 
                    isPrivate: isPrivate,
                    lastEditedAt: new Date().toISOString()
                };
            }
            return log;
        });
        AppState.editingId = null;
    } else {
        const newLogItem = {
            id: Date.now(),
            title: title,
            date: date,
            month: parsedMonthStr,
            content: content,
            createdAt: new Date().toISOString(),
            lastEditedAt: null,
            isCoreMemory: false,
            isPrivate: isPrivate,
            spotifyId: musicUrl,
            musicTitle: customMusicTitle 
        };
        AppState.logs.push(newLogItem);
    }

    saveToLocalStorage();
    updateDashboardMetrics();
    try { playSFX('publish'); } catch(e){}

    await saveToGist();
    
    renderTimeline(AppState.logs);
    const filterDropdown = document.getElementById("monthFilter");
    if (filterDropdown) filterDropdown.value = "all";

    switchPage('logs-page');
}

async function deleteEntry(id, event) {
    if (event) event.stopPropagation();
    closeAllActionMenus();

    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }

    if (confirm("Are you sure you want to completely erase this memory entry?")) {
        AppState.logs = AppState.logs.filter(log => log.id != id);
        saveToLocalStorage();
        updateDashboardMetrics();
        try { playSFX('delete'); } catch(e){}
        await saveToGist();
        filterTimelineByMonth();
    }
}

async function toggleCoreMemoryState(id, event) {
    if (event) event.stopPropagation();
    closeAllActionMenus();

    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }

    AppState.logs = AppState.logs.map(log => {
        if (log.id == id) return { ...log, isCoreMemory: !log.isCoreMemory };
        return log;
    });
    
    saveToLocalStorage();
    updateDashboardMetrics();
    try { playSFX('star'); } catch(e){}
    await saveToGist();
    filterTimelineByMonth();
}

/* ==========================================================================
   12. INTERACTIVE RANDOM CAPSULE MECHANISMS
   ========================================================================== */
function launchRandomMemoryCapsule() {
    if (!AppState || !AppState.logs || AppState.logs.length === 0) {
        alert("Your timeline capsule is currently empty.");
        return;
    }
    if (AppState.privacyConcealed) {
        alert("Privacy Concealment Active: Please deactivate privacy mode to open memory flashback capsules.");
        return;
    }

    const randomIndex = Math.floor(Math.random() * AppState.logs.length);
    const selectedMemory = AppState.logs[randomIndex];

    executeActualCapsuleDisplay(selectedMemory.id);
}

function executeActualCapsuleDisplay(entryId) {
    const selectedMemory = AppState.logs.find(log => log.id == entryId);
    if (!selectedMemory) return;

    const modalOverlay = document.getElementById("flashbackModal");
    const modalCard = modalOverlay ? modalOverlay.querySelector(".modal-card") : null;
    if (!modalCard) return;

    modalCard.classList.remove("private-card-locked");
    modalCard.style.position = "relative";
    modalCard.style.overflow = "hidden";
    modalCard.querySelectorAll('.private-card-lock-overlay, .custom-audio-capsule-wrapper, #modalNowPlayingCard').forEach(el => el.remove());

    const isLocked = selectedMemory.isPrivate && !selectedMemory.isRuntimeUnlocked;

    document.getElementById("flashbackTitle").innerText = selectedMemory.title;
    document.getElementById("flashbackDate").innerText = new Date(selectedMemory.date).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const narrativeTextNode = document.getElementById("flashbackContent");
    if (narrativeTextNode) narrativeTextNode.innerText = selectedMemory.content;

    if (window.activeLocalBgmNode) {
        window.activeLocalBgmNode.pause();
        window.activeLocalBgmNode = null;
    }

    if (selectedMemory.spotifyId && selectedMemory.spotifyId.trim().length > 0 && !isLocked) {
        const trackTarget = selectedMemory.spotifyId.trim();
        let filename = selectedMemory.musicTitle && selectedMemory.musicTitle.trim().length > 0 ? selectedMemory.musicTitle.trim() : "";
        
        if (!filename) {
            try {
                const urlParts = trackTarget.split('/');
                filename = decodeURIComponent(urlParts[urlParts.length - 1]).replace(/^\d+_+/, '');
            } catch(e) {
                filename = "Flashback Track";
            }
        }

        const capsuleWrapper = document.createElement('div');
        capsuleWrapper.className = 'custom-audio-capsule-wrapper';
        capsuleWrapper.style = 'width: 100%; max-width: 100%; margin: 14px 0 20px 0; display: block; box-sizing: border-box;';
        
        capsuleWrapper.innerHTML = `
            <div class="audio-capsule-surface" style="padding: 12px 20px; border-radius: 100px; border: 1px solid var(--border-color); background: var(--input-bg); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 14px var(--shadow-color); box-sizing: border-box; width: 100%;">
                <div class="capsule-title-zone" style="display: flex; align-items: center; gap: 12px; font-size: 0.88rem; font-weight: 600; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 78%;">
                    <span style="font-size: 1rem; color: var(--primary); display: flex; align-items: center;"><i class="fas fa-music"></i></span>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${filename}</span>
                </div>
                <button id="flashbackPlayActionBtn" type="button" style="background: var(--primary); color: #ffffff; border: none; outline: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s ease, opacity 0.2s; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15); padding: 0;"><i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i></button>
            </div>
            <audio id="flashbackAudioEngine" style="display: none;"><source src="${trackTarget}" type="audio/mpeg"></audio>
        `;

        if (narrativeTextNode) {
            narrativeTextNode.parentNode.insertBefore(capsuleWrapper, narrativeTextNode);
        }

        const nativeEngine = document.getElementById("flashbackAudioEngine");
        const playToggleBtn = document.getElementById("flashbackPlayActionBtn");
        window.activeLocalBgmNode = nativeEngine;

        if (nativeEngine && playToggleBtn) {
            nativeEngine.volume = 0.7;

            playToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (nativeEngine.paused) {
                    nativeEngine.play();
                    playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 1.25rem; display: block;"></i>';
                } else {
                    nativeEngine.pause();
                    playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i>';
                }
            });

            nativeEngine.addEventListener("ended", () => {
                playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i>';
            });

            nativeEngine.play()
                .then(() => { playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 1.25rem; display: block;"></i>'; })
                .catch(() => { playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 1.25rem; display: block;"></i>'; });
        }
    }
    
    if (isLocked) {
        modalCard.classList.add("private-card-locked");
        
        const lockOverlay = document.createElement("div");
        lockOverlay.className = "private-card-lock-overlay";
        // 🛠️ FIXED FLASHBACK LOCK DISPLAY: Transformed container bounds with flexbox logic to center badge flawlessly
        lockOverlay.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.02); z-index: 10; cursor: pointer; margin-top: 0;";
        lockOverlay.onclick = (e) => {
            e.stopPropagation();
            openPinModalForLog(selectedMemory.id, "capsule");
        };
        
        lockOverlay.innerHTML = `
            <div class="lock-overlay-badge" style="display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--input-bg, #1e293b); border: 1px solid var(--border-color); border-radius: 50px; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">
                <i class="fas fa-lock" style="font-size: 0.88rem; color: var(--primary);"></i>
                <span style="font-weight: 700; color: var(--text-main); font-size: 0.82rem;">Protected Entry</span>
            </div>
        `;
        modalCard.appendChild(lockOverlay);
    }

    if (modalOverlay) {
        modalOverlay.classList.remove("hidden");
        modalOverlay.style.display = "flex"; 
    }
    playSFX('popup');
}

function closeFlashbackModal() {
    if (window.activeLocalBgmNode) {
        window.activeLocalBgmNode.pause();
        window.activeLocalBgmNode = null;
    }
    const flashbackModalFrame = document.getElementById("flashbackModal");
    if (flashbackModalFrame) {
        flashbackModalFrame.classList.add("hidden");
        flashbackModalFrame.style.display = "none";
    }
    playSFX('swishClose');
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return "N/A";
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) return "N/A";
    return parsedDate.toLocaleDateString("en-US", { month: 'short', day: '2-digit' });
}

async function improveWithAI() {
    const contentField = document.getElementById("eventContent");
    const originalText = contentField.value;

    let savedKey = localStorage.getItem("my_openrouter_key");
    if (!savedKey) {
        const userKey = prompt("Enter your OpenRouter API Key once:");
        if (userKey) {
            localStorage.setItem("my_openrouter_key", userKey.trim());
            savedKey = userKey.trim();
        } else {
            return; 
        }
    }

    if (!originalText.trim()) {
        alert("Write down a memory first before polishing!");
        return;
    }

    playSFX('aiStart');
    const aiButton = document.querySelector("button[onclick='improveWithAI()']");
    const originalBtnText = aiButton.innerHTML;
    aiButton.innerHTML = `<i class="fas fa-magic"></i> Polishing text...`;
    aiButton.disabled = true;

    try {
        const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${savedKey}`,
                "HTTP-Referer": "https://localhost:3000", 
                "X-Title": "Project Cece"
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b:free", 
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant built into 'Project Cece', a secure personal workspace diary. Your job is to fix the conversational grammar, clear up typos, and smooth out the flow of the diary entry provided. CRITICAL RULES:\n1. Use a natural 'Taglish' code-switching style with a balance of roughly 70% English and 30% Tagalog.\n2. Do NOT use Em dashes (—) anywhere in the text. Use standard punctuation or rewrite the transition naturally.\n3. Humanize the text so it sounds like a real person writing a raw internal monologue or talking out loud to a peer. Avoid sounding stiff or overly formal.\n4. Keep the writer's authentic tone and specific narrative details exactly as provided.\n5. Reply ONLY with the corrected diary text. Do not add any greeting, intro, conversational commentary, or quotation marks around the result."
                    },
                    { role: "user", content: originalText }
                ]
            })
        });

        if (!response.ok) throw new Error(`Server returned response status: ${response.status}`);

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
            contentField.value = data.choices[0].message.content.trim();
            playSFX('aiSuccess');
        } else {
            throw new Error("Invalid API Response structural tree.");
        }
    } catch (error) {
        alert("OpenRouter Integration Failure: " + error.message);
    } finally {
        aiButton.innerHTML = originalBtnText;
        aiButton.disabled = false;
    }
}

/* ==========================================================================
   13. PERSONALIZATION INTERFACE ENGINE (THEMES & TYPOGRAPHY)
   ========================================================================== */
function toggleThemeGridDropdown(event) {
    if (event) event.stopPropagation();
    const dropdownPanel = document.getElementById("themeGridDropdownContainer");
    const triggerBtn = document.getElementById("themeDropdownGridBtn");
    
    if (dropdownPanel) {
        dropdownPanel.classList.toggle("show-grid-open");
        triggerBtn.classList.toggle("active-trigger");
        playSFX('popup');
    }
}

function applyThemeMutation(themeName) {
    const operationalThemes = ["theme-light", "theme-dark", "theme-sunset", "theme-crimson", "theme-sepia", "theme-army"];
    operationalThemes.forEach(t => document.body.classList.remove(t));

    const classThemeBridge = {
        'light': 'theme-light', 'dark': 'theme-dark', 'sunset': 'theme-sunset',
        'crimson': 'theme-crimson', 'sepia': 'theme-sepia', 'army': 'theme-army'
    };

    let calculatedThemeClass = classThemeBridge[themeName] || "theme-light";
    document.body.classList.add(calculatedThemeClass);
    AppState.currentTheme = calculatedThemeClass;
    playSFX('click');

    const labelMapping = {
        'theme-light': 'Light Minimalist', 'theme-dark': 'Dark Midnight',
        'theme-sunset': 'Sunset Warmth', 'theme-crimson': 'Crimson Richness',
        'theme-sepia': 'Earthy Sepia', 'theme-army': 'Army Olive Drab'
    };
    
    const displayLabel = document.getElementById("activeThemeLabel");
    if (displayLabel) displayLabel.innerText = labelMapping[calculatedThemeClass];

    const currentDropdownText = document.getElementById("currentDropdownThemeText");
    if (currentDropdownText) currentDropdownText.innerText = labelMapping[calculatedThemeClass];

    document.querySelectorAll(".card-radio-indicator").forEach(ind => ind.classList.remove("active-indicator"));
    const targetedIndicator = document.getElementById(`indicator-${themeName}`);
    if (targetedIndicator) targetedIndicator.classList.add("active-indicator");
}

function initPersonalizationControls() {
    const fontSlider = document.getElementById("premiumFontSlider");
    const fontDisplay = document.getElementById("fontSizeDisplay");
    if (!fontSlider) return;

    const initialVal = fontSlider.value;
    document.documentElement.style.setProperty("--text-scale-percentage", (initialVal / 100));

    fontSlider.addEventListener("input", function() {
        const val = this.value;
        const multiplier = val / 100;
        if (fontDisplay) fontDisplay.innerText = val + "%";
        document.documentElement.style.setProperty("--text-scale-percentage", multiplier);
        localStorage.setItem("user_font_scale", val);
    });
}

/* ==========================================================================
   14. SFX AUDIO ENGINE
   ========================================================================== */
const sfxSounds = {
    click: new Audio('audio/click.wav'),
    swishOpen: new Audio('audio/swish-open.mp3'),  
    swishClose: new Audio('audio/swish-close.mp3'), 
    popup: new Audio('audio/popup.wav'),
    delete: new Audio('audio/delete.wav'),
    star: new Audio('audio/star.wav'),
    publish: new Audio('audio/publish.wav'),
    aiStart: new Audio('audio/ai-start.wav'),
    aiSuccess: new Audio('audio/ai-success.wav'),
    tick: new Audio('audio/tick.wav'),
    error: new Audio('audio/error.wav')
};

function playSFX(type) {
    const sfxToggle = document.getElementById('sfxToggle');
    if (sfxToggle && !sfxToggle.checked) return; 
    
    if (sfxSounds[type]) {
        sfxSounds[type].currentTime = 0; 
        let currentVol = localStorage.getItem('sfx_volume') !== null ? parseFloat(localStorage.getItem('sfx_volume')) : 0.4;
        if (currentVol > 1) currentVol = currentVol / 100; 
        currentVol = Math.max(0, Math.min(1, currentVol));

        sfxSounds[type].volume = currentVol;
        if (currentVol > 0) {
            sfxSounds[type].play().catch(() => {});
        }
    }
}

/* ==========================================================================
   15. USER WORKSPACE LAUNCHERS
   ========================================================================== */
function openSecureWorkspace() {
    try { playSFX('click'); } catch(e) {}
    showAuthGate();
}

function saveTokenWithFeedback(value) {
    localStorage.setItem('my_github_token', value.trim());
    const statusText = document.getElementById('tokenStatusText');
    if (statusText) {
        if (value.trim().length > 0) {
            statusText.innerHTML = `<i class="fas fa-check-circle" style="font-size: 0.85rem;"></i> Saved securely to cache`;
            statusText.style.color = "#22c55e"; 
            statusText.style.opacity = "1";
            try { playSFX('tick'); } catch(e) {}
        } else {
            statusText.innerHTML = `<i class="fas fa-exclamation-triangle" style="font-size: 0.85rem;"></i> Token removed from system memory`;
            statusText.style.color = "#ef4444"; 
            statusText.style.opacity = "1";
        }
    }
}

/* ==========================================================================
   ROLE-BASED PERMISSION ENFORCER
   ========================================================================== */
function enforceRolePermissions() {
    const role = AppState.userRole || localStorage.getItem('cece_active_role') || 'master';
    const settingsBadge = document.getElementById('settings-role-badge');
    const drawerText = document.getElementById('drawer-role-text');
    const globalWriteButtons = document.querySelectorAll('#add-log-btn, .floating-write-trigger, button[onclick="prepareCreateForm()"]');

    if (role === 'visitor') {
        if (settingsBadge) {
            settingsBadge.textContent = "Logged in as Visitor";
            settingsBadge.style.background = "rgba(245, 158, 11, 0.1)"; 
            settingsBadge.style.color = "#f59e0b";
        }
        if (drawerText) {
            drawerText.innerHTML = `<span style="display: inline-block; width: 6px; height: 6px; background-color: #f59e0b; border-radius: 50%;"></span> Logged in as Visitor`;
        }
        globalWriteButtons.forEach(btn => btn.style.setProperty('display', 'none', 'important'));
    } else {
        if (settingsBadge) {
            settingsBadge.textContent = "Logged in as Master";
            settingsBadge.style.background = "rgba(34, 197, 94, 0.1)"; 
            settingsBadge.style.color = "#22c55e";
        }
        if (drawerText) {
            drawerText.innerHTML = `<span style="display: inline-block; width: 6px; height: 6px; background-color: #22c55e; border-radius: 50%;"></span> Logged in as Master`;
        }
        globalWriteButtons.forEach(btn => btn.style.display = '');
    }
}

function showAccessDeniedModal() {
    const overlay = document.getElementById('access-denied-modal-overlay');
    if (!overlay) return;
    try { playSFX('aiStart'); } catch(e) {} 
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '1';
        const card = overlay.querySelector('.dialog-card-surface');
        if (card) card.style.transform = 'scale(1)';
    }, 20);
}

function closeAccessDeniedModal() {
    try { playSFX('delete'); } catch(e) {} 
    const overlay = document.getElementById('access-denied-modal-overlay');
    if (!overlay) return;
    overlay.style.opacity = '0';
    const card = overlay.querySelector('.dialog-card-surface');
    if (card) card.style.transform = 'scale(0.92)';
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

function togglePrivacyConcealment() {
    AppState.privacyConcealed = !AppState.privacyConcealed;
    try { playSFX(AppState.privacyConcealed ? 'tick' : 'popup'); } catch(e) {}
    const linkedToggles = document.querySelectorAll('.privacy-conceal-checkbox');
    linkedToggles.forEach(box => { box.checked = AppState.privacyConcealed; });
    renderTimeline(AppState.logs);
}

/* ==========================================================================
   16. SYSTEM ERROR WINDOWS CLOSURES
   ========================================================================== */
function showGithubErrorModal() {
    const overlay = document.getElementById('github-error-modal-overlay');
    if (!overlay) return;
    try { playSFX('error'); } catch(e) {} 
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '1';
        const card = overlay.querySelector('.dialog-card-surface');
        if (card) card.style.transform = 'scale(1)';
    }, 20);
}

function closeGithubErrorModal() {
    const overlay = document.getElementById('github-error-modal-overlay');
    if (!overlay) return;
    try { playSFX('click'); } catch(e) {} 
    overlay.style.opacity = '0';
    const card = overlay.querySelector('.dialog-card-surface');
    if (card) card.style.transform = 'scale(0.92)';
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
}

/* ==========================================================================
   INTEGRATED GITHUB BINARY CLOUD UPLOADER UTILITIES
   ========================================================================== */
function initFormAudioDropZone() {
    const zone = document.getElementById("formAudioDropZone");
    const input = document.getElementById("formAudioFileInput");
    if (!zone || !input) return;

    zone.addEventListener("click", () => input.click());
    input.addEventListener("change", (e) => uploadAudioTrackToRepository(e.target.files[0]));

    zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("drag-active"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-active"));
    zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("drag-active");
        if (e.dataTransfer.files.length > 0) uploadAudioTrackToRepository(e.dataTransfer.files[0]);
    });
}

async function refreshMusicDropdown(selectedUrl = "") {
    const zone = document.getElementById("formAudioDropZone");
    if (!zone) return;

    let hiddenUrlInput = document.getElementById("eventSpotifyId");
    if (!hiddenUrlInput) {
        hiddenUrlInput = document.createElement("input");
        hiddenUrlInput.type = "hidden";
        hiddenUrlInput.id = "eventSpotifyId";
        zone.parentNode.insertBefore(hiddenUrlInput, zone);
    } else {
        hiddenUrlInput.type = "hidden"; 
    }

    let visibleTitleInput = document.getElementById("eventMusicTitle");
    if (!visibleTitleInput) {
        visibleTitleInput = document.createElement("input");
        visibleTitleInput.type = "text";
        visibleTitleInput.id = "eventMusicTitle";
        visibleTitleInput.placeholder = "✏️ Custom Display Name / Song Title...";
        visibleTitleInput.style = "width: 100%; padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--body-bg, #0f172a); color: var(--text-main); margin-top: 24px; font-weight: 600; outline: none; box-sizing: border-box; transition: border-color 0.2s;";
    } else {
        visibleTitleInput.type = "text";
        visibleTitleInput.style.display = "block";
        visibleTitleInput.style.marginTop = "24px"; 
    }

    let cardWrapper = document.getElementById("formAudioCardWrapper");
    let triggerBtn = document.getElementById("formAudioTriggerCard");

    if (!cardWrapper) {
        cardWrapper = document.createElement("div");
        cardWrapper.id = "formAudioCardWrapper";
        cardWrapper.style = "padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--input-bg); margin-bottom: 16px; box-shadow: 0 4px 12px var(--shadow-color); box-sizing: border-box; width: 100%;";
        
        const cardLabel = document.createElement("div");
        cardLabel.style = "font-size: 0.9rem; font-weight: 700; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px;";
        cardLabel.innerHTML = `<i class="fas fa-compact-disc" style="color: var(--primary); font-size: 1.1rem;"></i> Audio Workspace Attachment`;
        cardWrapper.appendChild(cardLabel);

        triggerBtn = document.createElement("div");
        triggerBtn.id = "formAudioTriggerCard";
        triggerBtn.style = "width: 100%; padding: 14px 18px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--body-bg, #0f172a); color: var(--text-main); font-weight: 600; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; transition: transform 0.1s, border-color 0.2s; box-sizing: border-box;";
        cardWrapper.appendChild(triggerBtn);

        zone.parentNode.insertBefore(cardWrapper, zone);
        cardWrapper.appendChild(zone);
        cardWrapper.appendChild(visibleTitleInput); 
    }

    zone.style.margin = "20px 0"; 

    let popupOverlay = document.getElementById("formAudioPopupOverlay");
    if (!popupOverlay) {
        popupOverlay = document.createElement("div");
        popupOverlay.id = "formAudioPopupOverlay";
        // ➕ ADDED: user-select control on the overlay container style below
        popupOverlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 999999; box-sizing: border-box; padding: 20px; -webkit-user-select: none; user-select: none;";
        
        const popupCard = document.createElement("div");
        popupCard.style = "width: 100%; max-width: 350px; background: var(--input-bg, #1e293b); border: 1px solid var(--border-color); border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); display: flex; flex-direction: column; max-height: 80vh; overflow: hidden; animation: popIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);";
        
        const popupHeader = document.createElement("div");
        popupHeader.style = "padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; background: rgba(0,0,0,0.1);";
        popupHeader.innerHTML = `
            <div style="font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px; font-size: 0.95rem; letter-spacing: 0.3px;">
                <i class="fas fa-compact-disc" style="color: var(--primary); animation: spin 4s linear infinite;"></i> Tracks Vault
            </div>
            <button type="button" id="formAudioPopupClose" style="background: transparent; border: none; outline: none; color: var(--text-muted); font-size: 1.1rem; cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;"><i class="fas fa-times"></i></button>
        `;
        popupCard.appendChild(popupHeader);

        const scrollContainer = document.createElement("div");
        scrollContainer.id = "formAudioPopupScrollBody";
        scrollContainer.style = "padding: 16px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; scrollbar-width: thin;";
        popupCard.appendChild(scrollContainer);

        popupOverlay.appendChild(popupCard);
        document.body.appendChild(popupOverlay);

        document.getElementById("formAudioPopupClose").addEventListener("click", () => {
            popupOverlay.style.display = "none";
            playSFX('swishClose');
            document.querySelectorAll(".track-context-menu-panel").forEach(el => el.remove());
        });
        popupOverlay.addEventListener("click", (e) => {
            if (e.target === popupOverlay) {
                popupOverlay.style.display = "none";
                document.querySelectorAll(".track-context-menu-panel").forEach(el => el.remove());
                playSFX('swishClose');
            }
        });
    }

    triggerBtn.onclick = () => {
        popupOverlay.style.display = "flex";
        playSFX('swishOpen');
    };

    zone.style.display = "none";
    triggerBtn.style.marginBottom = "0";
    let triggerDisplayLabel = "— No Track Selected —";

    const scrollBody = document.getElementById("formAudioPopupScrollBody");
    scrollBody.innerHTML = "";

    // ➕ Add New Song Upload Trigger
    // Add New Song Upload Trigger
const uploadItem = document.createElement("div");
uploadItem.style = "padding: 12px 16px; border-radius: 12px; border: 2px dashed #22c55e; background: rgba(34, 197, 94, 0.05); color: #22c55e; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 12px; box-sizing: border-box; font-size: 0.88rem; transition: background 0.1s, transform 0.1s; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;";

    // Active hold effect
    uploadItem.onmousedown = () => { uploadItem.style.background = "rgba(34, 197, 94, 0.15)"; uploadItem.style.transform = "scale(0.98)"; };
    uploadItem.ontouchstart = () => { uploadItem.style.background = "rgba(34, 197, 94, 0.15)"; uploadItem.style.transform = "scale(0.98)"; };5
    uploadItem.onmouseup = () => { uploadItem.style.background = "rgba(34, 197, 94, 0.05)"; uploadItem.style.transform = "scale(1)"; };
    uploadItem.ontouchend = () => { uploadItem.style.background = "rgba(34, 197, 94, 0.05)"; uploadItem.style.transform = "scale(1)"; };
    
    uploadItem.innerHTML = `
        <div style="width: 26px; height: 26px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i></div>
        <div><div style="font-weight: 700;">Add New Song</div></div>
    `;
    uploadItem.onclick = () => {
        popupOverlay.style.display = "none";
        zone.style.display = "block";
        triggerBtn.innerHTML = `<span><i class="fas fa-plus-circle" style="color: #22c55e; margin-right: 8px;"></i> Uploading Custom Track...</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
        playSFX('click');
    };
    scrollBody.appendChild(uploadItem);

    // 🚫 Remove Attached Track
const clearItem = document.createElement("div");
clearItem.style = "padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(239, 68, 68, 0.05); color: #ef4444; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 12px; box-sizing: border-box; font-size: 0.88rem; transition: background 0.1s, transform 0.1s; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;";

    // Active hold effect
    clearItem.onmousedown = () => { clearItem.style.background = "rgba(239, 68, 68, 0.15)"; clearItem.style.transform = "scale(0.98)"; };
    clearItem.onmouseup = () => { clearItem.style.background = "rgba(239, 68, 68, 0.05)"; clearItem.style.transform = "scale(1)"; };
    clearItem.ontouchstart = () => { clearItem.style.background = "rgba(239, 68, 68, 0.15)"; clearItem.style.transform = "scale(0.98)"; };
    clearItem.ontouchend = () => { clearItem.style.background = "rgba(239, 68, 68, 0.05)"; clearItem.style.transform = "scale(1)"; };
    
    clearItem.innerHTML = `
        <div style="width: 26px; height: 26px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i class="fas fa-ban" style="font-size: 0.8rem;"></i></div>
        <div><div style="font-weight: 700;">Remove Attachment</div></div>
    `;
    clearItem.onclick = () => {
        popupOverlay.style.display = "none";
        hiddenUrlInput.value = "";
        visibleTitleInput.value = "";
        triggerBtn.innerHTML = `<span>— No Track Selected —</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
        playSFX('delete');
    };
    scrollBody.appendChild(clearItem);

    const token = GitHubConfig.token;
    if (token) {
        try {
            const targetUrl = `https://api.github.com/repos/${GitHubConfig.username}/${GitHubConfig.repoName}/contents/music?t=${Date.now()}`;
            const response = await fetch(targetUrl, {
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github.v3+json" }
            });
            
            if (response.ok) {
                const files = await response.json();
                if (Array.isArray(files)) {
                    files.forEach(file => {
                        if (file.name.endsWith(".mp3")) {
                            const cleanName = decodeURIComponent(file.name).replace(/^\d+_+/, '').replace('.mp3', '').replaceAll('_', ' ');
                            const isSelected = file.download_url === selectedUrl;

                            const optionRow = document.createElement("div");
optionRow.style = `padding: 12px 14px; border-radius: 12px; border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(96, 165, 250, 0.08)' : 'var(--body-bg, #0f172a)'}; color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; position: relative; transition: background 0.1s, transform 0.1s, border-color 0.15s; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent;`;

                            
                            // 🛠️ FIXED HOLD HIGHLIGHT TELEMETRIC SYSTEM: Binds listeners onto input row loops to execute highlight states on hold events
                            optionRow.onmousedown = () => { 
                                optionRow.style.background = isSelected ? "rgba(96, 165, 250, 0.18)" : "rgba(255, 255, 255, 0.06)"; 
                                optionRow.style.transform = "scale(0.98)";
                            };
                            optionRow.onmouseup = () => { 
                                optionRow.style.background = isSelected ? "rgba(96, 165, 250, 0.08)" : "var(--body-bg, #0f172a)"; 
                                optionRow.style.transform = "scale(1)";
                            };
                            optionRow.ontouchstart = () => { 
                                optionRow.style.background = isSelected ? "rgba(96, 165, 250, 0.18)" : "rgba(255, 255, 255, 0.06)"; 
                                optionRow.style.transform = "scale(0.98)";
                            };
                            optionRow.ontouchend = () => { 
                                optionRow.style.background = isSelected ? "rgba(96, 165, 250, 0.08)" : "var(--body-bg, #0f172a)"; 
                                optionRow.style.transform = "scale(1)";
                            };

                            optionRow.innerHTML = `
                                <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; width: 75%;" class="track-row-select-area">
                                    <div style="width: 28px; height: 28px; border-radius: 8px; background: ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; color: ${isSelected ? '#ffffff' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <i class="fas ${isSelected ? 'fa-volume-up' : 'fa-music'}" style="font-size: 0.85rem;"></i>
                                    </div>
                                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        <div style="font-weight: 600; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${isSelected ? 'var(--primary)' : 'var(--text-main)'};">${cleanName}</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;" onclick="event.stopPropagation()">
                                    ${isSelected ? '<i class="fas fa-check-circle" style="color: var(--primary); font-size: 0.95rem;"></i>' : ''}
                                    <button type="button" class="track-option-delete-trigger" style="background: transparent; border: none; outline: none; padding: 6px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; transition: color 0.15s;"><i class="fas fa-ellipsis-v"></i></button>
                                </div>
                            `;

                            optionRow.onmouseenter = () => { if (!isSelected) optionRow.style.borderColor = "var(--primary)"; };
                            optionRow.onmouseleave = () => { if (!isSelected) optionRow.style.borderColor = "var(--border-color)"; };

                            optionRow.querySelector('.track-row-select-area').onclick = (e) => {
                                popupOverlay.style.display = "none";
                                hiddenUrlInput.value = file.download_url;
                                visibleTitleInput.value = cleanName;
                                triggerBtn.innerHTML = `<span><i class="fas fa-music" style="color: var(--primary); margin-right: 8px;"></i> ${cleanName}</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
                                playSFX('click');
                            };

                            const multiActionTrigger = optionRow.querySelector(".track-option-delete-trigger");
                            if (multiActionTrigger) {
                                multiActionTrigger.onclick = (e) => {
                                    toggleTrackCustomMenu(file.path, file.sha, cleanName, file.download_url, e, multiActionTrigger);
                                };
                            }

                            scrollBody.appendChild(optionRow);

                            if (isSelected) {
                                triggerDisplayLabel = cleanName;
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Failed to load music files from GitHub repository:", error);
        }
    }

    if (selectedUrl && triggerDisplayLabel === "— No Track Selected —") {
        zone.style.display = "block";
        triggerBtn.innerHTML = `<span><i class="fas fa-plus-circle" style="color: #22c55e; margin-right: 8px;"></i> Linked Custom Upload</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
    } else {
        triggerBtn.innerHTML = `<span>${triggerDisplayLabel !== "— No Track Selected —" ? `<i class="fas fa-music" style="color: var(--primary); margin-right: 8px;"></i> ` : ''}${triggerDisplayLabel}</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
    }
}


/* ==========================================================================
   🛠️ FIXED LAYER OPTION DROPDOWNS MODULES
   ========================================================================== */
function toggleTrackCustomMenu(path, sha, cleanName, url, event, buttonEl) {
    event.stopPropagation();
    
    const contextId = `trackInlineMenu-${sha}`;
    const targetPreexistingInstance = document.getElementById(contextId);
    const wasAlreadyOpen = targetPreexistingInstance !== null;

    document.querySelectorAll(".track-context-menu-panel").forEach(panel => panel.remove());
    if (wasAlreadyOpen) return;

    const popupMenuCard = document.createElement("div");
    popupMenuCard.id = contextId;
    popupMenuCard.className = "track-context-menu-panel animate-fade-in";
    
    const rect = buttonEl.getBoundingClientRect();
    const topPos = rect.bottom + window.scrollY + 6;
    const leftPos = rect.right + window.scrollX - 140;

    popupMenuCard.style = `position: fixed; top: ${topPos}px; left: ${leftPos}px; background: var(--input-bg, #1e293b); border: 1px solid var(--border-color); border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 2000000; width: 140px; display: flex; flex-direction: column; overflow: hidden;`;

    popupMenuCard.innerHTML = `
        <button type="button" style="background: transparent; border: none; padding: 10px 14px; text-align: left; color: var(--text-main); font-weight: 600; font-size: 0.78rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s;" class="track-inline-action-btn"><i class="fas fa-play" style="color: var(--primary); width: 12px;"></i> Listen Track</button>
        <button type="button" style="background: transparent; border: none; padding: 10px 14px; text-align: left; color: #ef4444; font-weight: 600; font-size: 0.78rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s; border-top: 1px solid var(--border-color);" class="track-inline-delete-btn"><i class="fas fa-trash-alt" style="width: 12px;"></i> Delete Track</button>
    `;

    document.body.appendChild(popupMenuCard);
    try { playSFX('click'); } catch(err){}

    popupMenuCard.querySelector(".track-inline-action-btn").onclick = (e) => {
        e.stopPropagation();
        popupMenuCard.remove();
        if (window.activeLocalBgmNode) window.activeLocalBgmNode.pause();
        const testAudNode = new Audio(url);
        testAudNode.volume = 0.6;
        window.activeLocalBgmNode = testAudNode;
        testAudNode.play().catch(() => {});
    };

    popupMenuCard.querySelector(".track-inline-delete-btn").onclick = (e) => {
        e.stopPropagation();
        popupMenuCard.remove();
        triggerPremiumTrackErasePrompt(path, sha, cleanName);
    };
}

function triggerPremiumTrackErasePrompt(path, sha, cleanName) {
    let modalLayer = document.getElementById("premiumTrackDeleteOverlayFrame");
    if (!modalLayer) {
        modalLayer = document.createElement("div");
        modalLayer.id = "premiumTrackDeleteOverlayFrame";
        modalLayer.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000000; box-sizing: border-box; padding: 20px; opacity: 0; transition: opacity 0.2s ease;";
        document.body.appendChild(modalLayer);
    }

    modalLayer.innerHTML = `
        <div class="dialog-card-surface animate-pop-in" style="width: 100%; max-width: 320px; background: var(--input-bg, #1e293b); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; box-shadow: 0 15px 40px rgba(0,0,0,0.6); text-align: center; box-sizing: border-box; transform: scale(0.95); transition: transform 0.2s ease;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 1.5rem;"><i class="fas fa-exclamation-triangle"></i></div>
            <div style="font-weight: 800; color: var(--text-main); font-size: 1.05rem; margin-bottom: 8px;">Erase Cloud Asset?</div>
            <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 20px; word-break: break-word;">Are you sure you want to completely remove <strong>${cleanName}</strong> from repository storage?</div>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button type="button" id="haltAssetDelBtn" style="flex: 1; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-main); font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: background 0.2s;">Cancel</button>
                <button type="button" id="executeAssetDelBtn" style="flex: 1; padding: 10px 16px; border-radius: 8px; border: none; background: #ef4444; color: #ffffff; font-weight: 700; font-size: 0.82rem; cursor: pointer; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3); transition: opacity 0.2s;">Delete</button>
            </div>
        </div>
    `;

    modalLayer.style.display = "flex";
    setTimeout(() => {
        modalLayer.style.opacity = "1";
        modalLayer.querySelector(".dialog-card-surface").style.transform = "scale(1)";
    }, 10);
    try { playSFX('popup'); } catch(e){}

    modalLayer.querySelector("#haltAssetDelBtn").onclick = () => {
        modalLayer.style.opacity = "0";
        modalLayer.querySelector(".dialog-card-surface").style.transform = "scale(0.95)";
        setTimeout(() => { modalLayer.style.display = "none"; }, 200);
        try { playSFX('swishClose'); } catch(e){}
    };

    modalLayer.querySelector("#executeAssetDelBtn").onclick = async () => {
        modalLayer.style.opacity = "0";
        setTimeout(() => { modalLayer.style.display = "none"; }, 200);
        await executeActualTrackDeletion(path, sha, cleanName);
    };
}

async function executeActualTrackDeletion(path, sha, cleanName) {
    const token = GitHubConfig.token;
    if (!token) return;

    try {
        const targetUrl = `https://api.github.com/repos/${GitHubConfig.username}/${GitHubConfig.repoName}/contents/${path}`;
        const response = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
                message: `Erase media asset source tree node: ${cleanName}`,
                sha: sha
            })
        });

        if (response.ok) {
            try { playSFX('delete'); } catch(e){}
            const hiddenUrlInput = document.getElementById("eventSpotifyId");
            const visibleTitleInput = document.getElementById("eventMusicTitle");
            
            if (hiddenUrlInput && hiddenUrlInput.value === `https://raw.githubusercontent.com/${GitHubConfig.username}/${GitHubConfig.repoName}/master/${path}`) {
                hiddenUrlInput.value = "";
                if (visibleTitleInput) visibleTitleInput.value = "";
            }

            const popOverlay = document.getElementById("formAudioPopupOverlay");
            if (popOverlay && popOverlay.style.display === "flex") {
                await refreshMusicDropdown(hiddenUrlInput ? hiddenUrlInput.value : "");
            }
        } else {
            throw new Error(`GitHub gateway failed with verification check status code: ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to execute remote file structure destruction payload sequence:", error);
        alert("Cloud deletion transaction rejected. Verify token parameters registry values.");
    }
}

async function uploadAudioTrackToRepository(file) {
    if (!file) return;
    if (!file.name.endsWith(".mp3")) {
        alert("Please select a valid .mp3 track format.");
        return;
    }

    const token = GitHubConfig.token;
    if (!token) {
        alert("Please map your Personal Access Token inside the Settings panel before uploading assets.");
        return;
    }

    const zone = document.getElementById("formAudioDropZone");
    const originalText = zone.innerHTML;
    zone.style.pointerEvents = "none";
    zone.innerHTML = `<i class="fas fa-bolt animate-pulse"></i> Packaging binary frames...`;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64RawPayload = reader.result.split(",")[1];
        const safeFilename = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const targetUrl = `https://api.github.com/repos/${GitHubConfig.username}/${GitHubConfig.repoName}/contents/music/${safeFilename}`;

        zone.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Streaming directly to GitHub Vault...`;

        try {
            const response = await fetch(targetUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/vnd.github.v3+json"
                },
                body: JSON.stringify({
                    message: `Upload media asset tracker node: ${file.name}`,
                    content: base64RawPayload
                })
            });

            if (!response.ok) throw new Error(`GitHub API Gateway Error: ${response.status}`);

            const data = await response.json();
            const permanentDownloadUrl = data.content.download_url;

            if (document.getElementById("eventSpotifyId")) document.getElementById("eventSpotifyId").value = permanentDownloadUrl;
            
            const cleanTitle = file.name.replace('.mp3', '').replaceAll('_', ' ');
            if (document.getElementById("eventMusicTitle")) document.getElementById("eventMusicTitle").value = cleanTitle;

            zone.style.color = "#22c55e";
            zone.innerHTML = `<i class="fas fa-check-circle"></i> Successfully Uploaded & Linked: ${file.name}!`;
            try { playSFX('aiSuccess'); } catch(e){}

            await refreshMusicDropdown(permanentDownloadUrl);

        } catch (error) {
            console.error("Cloud Media Transaction Failure:", error);
            alert("Upload rejected. Ensure your repository exists and your token permissions are active.");
            zone.style.color = "";
            zone.innerHTML = originalText;
        } finally {
            zone.style.pointerEvents = "";
        }
    };
}
