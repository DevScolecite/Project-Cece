/* ==========================================================================
   1. GLOBAL STATE & TRACKING KEYS
   ========================================================================== */
const GitHubConfig = {
    token: localStorage.getItem("my_github_token"), 
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
let enteredPin = "";
let modalPinBuffer = ""; // Declared globally at top to prevent Temporal Dead Zone crashes
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
        console.warn("Cloud credentials missing. GHP token unconfigured. Hiding timeline logs.");
        AppState.logs = []; 
        renderTimeline(AppState.logs);
        updateDashboardMetrics();
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
                    console.warn("Cloud sync payload is structurally invalid. Reverting to local cache.");
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
    WritingWorkspaceCalendar.init();
    initializeAPIWorkflowListeners(); 
    initDraftAutosave();
    initializeNativeNotificationAPI(); // Registers Service Worker context loop
    

    document.addEventListener('selectstart', (e) => {
        if (!e.target.closest('input, textarea, [contenteditable="true"]')) {
            e.preventDefault();
        }
    });

    document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('input, textarea, [contenteditable="true"]')) {
            if (e.target.closest('.timeline-text-content, .timeline-title, .section-heading, p, span, h2, h3')) {
                e.preventDefault();
            }
        }
    });

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
        if (!event.target.closest('#themeDropdownGridBtn') && !event.target.closest('#themeGridDropdownContainer')) {
            const dropdownPanel = document.getElementById("themeGridDropdownContainer");
            const triggerBtn = document.getElementById("themeDropdownGridBtn");
            if (dropdownPanel && dropdownPanel.classList.contains("show-grid-open")) {
                dropdownPanel.classList.remove("show-grid-open");
                triggerBtn.classList.remove("active-trigger");
            }
        }
        if (!event.target.closest('#monthFilterTrigger') && !event.target.closest('#monthFloatingCard')) {
            const monthCard = document.getElementById("monthFloatingCard");
            const monthTrigger = document.getElementById("monthFilterTrigger");
            if (monthCard && monthCard.classList.contains("show-card-open")) {
                monthCard.classList.remove("show-card-open");
                if (monthTrigger) monthTrigger.classList.remove("active-panel");
            }
        }
        
        // Custom Workspace Calendar card auto-close interception node
        if (!event.target.closest('#calendarCardTrigger') && !event.target.closest('#customCalendarFloatingCard')) {
            const calCard = document.getElementById("customCalendarFloatingCard");
            const calTrigger = document.getElementById("calendarCardTrigger");
            if (calCard && calCard.classList.contains("show-card-open")) {
                calCard.classList.remove("show-card-open");
                if (calTrigger) calTrigger.classList.remove("active-panel");
            }
        }

        const targetCloseBtn = event.target.closest('.modal-close-generic, .modal-close, [onclick*="close"]');
        const isEntryOverlay = event.target.id === 'entryDetailModalOverlay';
        const isFlashbackOverlay = event.target.id === 'flashbackModal';

        if (targetCloseBtn || isEntryOverlay || isFlashbackOverlay) {
            const entryModal = document.getElementById('entryDetailModalOverlay');
            const flashbackModal = document.getElementById('flashbackModal');

            if (entryModal && (isEntryOverlay || targetCloseBtn?.closest('#entryDetailModalOverlay'))) {
                event.preventDefault();
                closeEntryModal();
            }
            if (flashbackModal && (isFlashbackOverlay || targetCloseBtn?.closest('#flashbackModal'))) {
                event.preventDefault();
                closeFlashbackModal();
            }
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
        sfxSlider.value = Math.round(savedVol * 100);

        if (sfxIndicator) {
            sfxIndicator.textContent = Math.round(savedVol * 100) + '%';
        }

        const processVolumeUpdate = (rawValue) => {
            let volumeCalculated = parseFloat(rawValue) / 100;
            if (isNaN(volumeCalculated)) volumeCalculated = 0.4;
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

function showAuthGate() {
    const authPage = document.getElementById('auth-page');
    if (!authPage) return;
    
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
        
        if (pageId === 'settings-page') {
            calculateLocalStorageDiagnostics();
            initializeSettingsInterfaceState();
        }
        
        if (pageId === 'personalization-page') {
            syncPersonalizationViewStates();
        }
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

// Fixed function implementation context
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
    if (totalLogsEl) totalLogsEl.innerText = AppState.logs.length;
}

/* ==========================================================================
   7. INTERACTIVE TIMELINE ENGINE RENDERING (REVAMPED VISUAL ARCHITECTURE)
   ========================================================================== */
function renderTimeline(dataArray) {
    const container = document.getElementById("timelineContainer");
    if (!container) return;

    container.innerHTML = "";

    if (!dataArray || dataArray.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 60px 20px; background: var(--card-bg); border: 1px dashed var(--border-color); border-radius: 16px;">
                <i class="fas fa-folder-open" style="font-size: 2.5rem; color: var(--primary); opacity: 0.4; margin-bottom: 12px; display: block;"></i>
                <p style="font-weight: 600; font-size: 0.95rem; margin: 0;">No chronological timeline data indexed.</p>
                <p style="font-size: 0.82rem; opacity: 0.7; margin-top: 4px;">Select another interval or tap the action node to create a entry.</p>
            </div>`;
        return;
    }

    const sortedData = [...dataArray].sort((a, b) => new Date(b.date) - new Date(a.date));
    const isConcealed = AppState && AppState.privacyConcealed;

    sortedData.forEach((item, index) => {
        const timelineItem = document.createElement("div");
        timelineItem.className = "timeline-item animate-slide-up";
        timelineItem.style.animationDelay = `${index * 0.05}s`;

        const isLocked = item.isPrivate && !item.isRuntimeUnlocked;
        const shouldBlurCard = isLocked || isConcealed;
        const cardBlurClass = shouldBlurCard ? "private-card-locked" : "";
        const memoryGlowClass = item.isCoreMemory ? "core-memory-active" : "";

        let publishedDateFormatted = formatDisplayDate(item.date);
        
        let updateStampMark = '';
        if (item.lastEditedAt) {
            const editDate = new Date(item.lastEditedAt);
            if (!isNaN(editDate.getTime())) {
                updateStampMark = `
                    <div class="timestamp-node-stamp" style="display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-pen" style="font-size: 0.65rem; opacity: 0.6;"></i> 
                        <span>Edited ${editDate.toLocaleDateString("en-US", {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                    </div>`;
            }
        }

        let audioPlayerMarkup = "";
        if (item.spotifyId && item.spotifyId.trim().length > 0 && !shouldBlurCard) {
            let filenameTimeline = item.musicTitle && item.musicTitle.trim().length > 0 ? item.musicTitle.trim() : "";
            if (!filenameTimeline) {
                try {
                    const urlParts = item.spotifyId.trim().split('/');
                    filenameTimeline = decodeURIComponent(urlParts[urlParts.length - 1]).replace(/^\d+_+/, '');
                } catch(e) {
                    filenameTimeline = "Workspace Track Asset";
                }
            }

            audioPlayerMarkup = `
                <div class="timeline-audio-card-capsule" onclick="handleFeedAudioPlay('${item.id}', '${item.spotifyId.trim()}', event)" style="margin-top: 16px;">
                    <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; max-width: 85%;">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-color);">
                            <i class="fas fa-compact-disc fa-spin" style="font-size: 0.85rem; animation-duration: 6s;"></i>
                        </div>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; font-size: 0.84rem; letter-spacing: -0.1px;">${filenameTimeline}</span>
                    </div>
                    <div id="feedPlayBtn-${item.id}" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 0.75rem; box-shadow: 0 4px 10px var(--shadow-color); transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
                        <i class="fas fa-play" style="transform: translateX(1px);"></i>
                    </div>
                </div>
            `;
        }

        let actionMenuMarkup = "";
        if (!shouldBlurCard) {
            actionMenuMarkup = `
                <div style="position: relative; display: inline-block; flex-shrink: 0; margin-left: 12px;">
                    <button class="dots-trigger-btn" type="button" onclick="toggleActionMenu('${item.id}', event)" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold;">⋯</button>
                    <div id="dropdown-${item.id}" class="action-menu-dropdown" onclick="event.stopPropagation()">
                        <button type="button" onclick="prepareEditForm('${item.id}', event)"><i class="fas fa-edit" style="width: 14px; opacity: 0.7;"></i> Edit Log</button>
                        <button type="button" onclick="toggleCoreMemoryState('${item.id}', event)"><i class="${item.isCoreMemory ? 'fas' : 'far'} fa-star" style="width: 14px; color: ${item.isCoreMemory ? '#eab308' : 'currentColor'};"></i> ${item.isCoreMemory ? 'Unstar Memory' : 'Star Core Memory'}</button>
                        <button type="button" class="delete-action-btn" onclick="deleteEntry('${item.id}', event)"><i class="fas fa-trash-alt" style="width: 14px;"></i> Delete Entry</button>
                    </div>
                </div>
            `;
        }

        let statePillsMarkup = "";
        if (item.isCoreMemory && !shouldBlurCard) {
            statePillsMarkup += `<span style="font-size: 0.68rem; font-weight: 800; text-transform: uppercase; background: rgba(234, 179, 8, 0.1); color: #eab308; padding: 3px 10px; border-radius: 30px; border: 1px solid rgba(234, 179, 8, 0.15); letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-star" style="font-size: 0.65rem;"></i> Core Memory</span>`;
        }
        if (item.isPrivate && !isConcealed) {
            statePillsMarkup += `<span style="font-size: 0.68rem; font-weight: 800; text-transform: uppercase; background: rgba(96, 165, 250, 0.1); color: var(--accent-color); padding: 3px 10px; border-radius: 30px; border: 1px solid var(--border-color); letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-lock" style="font-size: 0.6rem;"></i> Encrypted</span>`;
        }

        timelineItem.innerHTML = `
            <div class="timeline-left">
                <div class="timeline-date" style="font-family: monospace; font-size: 0.9rem; font-weight: 700; opacity: 0.85;">${publishedDateFormatted}</div>
            </div>
            <div class="timeline-badge"></div>
            <div class="timeline-right">
                <div class="timeline-body-card ${memoryGlowClass} ${cardBlurClass}" style="border-radius: 16px; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;">
                    
                    <div class="timeline-card-blur-capture-layer">
                        <div class="timeline-header-wrapper" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
                            <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
                                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                    ${statePillsMarkup}
                                </div>
                                <div class="timeline-title" style="margin-bottom: 0; font-size: 1.2rem; font-weight: 800; letter-spacing: -0.4px; color: var(--text-main);">${item.title}</div>
                            </div>
                            ${actionMenuMarkup}
                        </div>
                        
                        <div class="text-narrative-container" onclick="handleTimelineCardClick('${item.id}', event)" style="position: relative;">
                            <div class="timeline-text-content" style="font-size: 0.96rem; line-height: 1.65; color: var(--text-main); opacity: 0.9; text-align: justify;">${item.content}</div>
                            <div class="read-more-indicator" style="font-size: 0.72rem; font-weight: 700; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; margin-top: 10px;"><i class="fas fa-align-left" style="margin-right: 4px;"></i> Expand Monologue</div>
                        </div>

                        ${audioPlayerMarkup}

                        <div class="timestamp-matrix-row" style="margin-top: 18px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px; font-size: 0.74rem; color: var(--text-muted);">
                            <div class="timestamp-node-stamp" style="display: flex; align-items: center; gap: 4px;">
                                <i class="far fa-calendar-alt" style="font-size: 0.7rem; opacity: 0.6;"></i> 
                                <span>Indexed: <strong>${publishedDateFormatted}</strong></span>
                            </div>
                            ${updateStampMark}
                        </div>
                    </div>

                    ${shouldBlurCard ? `
                    <div class="private-card-lock-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(125,125,125,0.02); backdrop-filter: blur(1px); border-radius: inherit; z-index: 10;" onclick="handleTimelineCardClick('${item.id}', event)">
                        <div class="lock-overlay-badge" style="display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 50px; box-shadow: 0 10px 25px var(--shadow-color); transform: scale(1); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-lock" style="font-size: 0.75rem;"></i>
                            </div>
                            <span style="font-weight: 800; font-size: 0.82rem; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-main);">Protected Entry</span>
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
    globalFeedAudioEngine.volume = 0.1;
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
            // Unlocked transition complete
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
   10. FLOATING CARD MODAL ENGINE (REVAMPED VISUAL ARCHITECTURE)
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
        tagNode.innerHTML = selectedMemory.isCoreMemory 
            ? `<i class="fas fa-star" style="font-size: 0.65rem;"></i> Core Memory` 
            : `<i class="fas fa-history" style="font-size: 0.65rem;"></i> Timeline Narrative`;
        
        tagNode.style.cssText = selectedMemory.isCoreMemory
            ? "font-size: 0.68rem; font-weight: 800; text-transform: uppercase; background: rgba(234, 179, 8, 0.1); color: #eab308; padding: 4px 12px; border-radius: 30px; border: 1px solid rgba(234, 179, 8, 0.15); letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;"
            : "font-size: 0.68rem; font-weight: 800; text-transform: uppercase; background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 30px; border: 1px solid var(--border-color); letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;";
    }

    if (selectedMemory.spotifyId && selectedMemory.spotifyId.trim().length > 0) {
        const trackTarget = selectedMemory.spotifyId.trim();
        let filename = selectedMemory.musicTitle && selectedMemory.musicTitle.trim().length > 0 ? selectedMemory.musicTitle.trim() : "";
        
        if (!filename) {
            try {
                const urlParts = trackTarget.split('/');
                filename = decodeURIComponent(urlParts[urlParts.length - 1]).replace(/^\d+_+/, '');
            } catch(e) {
                filename = "Workspace Audio Track";
            }
        }

        const capsuleWrapper = document.createElement('div');
        capsuleWrapper.className = 'custom-audio-capsule-wrapper';
        capsuleWrapper.style = 'width: 100%; max-width: 100%; margin: 18px 0; display: block; box-sizing: border-box;';

        capsuleWrapper.innerHTML = `
            <div class="audio-capsule-surface" style="padding: 14px 20px; border-radius: 14px; border: 1px solid var(--border-color); background: var(--input-bg); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 15px var(--shadow-color); box-sizing: border-box; width: 100%;">
                <div class="capsule-title-zone" style="display: flex; align-items: center; gap: 12px; font-size: 0.86rem; font-weight: 700; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-color);">
                        <i class="fas fa-compact-disc fa-spin" style="font-size: 0.85rem; animation-duration: 6s;"></i>
                    </div>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.1px;">${filename}</span>
                </div>
                <button id="capsulePlayActionBtn" type="button" style="background: var(--primary); color: #ffffff; border: none; outline: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s; flex-shrink: 0; box-shadow: 0 4px 10px var(--shadow-color); padding: 0;">
                    <i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>
                </button>
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
            nativeEngine.volume = 0.1; 

            playToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (nativeEngine.paused) {
                    nativeEngine.play();
                    playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 0.8rem;"></i>';
                } else {
                    nativeEngine.pause();
                    playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>';
                }
            });

            nativeEngine.addEventListener("ended", () => {
                playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>';
            });

            nativeEngine.play()
                .then(() => { playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 0.8rem;"></i>'; })
                .catch(err => { playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>'; });
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
   11. DIARY ENTRY LOG MANAGEMENT & AI REFINEMENT PIPELINE
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

function selectFloatingMonth(monthValue, monthDisplayName, event) {
    if (event) event.stopPropagation();
    
    document.getElementById('currentSelectedMonthText').innerText = monthDisplayName;
    
    const gridItems = document.querySelectorAll('.month-grid-item');
    gridItems.forEach(item => item.classList.remove('active-item'));
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active-item');
    }
    
    document.getElementById('monthFloatingCard').classList.remove('show-card-open');
    document.getElementById('monthFilterTrigger').classList.remove('active-panel');
    
    playSFX('click');
    
    if (monthValue === "all") {
        renderTimeline(AppState.logs);
    } else {
        const filtered = AppState.logs.filter(log => log.month === monthValue);
        renderTimeline(filtered);
    }
    console.log(`Matrix Filter Interval updated targeting sequence bounds: ${monthValue}`);
}

function prepareCreateForm() {
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }

    AppState.editingId = null;
    document.getElementById('eventTitle').value = '';
    
    // Set baseline date parameter matching calendar core
    const defaultDateStr = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = defaultDateStr;
    WritingWorkspaceCalendar.setDate(defaultDateStr);
    
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
    
    checkAndShowDraftBanner();
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
    
    const logDateStr = targetLog.date || new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = logDateStr;
    WritingWorkspaceCalendar.setDate(logDateStr);
    
    if (document.getElementById('eventSpotifyId')) document.getElementById('eventSpotifyId').value = targetLog.spotifyId || ''; 
    if (document.getElementById('eventMusicTitle')) document.getElementById('eventMusicTitle').value = targetLog.musicTitle || ''; 
    
    const contentField = document.getElementById('eventContent');
    if (contentField) contentField.value = targetLog.content || '';
    
    const privacyCheckbox = document.getElementById('eventPrivacy');
    if (privacyCheckbox) privacyCheckbox.checked = targetLog.isPrivate || false;
    
    refreshMusicDropdown(targetLog.spotifyId || "");
    switchPage('create-log-page');
    
    checkAndShowDraftBanner();
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

    let isEditSession = (AppState.editingId !== null);

    if (isEditSession) {
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

    clearDraft();

    // Trigger true phone system notification directly into status notification logs channel shade
    triggerSystemNotification(
        isEditSession ? "ENTRY MODIFIED SUCCESSFULLY" : "NEW MONOLOGUE SAVED",
        `Memory frame "${title}" successfully synchronized and locked under 256-bit environment.`
    );

    await saveToGist();
    
    renderTimeline(AppState.logs);
    
    const selectedMonthText = document.getElementById('currentSelectedMonthText');
    if (selectedMonthText) selectedMonthText.innerText = "Display All Intervals";
    
    document.querySelectorAll('.month-grid-item').forEach(item => item.classList.remove('active-item'));
    const allIntervalsNode = document.querySelector('.month-grid-item[onclick*="all"]');
    if (allIntervalsNode) allIntervalsNode.classList.add('active-item');

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
        
        const gridItems = document.querySelectorAll('.month-grid-item');
        let currentMonthValue = "all";
        
        gridItems.forEach(item => {
            if (item.classList.contains('active-item')) {
                const match = item.getAttribute('onclick').match(/'([^']+)'/);
                if (match) currentMonthValue = match[1];
            }
        });
        
        if (currentMonthValue === "all") {
            renderTimeline(AppState.logs);
        } else {
            renderTimeline(AppState.logs.filter(log => log.month === currentMonthValue));
        }
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
    
    const gridItems = document.querySelectorAll('.month-grid-item');
    let currentMonthValue = "all";
    gridItems.forEach(item => {
        if (item.classList.contains('active-item')) {
            const match = item.getAttribute('onclick').match(/'([^']+)'/);
            if (match) currentMonthValue = match[1];
        }
    });
    
    if (currentMonthValue === "all") {
        renderTimeline(AppState.logs);
    } else {
        renderTimeline(AppState.logs.filter(log => log.month === currentMonthValue));
    }
}

/* ==========================================================================
   UPDATED AI POLISH WITH NVIDIA NEMOTRON 3 ULTRA (550B FREE) ENDPOINT
   ========================================================================== */
async function improveWithAI() {
    const btn = document.querySelector('.ai-polish-pill-btn');
    const container = document.querySelector('.textarea-relative-box');
    const textarea = document.getElementById('eventContent');

    const openRouterKey = localStorage.getItem('openrouter_api_key');
    if (!openRouterKey) {
        openAPIConfigModal();
        const errorText = document.getElementById('api-error-diagnostic');
        if (errorText) {
            errorText.innerText = "Please enter an OpenRouter key before running AI tasks.";
            errorText.classList.remove('hidden');
        }
        return;
    }

    if (!textarea || !textarea.value.trim()) {
        alert("Please write down a draft monologue narrative first before requesting an AI polish.");
        return;
    }

    if (btn.classList.contains('processing')) return;

    btn.classList.add('processing');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Polishing...`;

    let loadingOverlay = container.querySelector('.ai-processing-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'ai-processing-overlay';
        loadingOverlay.innerHTML = `
            <div class="ai-spinner-element"></div>
            <div class="ai-status-message-text">Polishing Monologue Stream...</div>
        `;
        container.appendChild(loadingOverlay);
    }

    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.opacity = '0';
    loadingOverlay.offsetHeight; 
    loadingOverlay.style.opacity = '1';

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": `https://github.com/${GitHubConfig.username}/${GitHubConfig.repoName}`,
                "X-Title": "Project Cece Workspace"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-ultra-550b-a55b:free", 
                messages: [
                    {
                        role: "system",
                        content: "You are an expert editor. Polish the following personal diary text for spelling, conversational grammar, and professional flow while strictly preserving its original raw emotional tone, phrasing, and Taglish elements. Taglish must remain Taglish, raw remains raw. Do not add any conversational replies, explanations, or extra text. Output ONLY the updated polished monologue text."
                    },
                    {
                        role: "user",
                        content: textarea.value
                    }
                ]
            })
        });

        if (!response.ok) throw new Error(`OpenRouter gateway API returned response status: ${response.status}`);
        
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const polishedContent = data.choices[0].message.content.trim();
            textarea.value = polishedContent;
            try { playSFX('aiSuccess'); } catch(e) {}
        } else {
            throw new Error("Invalid format returned in OpenRouter completions payload.");
        }
        
    } catch (error) {
        console.error("AI polishing pipeline trace exception:", error);
        alert("Grammar polish failed. Verify your OpenRouter connection parameters or credits status.");
        try { playSFX('error'); } catch(e) {}
    } finally {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);

        btn.classList.remove('processing');
        btn.innerHTML = originalHTML;
    }
}

