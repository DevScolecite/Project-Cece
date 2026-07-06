/* ==========================================================================
   1. GLOBAL STATE & TRACKING KEYS
   ========================================================================== */
const GitHubConfig = {
    get token() { return localStorage.getItem("my_github_token"); }, 
    gistId: "8ca46bae0198e82cbe16ff514e314e06",
    filename: "project_cece_diary.json" 
};

const AppState = {
    isAuthenticated: false,
    defaultPin: "0412",
    currentTheme: "theme-light",
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
        isPrivate: false
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
        isPrivate: false
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
        isPrivate: false
    },
    {
        id: 4,
        title: "The Overtaking Tricycle Encounter",
        date: "2026-06-24",
        month: "june",
        content: "But wait, the craziest tricycle moment happened right after that, on Thursday, June 24. I was running late. Usually, I commute around 6:20 to 6:30 AM, pero that day, nakasakay ako ng tricycle around 6:40 AM na. Medyo kabado ako, pero after about 2 kilometers, our tricycle overtook another one on the right lane. I was sitting at the back of the driver, and as we passed them, I looked inside their tricycle. It was her! When I looked back a second time, she was already staring straight at me. We make eye contact for a breathtaking two to three seconds bago ako umiwas ng sinting. Later that day nung lunch time, she came down again, and we shared another quick moment of eye contact.",
        createdAt: "2026-06-24T12:30:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false,
        isPrivate: false
    },
    {
        id: 5,
        title: "Coincidence Returns: Tricycle Gate Synchronization",
        date: "2026-06-23",
        month: "june",
        content: "And you won't believe it, pero the very next day, June 23, the exact same coincidence happened. Crazy as it sounds, we got off different tricycles at the exact same time naman naman. Just another quick glimpse of each other before heading in. Then nung lunch time, she went down again to our floor to meet her friends, and we locked eyes for another solid three seconds.",
        createdAt: "2026-06-23T13:00:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false,
        isPrivate: false
    },
    {
        id: 6,
        title: "First Day of School: Realization & Eye Contact",
        date: "2026-06-22",
        month: "june",
        content: "Now, fast forward to the first official day of school, June 22. Things got a bit funny. Sabay kaming bumaba ng tricycle sa may main gate! We weren't on the same ride, but we arrived at the exact same time. Super nagmamadali ako kasi I was almost late, so I just rushed straight to the gate. Later on, during break time, pumasok siya sa room namin to visit a mutual friend na council member din. That’s when it clicked—Grade 11 din pala siya like me, kasi classmate ko yung friend niya! She already had her uniform on, while the rest of us were still waiting for deliveries. I couldn't help but take quick glimpses of her from time to time. When she smiles, her eyes literally turn into inverted C's. Sobrang cute. We even made eye contact for about two seconds during break, and then another three seconds nung bumalik siya nung lunch time.",
        createdAt: "2026-06-22T16:45:00.000Z",
        lastEditedAt: null,
        isCoreMemory: true,
        isPrivate: false
    },
    {
        id: 7,
        title: "Orientation Day: Very First Interaction",
        date: "2026-06-19",
        month: "june",
        content: "To start things off, let's go back to our orientation day last June 19. After my session, I was just waiting at the waiting area for my friend kasi hindi pa siya tapos. While waiting, I noticed her. Actually, from this point on in the diary, I’m gonna call her 'Chin.' So yeah, I noticed Chin. She was busy snipping some printed designs on a paper. I had a hunch na nasa student council siya kasi she was actively helping out with the event. Then she casually mentioned to her group na they should probably move to the audiovisual room kasi mas malamig doon compared downstairs. Short moment, pero that was our very first interaction. Honestly, akala ko nga Grade 12 si Chin nung una.",
        createdAt: "2026-06-19T10:30:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false,
        isPrivate: false
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
                // 🔒 SECURITY PATCH: Force all private entries to be locked on boot
                AppState.logs = parsedData.map(log => ({ ...log, isRuntimeUnlocked: false }));
                return;
            }
        }
    } catch (e) {
        console.log("Local sync cache empty or clearing.");
    }
    // Also sanitize backup fallback entries just in case
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
                    // 🔒 SECURITY PATCH: Force all cloud-pulled entries to initialize as strictly locked
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

    const initialTokenInput = document.getElementById('githubTokenInput');
    if (initialTokenInput) {
        const savedTokenCache = localStorage.getItem('my_github_token') || '';
        initialTokenInput.value = savedTokenCache;
        
        if (savedTokenCache) {
            const initialStatusText = document.getElementById('tokenStatusText');
            if (initialStatusText) {
                initialStatusText.innerText = "✦ Token active and loaded from cache";
                initialStatusText.style.color = "#22c55e";
                initialStatusText.style.opacity = "1";
            }
        }
    }

    document.getElementById('globalNav')?.classList.add('hidden');

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.floating-action-node')) {
            closeAllActionMenus();
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
   4. GATEWAY SECURITY & NAVIGATION ENGINE (MULTI-ROLE VIEWING UPGRADE)
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

