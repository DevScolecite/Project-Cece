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
    logs: [] 
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
        isCoreMemory: false
    },
    {
        id: 2,
        title: "Classroom Teasing Incident",
        date: "2026-07-02",
        month: "july",
        content: "Then just yesterday, July 2, things took a totally different turn from our usual eye contacts. After eating lunch, I was standing up by my seat, fixing my bag and putting away my lunchbox. I was facing the back of the classroom. Chin was at the back right of our room chatting with her friends. Out of nowhere, my classmate Jillian shouted, 'Lance, Lance, hide out!' to tease her. When I looked over, Chin turned around to face me. I initially thought the teasing was about someone else, but when she turned, we locked eyes for three to four seconds. Neither of us broke eye contact. After a few seconds, she walked away to make space for Jillian, who was actually sitting right behind her. Jillian looked so embarrassed because of the teasing, but Chin just kept that natural connection with me the whole time.",
        createdAt: "2026-07-02T14:15:00.000Z",
        lastEditedAt: null,
        isCoreMemory: true
    },
    {
        id: 3,
        title: "Unbroken Corridor Eye Contact",
        date: "2026-06-29",
        month: "june",
        content: "Umuulan nung umagang 'yon, kayasa corridor sa harap ng room namin ginawa yung morning assembly. Fast forward to our second afternoon break around 2:00 PM. I usually switch seats to sit next to my close friend during breaks. I was sitting in the middle row, facing the door, when she walked by. She was already looking at me before she even crossed the doorway. As she walked past, she literally turned her head toward me and kept her eyes locked on mine until she disappeared from my view. That was a solid three to four seconds of unbroken eye contact. After that, medyo nagka-gap yung sequence namin kasi I got sick. I was absent nung Friday for the defreezing activity kasi medyo mahiyain ako, and then I caught a stomach ache over the weekend na umabot hanggang Monday.",
        createdAt: "2026-06-29T14:00:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false
    },
    {
        id: 4,
        title: "The Overtaking Tricycle Encounter",
        date: "2026-06-24",
        month: "june",
        content: "But wait, the craziest tricycle moment happened right after that, on Thursday, June 24. I was running late. Usually, I commute around 6:20 to 6:30 AM, pero that day, nakasakay ako ng tricycle around 6:40 AM na. Medyo kabado ako, pero after about 2 kilometers, our tricycle overtook another one on the right lane. I was sitting at the back of the driver, and as we passed them, I looked inside their tricycle. It was her! When I looked back a second time, she was already staring straight at me. We made eye contact for a breathtaking two to three seconds bago ako umiwas ng tingin. Later that day nung lunch time, she came down again, and we shared another quick moment of eye contact.",
        createdAt: "2026-06-24T12:30:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false
    },
    {
        id: 5,
        title: "Coincidence Returns: Tricycle Gate Synchronization",
        date: "2026-06-23",
        month: "june",
        content: "And you won't believe it, pero the very next day, June 23, the exact same coincidence happened. Crazy as it sounds, we got off different tricycles at the exact same time naman naman. Just another quick glimpse of each other before heading in. Then nung lunch time, she went down again to our floor to meet her friends, and we locked eyes for another solid three seconds.",
        createdAt: "2026-06-23T13:00:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false
    },
    {
        id: 6,
        title: "First Day of School: Realization & Eye Contact",
        date: "2026-06-22",
        month: "june",
        content: "Now, fast forward to the first official day of school, June 22. Things got a bit funny. Sabay kaming bumaba ng tricycle sa may main gate! We weren't on the same ride, but we arrived at the exact same time. Super nagmamadali ako kasi I was almost late, so I just rushed straight to the gate. Later on, during break time, pumasok siya sa room namin to visit a mutual friend na council member din. That’s when it clicked—Grade 11 din pala siya like me, kasi classmate ko yung friend niya! She already had her uniform on, while the rest of us were still waiting for deliveries. I couldn't help but take quick glimpses of her from time to time. When she smiles, her eyes literally turn into inverted C's. Sobrang cute. We even made eye contact for about two seconds during break, and then another three seconds nung bumalik siya nung lunch time.",
        createdAt: "2026-06-22T16:45:00.000Z",
        lastEditedAt: null,
        isCoreMemory: true
    },
    {
        id: 7,
        title: "Orientation Day: Very First Interaction",
        date: "2026-06-19",
        month: "june",
        content: "To start things off, let's go back to our orientation day last June 19. After my session, I was just waiting at the waiting area for my friend kasi hindi pa siya tapos. While waiting, I noticed her. Actually, from this point on in the diary, I’m gonna call her 'Chin.' So yeah, I noticed Chin. She was busy snipping some printed designs on a paper. I had a hunch na nasa student council siya kasi she was actively helping out with the event. Then she casually mentioned to her group na they should probably move to the audiovisual room kasi mas malamig doon compared downstairs. Short moment, pero that was our very first interaction. Honestly, akala ko nga Grade 12 si Chin nung una.",
        createdAt: "2026-06-19T10:30:00.000Z",
        lastEditedAt: null,
        isCoreMemory: false
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
                AppState.logs = parsedData;
                return;
            }
        }
    } catch (e) {
        console.log("Local sync cache empty or clearing.");
    }
    AppState.logs = [...initialBackupEntries];
}