/* ==========================================================================
   12. INTERACTIVE RANDOM CAPSULE MECHANISMS (REVAMPED VISUAL ARCHITECTURE)
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
        capsuleWrapper.style = 'width: 100%; max-width: 100%; margin: 18px 0; display: block; box-sizing: border-box;';
        
        capsuleWrapper.innerHTML = `
            <div class="audio-capsule-surface" style="padding: 14px 20px; border-radius: 14px; border: 1px solid var(--border-color); background: var(--input-bg); display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 15px var(--shadow-color); box-sizing: border-box; width: 100%;">
                <div class="capsule-title-zone" style="display: flex; align-items: center; gap: 12px; font-size: 0.86rem; font-weight: 700; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-color);">
                        <i class="fas fa-compact-disc fa-spin" style="font-size: 0.85rem; animation-duration: 6s;"></i>
                    </div>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.1px;">${filename}</span>
                </div>
                <button id="flashbackPlayActionBtn" type="button" style="background: var(--primary); color: #ffffff; border: none; outline: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s; flex-shrink: 0; box-shadow: 0 4px 10px var(--shadow-color); padding: 0;">
                    <i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>
                </button>
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
            nativeEngine.volume = 0.1;

            playToggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (nativeEngine.paused) {
                    nativeEngine.play();
                    playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 0.8rem;"></i>';
                } else {
                    nativeEngine.pause();
                    playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>';
                }
            });

            nativeEngine.addEventListener("ended", () => {
                playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>';
            });

            nativeEngine.play()
                .then(() => { playToggleBtn.innerHTML = '<i class="fas fa-pause" style="font-size: 0.8rem;"></i>'; })
                .catch(() => { playToggleBtn.innerHTML = '<i class="fas fa-play" style="font-size: 0.8rem; transform: translateX(1px);"></i>'; });
        }
    }
    
    if (isLocked) {
        modalCard.classList.add("private-card-locked");
        
        const lockOverlay = document.createElement("div");
        lockOverlay.className = "private-card-lock-overlay";
        lockOverlay.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); backdrop-filter: blur(14px); z-index: 10; cursor: pointer; margin-top: 0; border-radius: inherit;";
        lockOverlay.onclick = (e) => {
            e.stopPropagation();
            openPinModalForLog(selectedMemory.id, "capsule");
        };
        
        lockOverlay.innerHTML = `
            <div class="lock-overlay-badge" style="display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 50px; box-shadow: 0 10px 25px var(--shadow-color);">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-lock" style="font-size: 0.75rem;"></i>
                </div>
                <span style="font-weight: 800; font-size: 0.82rem; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-main);">Protected Segment</span>
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
        try { playSFX('swishClose'); } catch(e) {}
    }
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return "N/A";
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) return "N/A";
    return parsedDate.toLocaleDateString("en-US", { month: 'short', day: '2-digit' });
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
    localStorage.setItem("user_workspace_theme", themeName);
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

    document.querySelectorAll(".theme-grid-card").forEach(card => card.classList.remove("active-card-selected"));
    document.querySelectorAll(".card-radio-indicator").forEach(ind => ind.classList.remove("active-indicator"));
    
    const targetedIndicator = document.getElementById(`indicator-${themeName}`);
    if (targetedIndicator) {
        targetedIndicator.classList.add("active-indicator");
        const matchingParentCard = targetedIndicator.closest(".theme-grid-card");
        if (matchingParentCard) matchingParentCard.classList.add("active-card-selected");
    }
}

/* ==========================================================================
   13A. NATIVE BACKGROUND MOBILE NOTIFICATION MANAGEMENT ENGINE
   ========================================================================== */