async function processPinSubmission() {
    const role = AppState.userRole || localStorage.getItem('cece_active_role') || 'master';
    const pinStorageKey = role === 'master' ? 'cece_master_pin' : 'cece_visitor_pin';
    const savedPin = localStorage.getItem(pinStorageKey);
    
    if (!savedPin) {
        localStorage.setItem(pinStorageKey, enteredPin);
        updateLockscreenStatus(`${role === 'master' ? 'Master' : 'Visitor'} PIN Set Success! ✦`, false);
        try { playSFX('star'); } catch(e) {}
        await unlockApplication();
    } else {
        if (enteredPin === savedPin) {
            updateLockscreenStatus(role === 'master' ? "Welcome back, Lance! ✦" : "Visitor Session Granted ✦", false);
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
        
        if (typeof switchPage === 'function') {
            switchPage('landing-page');
        } else {
            console.warn("switchPage handle missing. Forcing state cleanup reload.");
            window.location.reload();
        }
        
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
    const container = document.querySelector('.pin-dots-container');
    if (container) { container.style.animation = 'none'; container.offsetHeight; container.style.animation = 'shake 0.35s ease'; }
}

/* ==========================================================================
   5. NAVIGATION ENGINE & SIDEBAR DRAWER CONTROLLER
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
   7. INTERACTIVE TIMELINE ENGINE RENDERING
   ========================================================================== */
function renderTimeline(dataArray) {
    const container = document.getElementById("timelineContainer");
    if (!container) return;

    container.innerHTML = "";

    if (!dataArray || dataArray.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No logs found for this filter frame.</p>`;
        return;
    }

    const sortedData = [...dataArray].sort((a, b) => new Date(b.date) - new Date(a.date));
    const isConcealed = AppState && AppState.privacyConcealed;

    sortedData.forEach((item, index) => {
        const timelineItem = document.createElement("div");
        timelineItem.className = "timeline-item animate-slide-up";
        timelineItem.style.animationDelay = `${index * 0.04}s`;

        let publishedDateFormatted = "Date Unavailable";
        const targetDate = item.createdAt || item.date;
        if (targetDate) {
            const parsedDate = new Date(targetDate);
            if (!isNaN(parsedDate.getTime())) {
                publishedDateFormatted = parsedDate.toLocaleDateString("en-US", {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit'
                });
            }
        }

        let updateStampMark = '';
        if (item.lastEditedAt) {
            const editDate = new Date(item.lastEditedAt);
            if (!isNaN(editDate.getTime())) {
                const editDateFormatted = editDate.toLocaleDateString("en-US", {
                    month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                });
                updateStampMark = `<div class="timestamp-node-stamp">| Last edited: <span>${editDateFormatted}</span></div>`;
            }
        }

        const memoryGlowClass = item.isCoreMemory ? "core-memory-active" : "";
        
        let displayTitle = item.title;
        let displayContent = item.content;
        let privacyCardClass = "";
        let lockOverlayMarkup = "";
        
        const shouldBlurText = isConcealed || (item.isPrivate && !item.isRuntimeUnlocked);

        if (isConcealed) {
            displayTitle = "Concealed Workspace Entry";
            displayContent = "•••••••• •••••••• •••••••• •••••••• •••••••• •••••••• •••••••• ••••••••";
            privacyCardClass = "privacy-concealed-card";
        } else if (item.isPrivate && !item.isRuntimeUnlocked) {
            privacyCardClass = "log-locked-card";
            lockOverlayMarkup = `
                <div class="log-lock-overlay" onclick="openPinModalForLog('${item.id}', 'reveal')">
                    <div class="lock-overlay-content">
                        <span class="lock-title">🔒 Access Denied</span>
                        <span class="lock-subtitle">Protected Entry • Click to enter PIN</span>
                    </div>
                </div>
            `;
        }

        const clickAttribute = isConcealed ? "" : `onclick="handleTimelineCardClick('${item.id}', event)"`;

        const activeRole = AppState.userRole || localStorage.getItem('cece_active_role') || 'master';
        const hideActionsForVisitor = (isConcealed || activeRole === 'visitor') ? 'style="display:none !important;"' : '';

        timelineItem.innerHTML = `
            <div class="timeline-left">
                <div class="timeline-date ${isConcealed ? 'privacy-blurred-text' : ''}">${formatDisplayDate(item.date)}</div>
            </div>
            <div class="timeline-badge"></div>
            <div class="timeline-right">
                <div class="timeline-body-card ${memoryGlowClass} ${privacyCardClass}">
                    
                    <div class="floating-action-node" ${hideActionsForVisitor}>
                        <button class="dots-trigger-btn" onclick="toggleActionMenu('${item.id}', event)">•••</button>
                        <div id="dropdown-${item.id}" class="action-menu-dropdown">
                            <button onclick="toggleCoreMemoryState('${item.id}')">
                                ${item.isCoreMemory ? '✦ Unstar Memory' : '✦ Star Core Memory'}
                            </button>
                            <button onclick="prepareEditForm('${item.id}')">✎ Edit Entry</button>
                            <button class="delete-action-btn" onclick="deleteEntry('${item.id}')">🗑 Delete</button>
                        </div>
                    </div>

                    <div class="card-header-row">
                        <div class="timeline-title ${shouldBlurText ? 'privacy-blurred-text' : ''}">${displayTitle}</div>
                    </div>

                    <div id="narrative-${item.id}" 
                         class="text-narrative-container ${isConcealed ? 'privacy-lock' : ''} ${(item.isPrivate && !item.isRuntimeUnlocked) && !isConcealed ? 'narrative-locked-state' : ''}" 
                         ${clickAttribute}>
                        
                        <div class="timeline-text-content ${shouldBlurText ? 'privacy-blurred-text' : ''}">${displayContent}</div>
                        
                        ${(item.isPrivate && !item.isRuntimeUnlocked) && !isConcealed ? lockOverlayMarkup : (isConcealed ? '' : '<div class="read-more-indicator">↓ Read More</div>')}
                    </div>

                    <div class="timestamp-matrix-row" ${isConcealed ? 'style="visibility: hidden; opacity: 0; pointer-events: none;"' : ''}>
                        <div class="timestamp-node-stamp">Published: <span>${publishedDateFormatted}</span></div>
                        ${updateStampMark}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(timelineItem);
    });

    if (typeof enforceRolePermissions === "function") {
        enforceRolePermissions();
    }
}

/* ==========================================================================
   🔒 INTERACTIVE MODAL ENTRY LOCK CONTROLS (UNIFIED SECURITY PORTAL)
   ========================================================================== */
let modalPinBuffer = "";
let currentTargetLogId = null; 
let currentTargetMode = "reveal"; 

function handleTimelineCardClick(id, event) {
    if (event.target.closest('.floating-action-node')) return;
    
    const selectedMemory = AppState.logs.find(log => log.id == id);
    if (selectedMemory) {
        if (selectedMemory.isPrivate && !selectedMemory.isRuntimeUnlocked) {
            openPinModalForLog(id, "reveal");
        } else {
            toggleExpandEntry(id);
        }
    }
}

function openPinModalForLog(logId, mode = "reveal") {
    currentTargetLogId = logId;
    currentTargetMode = mode;
    clearModalPin(); 
    
    const errNode = document.getElementById("pinErrorMessage");
    const modalNode = document.getElementById("pinVerificationModal");
    
    if (errNode) errNode.style.display = "none";
    if (modalNode) {
        modalNode.style.display = "flex";
        modalNode.classList.remove("hidden");
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
            if (i <= modalPinBuffer.length) {
                dot.classList.add('active-filled', 'filled');
            } else {
                dot.classList.remove('active-filled', 'filled');
            }
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
        if (errorAlertNode) errorAlertNode.style.display = "none";
        
        if (currentTargetLogId) {
            AppState.logs = AppState.logs.map(log => {
                if (log.id == currentTargetLogId) {
                    return { ...log, isRuntimeUnlocked: true };
                }
                return log;
            });
        }
if (modalPinBuffer === savedMasterPin.toString()) {
        // ✅ SUCCESS: Play star sfx
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

        // ... (keep the rest of your existing logic for reveal/edit/capsule modes)
        
        closePinModal();
        console.log(`Security clearance granted.`);
    } else {
        // ❌ FAILURE: Play delete sfx
        try { playSFX('delete'); } catch(e) {}
        
        if (errorAlertNode) errorAlertNode.style.display = "block";
        triggerShakeAnimation();
        clearModalPin(); 
        console.warn("Authentication Exception: Security handshake mismatch.");
    }
    
        if (currentTargetMode === "reveal") {
            if (currentTargetLogId) {
                const narrativeContainer = document.getElementById(`narrative-${currentTargetLogId}`);
                if (narrativeContainer) {
                    narrativeContainer.classList.remove("narrative-locked-state");
                    
                    const blurredTextElements = narrativeContainer.closest(".timeline-body-card").querySelectorAll(".privacy-blurred-text");
                    blurredTextElements.forEach(el => el.classList.remove("privacy-blurred-text"));
                    
                    const lockOverlay = narrativeContainer.querySelector(".log-lock-overlay");
                    if (lockOverlay) lockOverlay.remove();
                    
                    const parentCard = narrativeContainer.closest(".timeline-body-card");
                    if (parentCard) parentCard.classList.remove("log-locked-card");
                }
                
                // 🔒 PATCHED SECURITY LAYER: Auto-re-lock after exactly 5 minutes (300,000ms)
                const lockedLogIdCapture = currentTargetLogId; 
                setTimeout(() => {
                    console.log(`[Security Privacy] 5 minutes elapsed. Re-locking log ID: ${lockedLogIdCapture}`);
                    AppState.logs = AppState.logs.map(log => {
                        if (log.id == lockedLogIdCapture) {
                            return { ...log, isRuntimeUnlocked: false };
                        }
                        return log;
                    });
                    renderTimeline(AppState.logs);
                }, 300000); 
            }
        } else if (currentTargetMode === "edit") {
            executeActualEditForm(currentTargetLogId);
        } else if (currentTargetMode === "capsule") {
            executeActualCapsuleDisplay(currentTargetLogId);
        }
        
        closePinModal();
        console.log(`Security clearance granted. Mode Pipeline: [${currentTargetMode}] executed.`);
    } else {
        if (errorAlertNode) errorAlertNode.style.display = "block";
        triggerShakeAnimation();
        clearModalPin(); 
        try { playSFX('error'); } catch(e) {}
        console.warn("Authentication Exception: Security handshake mismatch.");
    }
}

function openMemoryModalDirectly(selectedMemory) {
    const modal = document.getElementById("flashbackModal");
    if (!modal) return;

    document.getElementById("flashbackTitle").innerText = selectedMemory.title;
    document.getElementById("flashbackDate").innerText = new Date(selectedMemory.date).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const contentEl = document.getElementById("flashbackContent");
    contentEl.innerText = selectedMemory.content;

    document.getElementById("modalLockShield")?.remove();
    contentEl.classList.remove("privacy-protected-blur");

    modal.classList.remove("hidden");
    modal.style.display = "flex";
    try { playSFX('popup'); } catch(e) {}
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return "N/A";
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) return "N/A";
    return parsedDate.toLocaleDateString("en-US", { month: 'short', day: '2-digit' });
}