async function loadFromGist() {
    if (!GitHubConfig.token || !GitHubConfig.gistId) {
        console.warn("Cloud credentials missing. Falling back to local backup entries.");
        loadFromLocalStorage();
        return;
    }

    const url = `https://api.github.com/gists/${GitHubConfig.gistId}`;
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
            AppState.logs = JSON.parse(diaryFile.content);
            saveToLocalStorage(); 
            console.log("Cloud sync successful: Live logs pulled from Gist.");
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
        alert("Cannot save to cloud: Missing GitHub Token or Gist ID in settings.");
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

    // Smart initialization checker for existing cloud access tokens
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
    switchPage('landing-page'); 

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

    // --- VOLUME & SFX SLIDER SETUP ---
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
            
            // 🎵 CHANGED: Replaced the old 'error' buzz with the tech-focused 'aiStart' chime!
            try { playSFX('aiStart'); } catch(e) {}
            
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
// Opens the custom confirmation dialog with a smooth entry animation
// Opens the custom confirmation dialog with the aiStart chime
function showLogoutModal() {
    const overlay = document.getElementById('logout-modal-overlay');
    if (!overlay) return;
    
    // 🎵 Modern intro chime on open
    try { playSFX('aiStart'); } catch(e) {} 
    
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('.custom-modal-card').style.transform = 'scale(1)';
    }, 20);
}


// Closes the modal with a smooth exit animation
// Opens the custom confirmation dialog

// Closes the modal safely if they click Cancel
function closeLogoutModal() {
    const overlay = document.getElementById('logout-modal-overlay');
    if (!overlay) return;
    
    try { playSFX('swishClose'); } catch(e) {} // Light dismiss sound
    
    overlay.style.opacity = '0';
    overlay.querySelector('.custom-modal-card').style.transform = 'scale(0.92)';
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 200);
}

// Executes the final security wipe sequence
function executeLogout() {
    // 🎵 Plays your custom delete SFX right as the data clears!
    try { playSFX('delete'); } catch(e) {} 
    
    closeLogoutModal();
    
    // 1. Reset local tracking state
    AppState.isAuthenticated = false;
    AppState.userRole = null;
    AppState.logs = []; 
    
    // 2. Tear down authorization keys from storage
    localStorage.removeItem('cece_user_authenticated');
    localStorage.removeItem('cece_active_role');
    
    // 3. Reset security PIN components
    clearPin();
    
    // 4. Secure the viewport interface
    document.getElementById('globalNav')?.classList.add('hidden');
    
    // 5. Redirect cleanly to the root landing interface
    switchPage('landing-page');
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
        enforceRolePermissions(); // Links the UI rules
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
   ========================================================================== */
function switchPage(pageId) {
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
    }
} 

function toggleDrawer(action) {
    const drawer = document.getElementById('sideDrawer') || document.getElementById('navDrawer') || document.getElementById('globalNavLinks');
    if (!drawer) {
        console.warn("Navigation drawer element container not found in DOM.");
        return;
    }

    if (action === false) {
        drawer.classList.remove('drawer-open');
    } else if (action === true) {
        drawer.classList.add('drawer-open');
    } else {
        const isOpen = drawer.classList.toggle('drawer-open');
        if (isOpen) {
            try { playSFX('swishOpen'); } catch(e) {}
        } else {
            try { playSFX('swishClose'); } catch(e) {}
        }
    }
}