let serviceWorkerRegistration = null;

function initializeNativeNotificationAPI() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('Service Worker Base Shell Registered.');
                serviceWorkerRegistration = reg;
            })
            .catch(err => console.error('Service Worker registration failure state:', err));
    }
}

function triggerSystemNotification(titleText, bodyText) {
    if (!("Notification" in window)) {
        console.warn("Mobile frame environment wrapper doesn't support system API notifications.");
        return;
    }

    if (Notification.permission === "granted") {
        sendNotificationPayload(titleText, bodyText);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                sendNotificationPayload(titleText, bodyText);
            }
        });
    }
}

function sendNotificationPayload(title, body) {
    if (serviceWorkerRegistration) {
        const options = {
            body: body,
            icon: 'icon-192.png', 
            vibrate: [200, 100, 200], 
            badge: 'badge.png', 
            tag: 'timeline-update', 
            renotify: true 
        };
        serviceWorkerRegistration.showNotification(title, options);
    } else {
        new Notification(title, { body: body });
    }
}

function initPersonalizationControls() {
    const fontSlider = document.getElementById("premiumFontSlider");
    const fontDisplay = document.getElementById("fontSizeDisplay");
    const liveTextPreview = document.getElementById("liveTextPreviewNode");
    
    if (!fontSlider) return;

    const cachedFontScale = localStorage.getItem("user_font_scale");
    if (cachedFontScale) {
        fontSlider.value = cachedFontScale;
    }

    const currentScaleVal = fontSlider.value;
    document.documentElement.style.setProperty("--text-scale-percentage", (currentScaleVal / 100));
    
    if (fontDisplay) fontDisplay.innerText = currentScaleVal + "%";
    if (liveTextPreview) liveTextPreview.style.fontSize = `${currentScaleVal}%`;

    fontSlider.addEventListener("input", function() {
        const val = this.value;
        const multiplier = val / 100;
        if (fontDisplay) fontDisplay.innerText = val + "%";
        if (liveTextPreview) liveTextPreview.style.fontSize = `${val}%`;
        document.documentElement.style.setProperty("--text-scale-percentage", multiplier);
        localStorage.setItem("user_font_scale", val);
    });
}