function toggleExpandEntry(id) {
    const block = document.getElementById(`narrative-${id}`);
    if (!block) return;
    
    const isClosing = block.classList.contains("is-expanded");
    
    block.classList.toggle("is-expanded");
    try { playSFX('click'); } catch(e) {}

    if (isClosing) {
        const logEntry = AppState.logs.find(log => log.id == id);
        if (logEntry && logEntry.isPrivate) {
            logEntry.isRuntimeUnlocked = false;
            setTimeout(() => {
                renderTimeline(AppState.logs);
            }, 180); 
        }
    }
}

function toggleActionMenu(id, event) {
    if (event) event.stopPropagation();
    const targetDropdown = document.getElementById(`dropdown-${id}`);
    const isCurrentlyOpen = targetDropdown ? targetDropdown.classList.contains("open-active") : false;
    
    closeAllActionMenus();
    
    if (targetDropdown && !isCurrentlyOpen) {
        targetDropdown.classList.add("open-active");
        playSFX('popup');
    }
}

/* ==========================================================================
   8. DIARY ENTRY LOG MANAGEMENT (CRUD)
   ========================================================================== */
function closeAllActionMenus() {
    document.querySelectorAll(".action-menu-dropdown").forEach(dropdown => {
        dropdown.classList.remove("open-active");
    });
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
    
    const contentField = document.getElementById('eventContent');
    if (contentField) contentField.value = '';
    
    const privacyCheckbox = document.getElementById('eventPrivacy');
    if (privacyCheckbox) privacyCheckbox.checked = false;
    
    const formTitle = document.getElementById('formPageTitle');
    if (formTitle) formTitle.textContent = 'Add New Entry';
    
    switchPage('create-log-page');
}

