/* ==========================================================================
   1. GLOBAL STATE & TRACKING KEYS
   ========================================================================== */

const AppState = {
    isAuthenticated: false,
    defaultPin: "0412",
    currentTheme: "theme-light",
    editingId: null, // Holds ID of entry currently being parsed for edits
    logs: [] 
};

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
        content: "Umuulan nung umagang 'yon, kaya sa corridor sa harap ng room namin ginawa yung morning assembly. Fast forward to our second afternoon break around 2:00 PM. I usually switch seats to sit next to my close friend during breaks. I was sitting in the middle row, facing the door, when she walked by. She was already looking at me before she even crossed the doorway. As she walked past, she literally turned her head toward me and kept her eyes locked on mine until she disappeared from my view. That was a solid three to four seconds of unbroken eye contact. After that, medyo nagka-gap yung sequence namin kasi I got sick. I was absent nung Friday for the defreezing activity kasi medyo mahiyain ako, and then I caught a stomach ache over the weekend na umabot hanggang Monday.",
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
    const savedData = localStorage.getItem("projectCece_logs_v120");
    if (savedData) {
        try {
            AppState.logs = JSON.parse(savedData);
        } catch (e) {
            AppState.logs = [...initialBackupEntries];
        }
    } else {
        AppState.logs = [...initialBackupEntries];
        saveToLocalStorage();
    }
}

/* ==========================================================================
   3. APPLICATION RUNTIME INITIALIZATION (UNIFIED)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Load local storage files
    loadFromLocalStorage();
    updateDashboardMetrics();
    renderTimeline(AppState.logs);
    initPersonalizationControls();
    
    // Check if device authorization is remembered
    const isRemembered = localStorage.getItem("cece_device_verified") === "true";
    if (isRemembered) {
        document.getElementById("login-form-fields").classList.add("hidden");
        document.getElementById("passcode-form-fields").classList.remove("hidden");
    } else {
        document.getElementById("login-form-fields").classList.remove("hidden");
        document.getElementById("passcode-form-fields").classList.add("hidden");
    }

    // Audio volume controller initialization
    const sfxSlider = document.getElementById('sfx-volume');
    const sfxIndicator = document.getElementById('sfx-vol-indicator');
    
    if (sfxSlider && sfxIndicator) {
        sfxSlider.value = activeSfxVol;
        sfxIndicator.textContent = Math.round(activeSfxVol * 100) + '%';
    }

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            const vol = parseFloat(e.target.value);
            localStorage.setItem('sfx_volume', vol);
            if (sfxIndicator) {
                sfxIndicator.textContent = Math.round(vol * 100) + '%';
            }
        });
        
        // Audio preview cue on interaction release
        sfxSlider.addEventListener('change', () => {
            playSFX('click');
        });
    }
});

/* ==========================================================================
   4. NAVIGATION ENGINE
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
        console.log(`Switched view to: ${pageId}`);
    } else {
        console.error(`Page ID not found: ${pageId}`);
    }
}

function showAuthGate() {
    // Play transition feedback track
    playSFX('swishOpen');

    if (AppState.isAuthenticated) {
        switchPage("logs-page");
    } else {
        switchPage("auth-page");
        // Clear out any leftover passcode text from previous attempts
        const input = document.getElementById("masterPasscode");
        if (input) {
            input.value = "";
            input.focus();
        }
    }
}

function toggleDrawer(isOpen) {
    const drawer = document.getElementById("sideDrawer");
    if (drawer) {
        drawer.classList.toggle("open", isOpen);
        playSFX(isOpen ? 'swishOpen' : 'swishClose');
    }
}

function navigateFromMenu(menuKey) {
    const pageIdMap = {
        'home': 'landing-page',
        'logs': 'logs-page',
        'personalization': 'personalization-page',
        'settings': 'settings-page',
        'about': 'about-page'
    };

    const targetId = pageIdMap[menuKey];
    if (targetId) {
        switchPage(targetId);
        playSFX('click');
    }

    if (typeof toggleDrawer === "function") {
        toggleDrawer(false);
    }
}

/* ==========================================================================
   5. GATEWAY SECURITY CREDENTIAL CONTROLS
   ========================================================================== */

const TARGET_EMAIL = "lnc.gbrl.crisostomo@gmail.com";
const TARGET_PASSWORD = "hasacrushoncece";
const MASTER_PASSCODE = "0412";

function handleInitialLogin(e) {
    e.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (email === TARGET_EMAIL && password === TARGET_PASSWORD) {
        localStorage.setItem("cece_device_verified", "true");
        playSFX('publish');
        
        document.getElementById("login-form-fields").classList.add("hidden");
        document.getElementById("passcode-form-fields").classList.remove("hidden");
        
        const passcodeField = document.getElementById("masterPasscode");
        if (passcodeField) passcodeField.focus();
    } else {
        alert("Invalid email or password.");
    }
}