function handleSfxToggle(checkbox) {
    localStorage.setItem('sfxEnabled', checkbox.checked);
}

function navigateFromMenu(targetFrame) {
    try { playSFX('click'); } catch(e) {}
    const pageId = `${targetFrame}-page`; 
    switchPage(pageId);
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

        timelineItem.innerHTML = `
            <div class="timeline-left">
                <div class="timeline-date">${formatDisplayDate(item.date)}</div>
            </div>
            <div class="timeline-badge"></div>
            <div class="timeline-right">
                <div class="timeline-body-card ${memoryGlowClass}">
                    <div class="floating-action-node">
                        <button class="dots-trigger-btn" onclick="toggleActionMenu(${item.id}, event)">•••</button>
                        <div id="dropdown-${item.id}" class="action-menu-dropdown">
                            <button onclick="toggleCoreMemoryState(${item.id})">
                                ${item.isCoreMemory ? '✦ Unstar Memory' : '✦ Star Core Memory'}
                            </button>
                            <button onclick="prepareEditForm(${item.id})">✎ Edit Entry</button>
                            <button class="delete-action-btn" onclick="deleteEntry(${item.id})">🗑 Delete</button>
                        </div>
                    </div>
                    <div class="card-header-row">
                        <div class="timeline-title">${item.title}</div>
                    </div>
                    <div id="narrative-${item.id}" class="text-narrative-container" onclick="toggleExpandEntry(${item.id})">
                        <div class="timeline-text-content">${item.content}</div>
                        <div class="read-more-indicator">↓ Read More</div>
                    </div>
                    <div class="timestamp-matrix-row">
                        <div class="timestamp-node-stamp">Published: <span>${publishedDateFormatted}</span></div>
                        ${updateStampMark}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(timelineItem);
    });

    // Run the permission checker to strip out controls if a visitor is active
    enforceRolePermissions();
}


function formatDisplayDate(dateStr) {
    if (!dateStr) return "N/A";
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) return "N/A";
    return parsedDate.toLocaleDateString("en-US", { month: 'short', day: '2-digit' });
}

function toggleExpandEntry(id) {
    const block = document.getElementById(`narrative-${id}`);
    if (block) {
        block.classList.toggle("is-expanded");
        playSFX('click');
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

function closeAllActionMenus() {
    document.querySelectorAll(".action-menu-dropdown").forEach(dropdown => {
        dropdown.classList.remove("open-active");
    });
}

/* ==========================================================================
   8. DIARY ENTRY LOG MANAGEMENT (CRUD)
   ========================================================================== */
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
    // Shield to prevent visitor write/delete execution

//  NEW WAY (Replace it with this):
if (AppState.userRole === 'visitor') {
    showAccessDeniedModal(); 
    return;
}


    playSFX('click');
    AppState.editingId = null;
    document.getElementById("formPageTitle").innerText = "Add New Entry";
    document.getElementById("eventTitle").value = "";
    document.getElementById("eventDate").value = new Date().toISOString().split('T')[0];
    document.getElementById("eventContent").value = "";
    switchPage("create-log-page");
}

function prepareEditForm(id) {
    // Shield to prevent visitor write/delete execution
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        alert("Access Denied: Visitor profile is strictly restricted to read-only mode.");
        return;
    }

    const entryToEdit = AppState.logs.find(log => log.id === id);
    if (!entryToEdit) return;

    AppState.editingId = id;
    document.getElementById("formPageTitle").innerText = "Edit Entry Workspace";
    document.getElementById("eventTitle").value = entryToEdit.title;
    document.getElementById("eventDate").value = entryToEdit.date;
    document.getElementById("eventContent").value = entryToEdit.content;
    
    switchPage("create-log-page");
    closeAllActionMenus();
    playSFX('click');
}

async function publishNewEvent() {
    // Shield to prevent visitor write/delete execution
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        alert("Access Denied: Visitor profile is strictly restricted to read-only mode.");
        return;
    }

    const titleVal = document.getElementById("eventTitle").value.trim();
    const dateVal = document.getElementById("eventDate").value;
    const contentVal = document.getElementById("eventContent").value.trim();

    if (!titleVal || !dateVal || !contentVal) {
        alert("Please complete all workspace input fields before saving.");
        return;
    }

    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const parsedMonthIndex = new Date(dateVal).getMonth();
    const computedMonthLabel = monthNames[parsedMonthIndex];

    if (AppState.editingId !== null) {
        AppState.logs = AppState.logs.map(log => {
            if (log.id === AppState.editingId) {
                return {
                    ...log,
                    title: titleVal,
                    date: dateVal,
                    month: computedMonthLabel,
                    content: contentVal,
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
            alert("Cloud Sync Failure: Saved locally, but couldn't reach GitHub.");
        }
    } catch (networkError) {
        console.error("Critical Cloud Gateway Error:", networkError);
        alert("A connectivity exception blocked your Gist cloud transaction. Local backup retained.");
    } finally { 
        if (saveButton) {
            saveButton.innerHTML = originalBtnText;
            saveButton.disabled = false;
        }
    }
}

async function deleteEntry(id) {
    // Shield to prevent visitor write/delete execution
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        alert("Access Denied: Visitor profile is strictly restricted to read-only mode.");
        return;
    }

    if (confirm("Are you sure you want to completely erase this memory entry?")) {
        AppState.logs = AppState.logs.filter(log => log.id !== id);
        saveToLocalStorage();
        updateDashboardMetrics();
        try { playSFX('delete'); } catch(e){}
        await saveToGist();
        filterTimelineByMonth();
    }
}

async function toggleCoreMemoryState(id) {
    // Shield to prevent visitor write/delete execution
    if (AppState.userRole === 'visitor' || localStorage.getItem('cece_active_role') === 'visitor') {
        alert("Access Denied: Visitor profile is strictly restricted to read-only mode.");
        return;
    }

    AppState.logs = AppState.logs.map(log => {
        if (log.id === id) {
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
    if (AppState.logs.length === 0) {
        alert("Your timeline capsule is currently empty.");
        return;
    }
    const randomIndex = Math.floor(Math.random() * AppState.logs.length);
    const selectedMemory = AppState.logs[randomIndex];

    document.getElementById("flashbackTitle").innerText = selectedMemory.title;
    document.getElementById("flashbackDate").innerText = new Date(selectedMemory.date).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById("flashbackContent").innerText = selectedMemory.content;
    document.getElementById("flashbackModal").classList.remove("hidden");
    playSFX('popup');
}

function closeFlashbackModal() {
    document.getElementById("flashbackModal").classList.add("hidden");
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
                "Authorization": `Bearer ${savedKey}`
            },
            body: JSON.stringify({
                model: "openrouter/free", 
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant built into 'Project Cece', a secure personal workspace diary. Your job is to fix the conversational grammar, clear up typos, and smooth out the flow of the diary entry provided below. Keep the writer's authentic tone—just make it sound crisp and polished. Important: Reply ONLY with the corrected diary text. Do not add any greeting, intro, conversational commentary, or quotation marks around the result."
                    },
                    { role: "user", content: originalText }
                ]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
            contentField.value = data.choices[0].message.content.trim();
            playSFX('aiSuccess');
            console.log("Success: Workspace entry enhanced via OpenRouter.");
        } else {
            alert("OpenRouter Error Details:\n" + JSON.stringify(data));
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

    if (fontSlider && fontDisplay) {
        fontSlider.addEventListener("input", function() {
            const currentScaleValue = this.value;
            fontDisplay.innerText = currentScaleValue + "%";
            document.documentElement.style.setProperty("--text-scale", (currentScaleValue / 100) + "rem");
            
            const styleFallbackId = "diary-typography-override-sheet";
            let customStyleSheet = document.getElementById(styleFallbackId);
            if (!customStyleSheet) {
                customStyleSheet = document.createElement("style");
                customStyleSheet.id = styleFallbackId;
                document.head.appendChild(customStyleSheet);
            }
            customStyleSheet.innerHTML = `.timeline-text-content { font-size: ${(currentScaleValue / 100)}rem !important; line-height: 1.6 !important; }`;
        });
    }

    document.querySelectorAll(".accent-ring").forEach(ring => {
        ring.addEventListener("click", function() {
            document.querySelectorAll(".accent-ring").forEach(r => r.classList.remove("active"));
            this.classList.add("active");
            playSFX('click');

            const derivedHexColorValue = this.getAttribute("data-color");
            document.documentElement.style.setProperty("--accent-color", derivedHexColorValue);
            document.documentElement.style.setProperty("--primary", derivedHexColorValue);
        });
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

/* ==========================================================================
   UPDATED USER LOGIC: SECURE TOKEN FEEDBACK VISUALIZER
   ========================================================================== */
function saveTokenWithFeedback(value) {
    localStorage.setItem('my_github_token', value.trim());
    const statusText = document.getElementById('tokenStatusText');
    
    if (statusText) {
        if (value.trim().length > 0) {
            statusText.innerText = "✦ Saved securely to cache";
            statusText.style.color = "#22c55e"; // Success Green
            statusText.style.opacity = "1";
            try { playSFX('tick'); } catch(e) {}
        } else {
            statusText.innerText = "⚠ Token removed from system memory";
            statusText.style.color = "#ef4444"; // Warning Red
            statusText.style.opacity = "1";
        }
    }
}

/* ==========================================================================
   ROLE-BASED PERMISSION ENFORCER
   ========================================================================== */
function enforceRolePermissions() {
    const role = AppState.userRole || localStorage.getItem('cece_active_role') || 'master';
    
    // 1. Locate our two new UI indicator targets
    const settingsBadge = document.getElementById('settings-role-badge');
    const drawerText = document.getElementById('drawer-role-text');
    
    // 2. Dynamically style and change text based on profile tier
    if (role === 'visitor') {
        // Update Settings Card Badge to Amber/Visitor state
        if (settingsBadge) {
            settingsBadge.textContent = "Logged in as Visitor";
            settingsBadge.style.background = "rgba(245, 158, 11, 0.1)"; // Amber tint
            settingsBadge.style.color = "#f59e0b";
        }
        // Update Side Drawer text to Visitor state
        if (drawerText) {
            drawerText.innerHTML = `<span style="display: inline-block; width: 6px; height: 6px; background-color: #f59e0b; border-radius: 50%;"></span> Logged in as Visitor`;
        }
    } else {
        // Default Master State (Green theme)
        if (settingsBadge) {
            settingsBadge.textContent = "Logged in as Master";
            settingsBadge.style.background = "rgba(34, 197, 94, 0.1)"; // Emerald green tint
            settingsBadge.style.color = "#22c55e";
        }
        if (drawerText) {
            drawerText.innerHTML = `<span style="display: inline-block; width: 6px; height: 6px; background-color: #22c55e; border-radius: 50%;"></span> Logged in as Master`;
        }
    }

    // ... Keep the rest of your original permissions/click-shield logic below this line ...
    const entryFormContainer = document.getElementById('entry-editor-form');
    document.getElementById('visitor-action-shield')?.remove();
    // etc...
}



// Opens the custom restriction modal with a smooth scale-up and fade-in
// Opens the custom restriction modal with a smooth scale-up entry
// Opens the custom restriction modal
// Opens the custom restriction modal with the aiStart chime
function showAccessDeniedModal() {
    const overlay = document.getElementById('access-denied-modal-overlay');
    if (!overlay) return;
    
    // 🎵 Modern intro chime on open
    try { playSFX('aiStart'); } catch(e) {} 
    
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '1';
        overlay.querySelector('.custom-modal-card').style.transform = 'scale(1)';
    }, 20);
}

// Closes the restriction modal (Triggered by the pulsing "Got it" button)
function closeAccessDeniedModal() {
    // 🎵 Audio response when clicking "Got it"
    try { playSFX('delete'); } catch(e) {} 
    
    const overlay = document.getElementById('access-denied-modal-overlay');
    if (!overlay) return;
    
    overlay.style.opacity = '0';
    overlay.querySelector('.custom-modal-card').style.transform = 'scale(0.92)';
    
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 200);
}