function prepareEditForm(logId) {
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }

    const targetLog = AppState.logs.find(item => item.id == logId);
    if (!targetLog) {
        console.error(`Runtime Error: Log entry with ID [${logId}] was not found in AppState.`);
        return;
    }
    
    if (targetLog.isPrivate && !targetLog.isRuntimeUnlocked) {
        openPinModalForLog(logId, "edit");
        return; 
    }
    
    executeActualEditForm(logId);
}

function executeActualEditForm(logId) {
    const targetLog = AppState.logs.find(item => item.id == logId);
    if (!targetLog) return;

    console.log(`[Security Clearance Approved] Modifying entry ID: ${logId}`);

    AppState.editingId = Number(logId);
    
    const formTitle = document.getElementById('formPageTitle');
    if (formTitle) {
        formTitle.textContent = 'Edit Entry';
    }
    
    document.getElementById('eventTitle').value = targetLog.title || '';
    document.getElementById('eventDate').value = targetLog.date || '';
    
    const contentField = document.getElementById('eventContent');
    if (contentField) {
        contentField.value = targetLog.content || '';
    }
    
    const privacyCheckbox = document.getElementById('eventPrivacy');
    if (privacyCheckbox) {
        privacyCheckbox.checked = targetLog.isPrivate || false;
    }
    
    switchPage('create-log-page');
}