function handlePasscodeUnlock(e) {
    e.preventDefault();
    const inputPasscode = document.getElementById("masterPasscode").value;

    if (inputPasscode === MASTER_PASSCODE) {
        AppState.isAuthenticated = true;
        playSFX('publish');

        const authPage = document.getElementById("auth-page");
        if (authPage) authPage.style.display = "none";
        
        switchPage('logs-page');
        
        const nav = document.getElementById("globalNav");
        if (nav) {
            nav.classList.remove('hidden');
            nav.style.display = 'block';
        }
    } else {
        alert("Incorrect Master Key.");
        document.getElementById("masterPasscode").value = ""; 
    }
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

    if (dataArray.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No logs found for this filter frame.</p>`;
        return;
    }

    const sortedData = [...dataArray].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedData.forEach((item, index) => {
        const timelineItem = document.createElement("div");
        timelineItem.className = "timeline-item animate-slide-up";
        timelineItem.style.animationDelay = `${index * 0.04}s`;

        const publishedDateFormatted = new Date(item.createdAt || item.date).toLocaleDateString("en-US", {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit'
        });

        let updateStampMark = '';
        if (item.lastEditedAt) {
            const editDateFormatted = new Date(item.lastEditedAt).toLocaleDateString("en-US", {
                month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
            });
            updateStampMark = `<div class="timestamp-node-stamp">| Last edited: <span>${editDateFormatted}</span></div>`;
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
                        <div class="timeline-text-content">
                            ${item.content}
                        </div>
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
}

function toggleExpandEntry(id) {
    const block = document.getElementById(`narrative-${id}`);
    if (block) {
        block.classList.toggle("is-expanded");
        playSFX('click');
    }
}

function toggleActionMenu(id, event) {
    event.stopPropagation();
    const targetDropdown = document.getElementById(`dropdown-${id}`);
    const isCurrentlyOpen = targetDropdown ? targetDropdown.classList.contains("open-active") : false;
    
    closeAllActionMenus();
    
    if (targetDropdown && !isCurrentlyOpen) {
        targetDropdown.classList.add("open-active");
        playSFX('popup');
    }
}

function closeAllActionMenus(event) {
    document.querySelectorAll(".action-menu-dropdown").forEach(dropdown => {
        dropdown.classList.remove("open-active");
    });
}

/* ==========================================================================
   8. COMPLETED DIARY ENTRY LOG MANAGEMENT (CRUD)
   ========================================================================== */

function formatDisplayDate(dateStr) {
    if (!dateStr) return "";
    const parsedDate = new Date(dateStr);
    return parsedDate.toLocaleDateString("en-US", { month: 'short', day: '2-digit' });
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
    playSFX('click');
    AppState.editingId = null;
    document.getElementById("formPageTitle").innerText = "Add New Entry";
    document.getElementById("eventTitle").value = "";
    document.getElementById("eventDate").value = new Date().toISOString().split('T')[0];
    document.getElementById("eventContent").value = "";
    switchPage("create-log-page");
}

function prepareEditForm(id) {
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

function publishNewEvent() {
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

    saveToLocalStorage();
    updateDashboardMetrics();
    playSFX('publish');
    
    document.getElementById("monthFilter").value = "all";
    renderTimeline(AppState.logs);
    switchPage("logs-page");
}

function deleteEntry(id) {
    if (confirm("Are you sure you want to completely erase this memory entry?")) {
        AppState.logs = AppState.logs.filter(log => log.id !== id);
        saveToLocalStorage();
        updateDashboardMetrics();
        playSFX('delete');
        filterTimelineByMonth();
    }
}

function toggleCoreMemoryState(id) {
    AppState.logs = AppState.logs.map(log => {
        if (log.id === id) {
            return { ...log, isCoreMemory: !log.isCoreMemory };
        }
        return log;
    });
    saveToLocalStorage();
    updateDashboardMetrics();
    playSFX('star');
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

document.addEventListener("click", () => {
    const dropdownPanel = document.getElementById("themeGridDropdownContainer");
    const triggerBtn = document.getElementById("themeDropdownGridBtn");
    if (dropdownPanel && dropdownPanel.classList.contains("show-grid-open")) {
        dropdownPanel.classList.remove("show-grid-open");
        if (triggerBtn) triggerBtn.classList.remove("active-trigger");
    }
});

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

    // Dynamic Accent Highlights System Loop (Restored!)
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
    aiSuccess: new Audio('audio/ai-success.wav')
};

let activeSfxVol = localStorage.getItem('sfx_volume') !== null ? parseFloat(localStorage.getItem('sfx_volume')) : 0.4;         

function playSFX(type) {
    if (sfxSounds[type]) {
        sfxSounds[type].currentTime = 0; 
        const currentVol = localStorage.getItem('sfx_volume') !== null ? parseFloat(localStorage.getItem('sfx_volume')) : 0.4;
        sfxSounds[type].volume = currentVol;
        sfxSounds[type].play().catch(() => console.log(`SFX [${type}] playback deferred by browser interaction limits.`));
    }
}