function syncPersonalizationViewStates() {
    const savedTheme = localStorage.getItem("user_workspace_theme") || "dark";
    applyThemeMutation(savedTheme);
    
    const fontSlider = document.getElementById("premiumFontSlider");
    const fontDisplay = document.getElementById("fontSizeDisplay");
    const liveTextPreview = document.getElementById("liveTextPreviewNode");
    
    if (fontSlider) {
        const cachedFontScale = localStorage.getItem("user_font_scale") || "100";
        fontSlider.value = cachedFontScale;
        if (fontDisplay) fontDisplay.innerText = cachedFontScale + "%";
        if (liveTextPreview) liveTextPreview.style.fontSize = `${cachedFontScale}%`;
        document.documentElement.style.setProperty("--text-scale-percentage", (parseFloat(cachedFontScale) / 100));
    }
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
   INTEGRATED GITHUB BINARY CLOUD UPLOADER UTILITIES (PREMIUM UX REVAMP)
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
        visibleTitleInput.id = "eventMusicTitle";
        visibleTitleInput.type = "text";
        visibleTitleInput.placeholder = "Custom Display Name / Song Title...";
        visibleTitleInput.style.cssText = "width: 100%; padding: 14px 16px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--body-bg, #0f172a); color: var(--text-main); margin-top: 16px; font-weight: 600; outline: none; box-sizing: border-box; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); font-size: 0.9rem; letter-spacing: -0.1px;";
    } else {
        visibleTitleInput.type = "text";
        visibleTitleInput.style.display = "block";
        visibleTitleInput.style.marginTop = "16px"; 
    }

    let cardWrapper = document.getElementById("formAudioCardWrapper");
    let triggerBtn = document.getElementById("formAudioTriggerCard");

    if (!cardWrapper) {
        cardWrapper = document.createElement("div");
        cardWrapper.id = "formAudioCardWrapper";
        cardWrapper.style.cssText = "padding: 24px; border-radius: 16px; border: 1px solid var(--border-color); background: var(--card-bg); margin-bottom: 24px; box-shadow: 0 8px 30px var(--shadow-color); box-sizing: border-box; width: 100%; transition: all 0.3s ease;";
        
        const cardLabel = document.createElement("div");
        cardLabel.style.cssText = "font-size: 0.78rem; font-weight: 800; color: var(--text-main); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.9;";
        cardLabel.innerHTML = `<i class="fas fa-compact-disc" style="color: var(--primary); font-size: 1rem; animation: spin 8s linear infinite;"></i> Audio Workspace Attachment`;
        cardWrapper.appendChild(cardLabel);

        triggerBtn = document.createElement("div");
        triggerBtn.id = "formAudioTriggerCard";
        triggerBtn.style.cssText = "width: 100%; padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-weight: 700; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-sizing: border-box; font-size: 0.88rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);";
        cardWrapper.appendChild(triggerBtn);

        zone.parentNode.insertBefore(cardWrapper, zone);
        cardWrapper.appendChild(triggerBtn);
        cardWrapper.appendChild(zone);
        cardWrapper.appendChild(visibleTitleInput); 
    }

    zone.style.margin = "16px 0"; 

    let popupOverlay = document.getElementById("formAudioPopupOverlay");
    if (!popupOverlay) {
        popupOverlay = document.createElement("div");
        popupOverlay.id = "formAudioPopupOverlay";
        popupOverlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); display: none; align-items: center; justify-content: center; z-index: 999999; box-sizing: border-box; padding: 20px; user-select: none;";
        
        const popupCard = document.createElement("div");
        popupCard.style.cssText = "width: 100%; max-width: 400px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; box-shadow: 0 30px 70px var(--shadow-color); display: flex; flex-direction: column; max-height: 75vh; overflow: hidden; animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);";
        
        const popupHeader = document.createElement("div");
        popupHeader.style.cssText = "padding: 18px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; background: rgba(0,0,0,0.02);";
        popupHeader.innerHTML = `
            <div style="font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 10px; font-size: 1rem; letter-spacing: -0.2px;">
                <div style="width: 28px; height: 28px; border-radius: 8px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center;"><i class="fas fa-music" style="font-size: 0.8rem;"></i></div>
                <span>Workspace Media Vault</span>
            </div>
            <button type="button" id="formAudioPopupClose" style="background: var(--input-bg); border: 1px solid var(--border-color); outline: none; color: var(--text-main); width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.8rem;"><i class="fas fa-times"></i></button>
        `;
        popupCard.appendChild(popupHeader);

        const scrollContainer = document.createElement("div");
        scrollContainer.id = "formAudioPopupScrollBody";
        scrollContainer.style.cssText = "padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; scrollbar-width: thin;";
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
    let triggerDisplayLabel = "— No Audio Asset Linked —";

    const scrollBody = document.getElementById("formAudioPopupScrollBody");
    scrollBody.innerHTML = "";

    const gridActionWrapper = document.createElement("div");
    gridActionWrapper.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px;";

    const uploadItem = document.createElement("div");
    uploadItem.style.cssText = "padding: 12px; border-radius: 12px; border: 1px dashed #22c55e; background: rgba(34, 197, 94, 0.03); color: #22c55e; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s;";
    uploadItem.innerHTML = `<i class="fas fa-cloud-upload-alt" style="font-size: 1.1rem;"></i><span>Upload MP3</span>`;
    uploadItem.onclick = () => {
        popupOverlay.style.display = "none";
        zone.style.display = "block";
        triggerBtn.innerHTML = `<span><i class="fas fa-spinner fa-spin" style="color: #22c55e; margin-right: 8px;"></i> Awaiting Binary Frame Stream...</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
        playSFX('click');
    };

    const clearItem = document.createElement("div");
    clearItem.style.cssText = "padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(239, 68, 68, 0.03); color: #ef4444; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s;";
    clearItem.innerHTML = `<i class="fas fa-trash-alt" style="font-size: 1.1rem;"></i><span>Detach Asset</span>`;
    clearItem.onclick = () => {
        popupOverlay.style.display = "none";
        hiddenUrlInput.value = "";
        visibleTitleInput.value = "";
        triggerBtn.innerHTML = `<span>— No Audio Asset Linked —</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
        playSFX('delete');
    };

    gridActionWrapper.appendChild(uploadItem);
    gridActionWrapper.appendChild(clearItem);
    scrollBody.appendChild(gridActionWrapper);

    const divider = document.createElement("div");
    divider.style.cssText = "height: 1px; background: var(--border-color); margin: 4px 0; width: 100%; opacity: 0.7;";
    scrollBody.appendChild(divider);

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
                            optionRow.style.cssText = `padding: 12px 14px; border-radius: 12px; border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}; background: ${isSelected ? 'rgba(96, 165, 250, 0.06)' : 'var(--input-bg)'}; color: var(--text-main); cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; box-sizing: border-box; position: relative; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);`;

                            optionRow.innerHTML = `
                                <div style="display: flex; align-items: center; gap: 10px; overflow: hidden; width: 78%;">
                                    <div style="width: 30px; height: 30px; border-radius: 8px; background: ${isSelected ? 'var(--primary)' : 'var(--body-bg)'}; color: ${isSelected ? '#ffffff' : 'var(--primary)'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-color);">
                                        <i class="fas ${isSelected ? 'fa-compact-disc fa-spin' : 'fa-music'}" style="font-size: 0.8rem;"></i>
                                    </div>
                                    <span style="font-weight: 700; font-size: 0.84rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.1px; color: ${isSelected ? 'var(--primary)' : 'var(--text-main)'};">${cleanName}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                                    <button type="button" class="track-option-delete-trigger" style="background: var(--body-bg); border: 1px solid var(--border-color); outline: none; width: 26px; height: 26px; border-radius: 6px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: all 0.2s;"><i class="fas fa-ellipsis-v"></i></button>
                                </div>
                            `;

                            optionRow.onclick = (e) => {
                                if (e.target.closest('.track-option-delete-trigger')) return;
                                popupOverlay.style.display = "none";
                                hiddenUrlInput.value = file.download_url;
                                visibleTitleInput.value = cleanName;
                                triggerBtn.innerHTML = `<span><i class="fas fa-compact-disc fa-spin" style="color: var(--primary); margin-right: 8px; animation-duration: 4s;"></i> ${cleanName}</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
                                playSFX('click');
                            };

                            const multiActionTrigger = optionRow.querySelector(".track-option-delete-trigger");
                            if (multiActionTrigger) {
                                multiActionTrigger.onclick = (e) => {
                                    e.stopPropagation(); 
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

    if (selectedUrl && triggerDisplayLabel === "— No Audio Asset Linked —") {
        zone.style.display = "block";
        triggerBtn.innerHTML = `<span><i class="fas fa-link" style="color: #22c55e; margin-right: 8px;"></i> External Audio Stream</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
    } else {
        triggerBtn.innerHTML = `<span>${triggerDisplayLabel !== "— No Audio Asset Linked —" ? `<i class="fas fa-compact-disc fa-spin" style="color: var(--primary); margin-right: 8px; animation-duration: 5s;"></i> ` : ''}${triggerDisplayLabel}</span> <i class="fas fa-chevron-down" style="font-size: 0.85rem; opacity: 0.7;"></i>`;
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

/* ==========================================================================
   TRACK UPLOADER SUBSYSTEMS
   ========================================================================== */
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

/* ==========================================================================
   24A. HIGH-FIDELITY CHRONO-CALENDAR ENGINE (DYNAMIC HYBRID UNIFICATION)
   ========================================================================== */
const WritingWorkspaceCalendar = {
    viewingDate: new Date(),
    selectedDate: new Date(),
    
    init() {
        this.trigger = document.getElementById('calendarCardTrigger');
        this.card = document.getElementById('customCalendarFloatingCard');
        this.grid = document.getElementById('calendarDaysGrid');
        this.title = document.getElementById('calendarMonthYearTitle');
        this.display = document.getElementById('currentTargetDateDisplay');
        this.hiddenInput = document.getElementById('eventDate');
        this.legacyHiddenInput = document.getElementById('selectedFormDate'); // Legacy anchor
        
        if (!this.trigger) return;

        this.syncDateState(this.selectedDate);

        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.trigger.classList.toggle('active-panel');
            this.card.classList.toggle('show-card-open');
        });

        document.getElementById('prevMonthBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.viewingDate.setMonth(this.viewingDate.getMonth() - 1);
            this.render();
        });

        document.getElementById('nextMonthBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.viewingDate.setMonth(this.viewingDate.getMonth() + 1);
            this.render();
        });

        this.render();
    },

    setDate(dateStr) {
        let parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) parsed = new Date();
        this.selectedDate = parsed;
        this.viewingDate = new Date(parsed.getTime());
        this.syncDateState(parsed);
        this.render();
    },

    syncDateState(targetDate) {
        if (!this.display) return;
        const readableOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        this.display.textContent = targetDate.toLocaleDateString('en-US', readableOptions);
        
        const isoString = targetDate.toISOString().split('T')[0];
        if (this.hiddenInput) {
            this.hiddenInput.value = isoString;
            this.hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (this.legacyHiddenInput) {
            this.legacyHiddenInput.value = isoString;
        }
    },

    render() {
        if (!this.grid || !this.title) return;
        const year = this.viewingDate.getFullYear();
        const month = this.viewingDate.getMonth();
        
        const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.title.textContent = `${monthLabels[month]} ${year}`;

        this.grid.innerHTML = '';

        const initialWeekOffset = new Date(year, month, 1).getDay();
        const absoluteDaysCount = new Date(year, month + 1, 0).getDate();

        for (let offsetIndex = 0; offsetIndex < initialWeekOffset; offsetIndex++) {
            const bufferNode = document.createElement('div');
            bufferNode.classList.add('calendar-day-cell', 'empty-cell');
            this.grid.appendChild(bufferNode);
        }

        for (let iterationDay = 1; iterationDay <= absoluteDaysCount; iterationDay++) {
            const chronologicalCell = document.createElement('div');
            chronologicalCell.classList.add('calendar-day-cell');
            chronologicalCell.textContent = iterationDay;

            if (iterationDay === this.selectedDate.getDate() && 
                month === this.selectedDate.getMonth() && 
                year === this.selectedDate.getFullYear()) {
                chronologicalCell.classList.add('selected-day');
                chronologicalCell.style.backgroundColor = 'var(--primary)';
                chronologicalCell.style.color = '#ffffff';
            }

            chronologicalCell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedDate = new Date(year, month, iterationDay);
                this.viewingDate = new Date(year, month, iterationDay); 
                
                this.syncDateState(this.selectedDate);
                this.render();
                
                this.card.classList.remove('show-card-open');
                this.trigger.classList.remove('active-panel');
                try { playSFX('click'); } catch(err){}
            });

            this.grid.appendChild(chronologicalCell);
        }
    }
};