async function publishNewEvent() {
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }
    
    const titleVal = document.getElementById("eventTitle").value.trim();
    const dateVal = document.getElementById("eventDate").value;
    const contentVal = document.getElementById("eventContent").value.trim();
    const privacyVal = document.getElementById("eventPrivacy") ? document.getElementById("eventPrivacy").checked : false;

    if (!titleVal || !dateVal || !contentVal) {
        alert("Please complete all workspace input fields before saving.");
        return;
    }

    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const parsedMonthIndex = new Date(dateVal).getMonth();
    const computedMonthLabel = monthNames[parsedMonthIndex];

    if (AppState.editingId !== null) {
        AppState.logs = AppState.logs.map(log => {
            if (log.id == AppState.editingId) {
                return {
                    ...log,
                    title: titleVal,
                    date: dateVal,
                    month: computedMonthLabel,
                    content: contentVal,
                    isPrivate: privacyVal,
                    lastEditedAt: new Date().toISOString()
                };
            }
            return log;
        });
        AppState.editingId = null; 
    } else {
        const newRecord = {
            id: Date.now(),
            title: titleVal,
            date: dateVal,
            month: computedMonthLabel,
            content: contentVal,
            isPrivate: privacyVal,
            createdAt: new Date().toISOString(),
            lastEditedAt: null,
            isCoreMemory: false
        };
        AppState.logs.push(newRecord);
    }

    const saveButton = document.querySelector("button[onclick='publishNewEvent()']");
    const originalBtnText = saveButton ? saveButton.innerHTML : "Save Entry";

    if (saveButton) {
        saveButton.innerHTML = "✦ Cloud Syncing...";
        saveButton.disabled = true;
    }

    saveToLocalStorage();
    
    try {
        const cloudSuccess = await saveToGist();
        
        if (cloudSuccess) {
            updateDashboardMetrics();
            try { playSFX('publish'); } catch (audioErr) {}
            const filterMenu = document.getElementById("monthFilter");
            if (filterMenu) filterMenu.value = "all";
            renderTimeline(AppState.logs);
            switchPage("logs-page");
        } else {
            if (GitHubConfig.token && GitHubConfig.gistId) {
                alert("Cloud Sync Failure: Saved locally, but couldn't reach GitHub API.");
                updateDashboardMetrics();
                renderTimeline(AppState.logs);
                switchPage("logs-page");
            }
        }
    } catch (networkError) {
        console.error("Critical Cloud Gateway Error:", networkError);
        alert("A connectivity exception blocked your Gist cloud transaction. Local backup retained.");
        
        updateDashboardMetrics();
        renderTimeline(AppState.logs);
        switchPage("logs-page");
    } finally { 
        if (saveButton) {
            saveButton.innerHTML = originalBtnText;
            saveButton.disabled = false;
        }
    }
}

async function deleteEntry(id) {
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

async function toggleCoreMemoryState(id) {
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        showAccessDeniedModal();
        return;
    }

    AppState.logs = AppState.logs.map(log => {
        if (log.id == id) {
            return { ...log, isCoreMemory: !log.isCoreMemory };
        }
        return log;
    });
    
    saveToLocalStorage();
    updateDashboardMetrics();
    try { playSFX('star'); } catch(e){}
    await saveToGist();
    filterTimelineByMonth();
}

/* ==========================================================================
   9. INTERACTIVE RANDOM CAPSULE MECHANISMS
   ========================================================================== */
function launchRandomMemoryCapsule() {
    if (!AppState || !AppState.logs || AppState.logs.length === 0) {
        alert("Your timeline capsule is currently empty.");
        return;
    }
    
    if (AppState.privacyConcealed) {
        alert("🔒 Privacy Concealment Active: Please deactivate privacy mode to open memory flashback capsules.");
        return;
    }

    const randomIndex = Math.floor(Math.random() * AppState.logs.length);
    const selectedMemory = AppState.logs[randomIndex];

    if (selectedMemory.isPrivate && !selectedMemory.isRuntimeUnlocked) {
        openPinModalForLog(selectedMemory.id, "capsule");
        return; 
    }

    executeActualCapsuleDisplay(selectedMemory.id);
}

function executeActualCapsuleDisplay(entryId) {
    const selectedMemory = AppState.logs.find(log => log.id == entryId);
    if (!selectedMemory) return;

    document.getElementById("flashbackTitle").innerText = selectedMemory.title;
    document.getElementById("flashbackDate").innerText = new Date(selectedMemory.date).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById("flashbackContent").innerText = selectedMemory.content;
    
    const flashbackModalFrame = document.getElementById("flashbackModal");
    if (flashbackModalFrame) {
        flashbackModalFrame.classList.remove("hidden");
        flashbackModalFrame.style.display = "flex"; 
    }
    
    playSFX('popup');
}