/* ==========================================================================
   INTERACTIVE SETTINGS UTILITIES & CONTROL ENGINES
   ========================================================================== */
function initializeSettingsInterfaceState() {
    const cachedToken = localStorage.getItem("my_github_token") || "";
    const badge = document.getElementById("cloudConnectionBadge");
    const statusText = document.getElementById("cloudStatusTextText");
    
    if (cachedToken.trim().length > 0) {
        if (badge) {
            badge.className = "connection-status-pill online";
            if (statusText) statusText.textContent = "Vault Profile Cached";
        }
    } else {
        if (badge) {
            badge.className = "connection-status-pill offline";
            if (statusText) statusText.textContent = "Unlinked System Memory";
        }
    }
}

function toggleTokenFieldVisibility() {
    const input = document.getElementById("githubTokenInput");
    const icon = document.getElementById("tokenVisibilityIcon");
    if (!input || !icon) return;

    try { playSFX('click'); } catch(e) {}

    if (input.type === "password") {
        input.type = "text";
        icon.className = "fas fa-eye-slash";
    } else {
        input.type = "password";
        icon.className = "fas fa-eye";
    }
}

function calculateLocalStorageDiagnostics() {
    const telemetryTarget = document.getElementById("localStorageBytesPill");
    if (!telemetryTarget) return;

    try {
        let totalByteSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalByteSize += (localStorage[key].length + key.length) * 2;
            }
        }
        
        const calculatedKilobytes = (totalByteSize / 1024).toFixed(2);
        telemetryTarget.textContent = `${calculatedKilobytes} KB Used`;
    } catch(err) {
        telemetryTarget.textContent = "Telemetry Error";
    }
}

async function testGitHubTokenConnection() {
    const tokenInput = document.getElementById("githubTokenInput");
    const testBtn = document.getElementById("verifyTokenCloudBtn");
    const feedbackNode = document.getElementById("tokenStatusText");
    const badge = document.getElementById("cloudConnectionBadge");
    const statusText = document.getElementById("cloudStatusTextText");

    const activeTokenValue = tokenInput ? tokenInput.value.trim() : "";

    if (!activeTokenValue) {
        if (feedbackNode) {
            feedbackNode.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Verification aborted: Token text entry block is completely empty.`;
            feedbackNode.style.color = "#ef4444";
        }
        try { playSFX('error'); } catch(e) {}
        return;
    }

    if (testBtn) {
        testBtn.disabled = true;
        testBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Ping Check...`;
    }
    try { playSFX('aiStart'); } catch(e) {}

    let targetApiResponse = null;

    try {
        const checkRequestTarget = "https://api.github.com/user";
        targetApiResponse = await fetch(checkRequestTarget, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${activeTokenValue}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (targetApiResponse.ok) {
            const apiUserData = await targetApiResponse.json();

            localStorage.setItem('my_github_token', activeTokenValue);

            if (feedbackNode) {
                feedbackNode.innerHTML = `<i class="fas fa-check-circle"></i> Connection Verified! Reloading workspace assets...`;
                feedbackNode.style.color = "#22c55e";
            }
            if (badge) {
                badge.className = "connection-status-pill online";
                if (statusText) statusText.textContent = "Secure Link Online";
            }
            try { playSFX('aiSuccess'); } catch(e) {}

            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } else {
            throw new Error(`Gateway returned credentials error profile code: ${targetApiResponse.status}`);
        }
    } catch (error) {
        console.error("Cloud Node Test Exception:", error);
        if (feedbackNode) {
            feedbackNode.innerHTML = `<i class="fas fa-times-circle"></i> Transaction Rejected: Authentication failed. Verify token access keys scopes permissions configuration.`;
            feedbackNode.style.color = "#ef4444";
        }
        if (badge) {
            badge.className = "connection-status-pill offline";
            if (statusText) statusText.textContent = "Rejection Profile Blocked";
        }
        try { playSFX('error'); } catch(e) {}
    } finally {
        if (testBtn && (!targetApiResponse || !targetApiResponse.ok)) {
            testBtn.disabled = false;
            testBtn.innerHTML = `<i class="fas fa-sync-alt"></i> Test Connection`;
        }
    }
}


function switchAboutTab(tabId, event) {
    document.querySelectorAll('.about-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.about-tab-pane').forEach(pane => pane.classList.remove('active'));
    
    const targetBtn = event ? event.currentTarget : document.querySelector(`.about-tab-btn[onclick*="${tabId}"]`);
    const targetPane = document.getElementById(`about-tab-${tabId}`);
    
    if (targetBtn && targetPane) {
        targetBtn.classList.add('active');
        targetPane.classList.add('active');
    }
}

/* ==========================================================================
   25. OPENROUTER API CREDENTIALS VAULT WORKFLOW MANAGER
   ========================================================================== */
function checkAPIKeyOnLoad() {
    const cachedKey = localStorage.getItem('openrouter_api_key');
    if (!cachedKey) {
        openAPIConfigModal();
    }
}

function openAPIConfigModal() {
    const overlay = document.getElementById('api-config-overlay');
    const inputField = document.getElementById('openRouterKeyInput');
    const errorText = document.getElementById('api-error-diagnostic');
    
    if (!overlay) return;
    if (errorText) errorText.classList.add('hidden');
    if (inputField) inputField.value = localStorage.getItem('openrouter_api_key') || '';
    
    overlay.style.display = 'flex';
    overlay.classList.add('active-panel-show');
    overlay.style.opacity = '1';
}

function closeAPIConfigModal() {
    const overlay = document.getElementById('api-config-overlay');
    if (overlay) {
        overlay.classList.remove('active-panel-show');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 200);
    }
}

function initializeAPIWorkflowListeners() {
    const saveBtn = document.getElementById('saveApiModalBtn');
    const bypassBtn = document.getElementById('bypassApiModalBtn');
    const inputField = document.getElementById('openRouterKeyInput');

    if (saveBtn && inputField) {
        saveBtn.addEventListener('click', () => {
            const rawTokenValue = inputField.value.trim();
            const errorText = document.getElementById('api-error-diagnostic');

            if (!rawTokenValue) {
                if (errorText) {
                    errorText.innerText = "Token string field cannot remain empty.";
                    errorText.classList.remove('hidden');
                }
                return;
            }

            localStorage.setItem('openrouter_api_key', rawTokenValue);
            closeAPIConfigModal();
            try { playSFX('tick'); } catch(e) {}
        });
    }

    if (bypassBtn) {
        bypassBtn.addEventListener('click', () => {
            closeAPIConfigModal();
            try { playSFX('swishClose'); } catch(e) {}
        });
    }
}

/* ==========================================================================
   DRAFT AUTO-SAVE & RECOVERY SYSTEM
   ========================================================================== */
function initDraftAutosave() {
    const titleInput = document.getElementById('eventTitle');
    const contentArea = document.getElementById('eventContent');
    const privacyCheck = document.getElementById('eventPrivacy');
    const dateInput = document.getElementById('eventDate');

    if (!titleInput || !contentArea) return;

    const triggerSave = () => {
        if (!titleInput.value.trim() && !contentArea.value.trim()) {
            clearDraft();
            return;
        }

        const draftPayload = {
            title: titleInput.value,
            content: contentArea.value,
            date: dateInput ? dateInput.value : new Date().toISOString().split('T')[0],
            isPrivate: privacyCheck ? privacyCheck.checked : false,
            spotifyId: document.getElementById('eventSpotifyId') ? document.getElementById('eventSpotifyId').value : '',
            musicTitle: document.getElementById('eventMusicTitle') ? document.getElementById('eventMusicTitle').value : '',
            editingId: AppState.editingId, 
            timestamp: Date.now()
        };

        localStorage.setItem("projectCece_draft_v120", JSON.stringify(draftPayload));
    };

    titleInput.addEventListener('input', triggerSave);
    contentArea.addEventListener('input', triggerSave);
    privacyCheck?.addEventListener('change', triggerSave);
    dateInput?.addEventListener('input', triggerSave);
}

function checkAndShowDraftBanner() {
    const savedDraft = localStorage.getItem("projectCece_draft_v120");
    const bannerId = "draftRestoreBanner";
    
    document.getElementById(bannerId)?.remove();
    if (!savedDraft) return;

    const container = document.querySelector('.workspace-canvas-container');
    const formElement = document.querySelector('.workspace-form-element');
    
    if (!container || !formElement) return;

    const banner = document.createElement('div');
    banner.id = bannerId;
    banner.style.cssText = "background: rgba(96, 165, 250, 0.08); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; box-sizing: border-box; width: 100%; animation: fadeIn 0.3s ease;";

    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 34px; height: 34px; border-radius: 10px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border-color);">
                <i class="fas fa-file-alt"></i>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.8px;">Unsaved Draft Detected</span>
                <span style="font-size: 0.76rem; color: var(--text-muted);">Would you like to recover your last workspace draft?</span>
            </div>
        </div>
        <div style="display: flex; gap: 8px;">
            <button type="button" onclick="discardDraft()" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 0.78rem; cursor: pointer; transition: all 0.2s;">Discard</button>
            <button type="button" onclick="restoreDraft()" style="background: var(--primary); color: #ffffff; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; transition: all 0.2s;">Restore</button>
        </div>
    `;

    container.insertBefore(banner, formElement);
}

window.discardDraft = function() {
    clearDraft();
    document.getElementById("draftRestoreBanner")?.remove();
    try { playSFX('delete'); } catch(e){}
};

window.restoreDraft = function() {
    const savedDraft = localStorage.getItem("projectCece_draft_v120");
    if (!savedDraft) return;

    try {
        const draft = JSON.parse(savedDraft);
        AppState.editingId = draft.editingId;
        
        const formTitle = document.getElementById('formPageTitle');
        if (formTitle) {
            formTitle.textContent = draft.editingId !== null ? 'Edit Entry' : 'Add New Entry';
        }

        document.getElementById('eventTitle').value = draft.title || '';
        document.getElementById('eventContent').value = draft.content || '';
        
        if (draft.date) {
            document.getElementById('eventDate').value = draft.date;
            WritingWorkspaceCalendar.setDate(draft.date);
        }

        const privacyCheckbox = document.getElementById('eventPrivacy');
        if (privacyCheckbox) privacyCheckbox.checked = draft.isPrivate || false;

        if (document.getElementById('eventSpotifyId')) document.getElementById('eventSpotifyId').value = draft.spotifyId || '';
        if (document.getElementById('eventMusicTitle')) document.getElementById('eventMusicTitle').value = draft.musicTitle || '';

        refreshMusicDropdown(draft.spotifyId || "");
        
        document.getElementById("draftRestoreBanner")?.remove();
        try { playSFX('aiSuccess'); } catch(e){}
    } catch(err) {
        console.error("Failed to parse draft string registry data:", err);
    }
};

function clearDraft() {
    localStorage.removeItem("projectCece_draft_v120");
}
// Explicitly expose to the global window so console/Acode can reach it
window.triggerSystemNotification = triggerSystemNotification;