function closeFlashbackModal() {
    const flashbackModalFrame = document.getElementById("flashbackModal");
    if (flashbackModalFrame) {
        flashbackModalFrame.classList.add("hidden");
        flashbackModalFrame.style.display = "none";
    }
    document.getElementById("modalLockShield")?.remove(); 
    playSFX('swishClose');
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
    aiButton.innerHTML = "✦ Polishing text...";
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
            console.log("Success: Workspace entry enhanced via GPT-OSS-20B free tier.");
        } else {
            if (data.error) {
                alert(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
            } else {
                alert("OpenRouter Error Details:\n" + JSON.stringify(data));
            }
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
   10. PERSONALIZATION INTERFACE ENGINE (THEMES & TYPOGRAPHY)
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
        'light': 'theme-light', 
        'dark': 'theme-dark', 
        'sunset': 'theme-sunset',
        'crimson': 'theme-crimson', 
        'sepia': 'theme-sepia', 
        'army': 'theme-army'
    };

    let calculatedThemeClass = classThemeBridge[themeName] || "theme-light";
    document.body.classList.add(calculatedThemeClass);
    AppState.currentTheme = calculatedThemeClass;
    playSFX('click');

    const labelMapping = {
        'theme-light': 'Light Minimalist', 
        'theme-dark': 'Dark Midnight',
        'theme-sunset': 'Sunset Warmth', 
        'theme-crimson': 'Crimson Richness',
        'theme-sepia': 'Earthy Sepia', 
        'theme-army': 'Army Olive Drab'
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

    if (!fontSlider) {
        console.error("Slider element [premiumFontSlider] not found in DOM.");
        return;
    }

    // Force an initial update based on existing value
    const initialVal = fontSlider.value;
    document.documentElement.style.setProperty("--text-scale-percentage", (initialVal / 100));

    fontSlider.addEventListener("input", function() {
        const val = this.value;
        const multiplier = val / 100;
        
        if (fontDisplay) fontDisplay.innerText = val + "%";
        
        // This targets the root HTML tag directly
        document.documentElement.style.setProperty("--text-scale-percentage", multiplier);
        
        // Optional: Save to localStorage so it persists on refresh
        localStorage.setItem("user_font_scale", val);
        
        console.log("Slider moved to:", val, "Multiplier:", multiplier);
    });
}


/* ==========================================================================
   11. SFX AUDIO ENGINE
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
        
        if (isNaN(currentVol) || currentVol <= 0.01) currentVol = 0;
        if (currentVol > 1) currentVol = currentVol / 100; 
        currentVol = Math.max(0, Math.min(1, currentVol));

        sfxSounds[type].volume = currentVol;
        if (currentVol > 0) {
            sfxSounds[type].play().catch(() => console.log(`SFX [${type}] muted by system policy.`));
        }
    }
}

function playSystemSfx(soundNameOrSrc) {
    if (sfxSounds[soundNameOrSrc]) {
        playSFX(soundNameOrSrc);
    } else {
        const sfxToggle = document.getElementById('sfxToggle');
        if (sfxToggle && !sfxToggle.checked) return;

        const dynamicAudio = new Audio(soundNameOrSrc);
        let currentVol = localStorage.getItem('sfx_volume') !== null ? parseFloat(localStorage.getItem('sfx_volume')) : 0.4;
        if (currentVol > 1) currentVol = currentVol / 100;
        dynamicAudio.volume = Math.max(0, Math.min(1, currentVol));
        dynamicAudio.play().catch(() => {});
    }
}

/* ==========================================================================
   12. USER WORKSPACE LAUNCHERS
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
            statusText.innerText = "✦ Saved securely to cache";
            statusText.style.color = "#22c55e"; 
            statusText.style.opacity = "1";
            try { playSFX('tick'); } catch(e) {}
        } else {
            statusText.innerText = "⚠ Token removed from system memory";
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
    try {
        playSFX(AppState.privacyConcealed ? 'tick' : 'popup');
    } catch(e) {}
    
    const linkedToggles = document.querySelectorAll('.privacy-conceal-checkbox');
    linkedToggles.forEach(box => {
        box.checked = AppState.privacyConcealed;
    });
    renderTimeline(AppState.logs);
}

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
    
    setTimeout(() => { 
        overlay.style.display = 'none'; 
    }, 200);
}
