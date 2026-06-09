// Global State
const app = {
    step: 1,
    layout: null,
    photos: [],
    stream: null,
    facingMode: 'user',
    timer: 3,
    frameColor: '#000000',
    selectedTemplate: 'none',
    eventInfo: {
        title: 'Cube',
        date: new Date().toISOString().split('T')[0]
    },
    currentDraftId: null
};

// Layout Configurations
const layouts = {
    'strip-3': { name: 'Strip 3', width: 600, height: 1800, photos: 3, type: 'strip' },
    'strip-4': { name: 'Strip 4', width: 600, height: 2400, photos: 4, type: 'strip' },
    '4r-land-2': { name: '4R Land 2', width: 1800, height: 1200, photos: 2, type: 'grid', cols: 2, rows: 1 },
    '4r-land-3': { name: '4R Land 3', width: 1800, height: 1200, photos: 3, type: 'grid', cols: 3, rows: 1 },
    '4r-land-4': { name: '4R Land 4', width: 1800, height: 1200, photos: 4, type: 'grid', cols: 2, rows: 2 },
    '4r-port-2': { name: '4R Port 2', width: 1200, height: 1800, photos: 2, type: 'grid', cols: 1, rows: 2 },
    '4r-port-3': { name: '4R Port 3', width: 1200, height: 1800, photos: 3, type: 'grid', cols: 1, rows: 3 },
    '4r-port-4': { name: '4R Port 4', width: 1200, height: 1800, photos: 4, type: 'grid', cols: 2, rows: 2 },
    'collage': { name: 'Collage', width: 1500, height: 1500, photos: 3, type: 'collage' },
    'square-4': { name: 'Square 4', width: 1500, height: 1500, photos: 4, type: 'grid', cols: 2, rows: 2 }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initAuthState();
    setTimer(app.timer, true);
    initTimerDrag();
});

function initAuthState() {
    const user = Auth.getCurrentUser();
    if (user) {
        onAuthSuccess(user);
    } else {
        showAuthModal();
    }
}

// ============================================
// AUTH UI FUNCTIONS
// ============================================

function showAuthModal() {
    document.getElementById('authOverlay').classList.remove('hidden');
    // Clear forms
    document.getElementById('formSignIn').reset();
    document.getElementById('formSignUp').reset();
    clearAuthErrors();
}

function hideAuthModal() {
    document.getElementById('authOverlay').classList.add('hidden');
}

function switchAuthTab(tab) {
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');

    clearAuthErrors();

    if (tab === 'signin') {
        tabSignIn.classList.add('active');
        tabSignUp.classList.remove('active');
        formSignIn.classList.add('active');
        formSignUp.classList.remove('active');
    } else {
        tabSignUp.classList.add('active');
        tabSignIn.classList.remove('active');
        formSignUp.classList.add('active');
        formSignIn.classList.remove('active');
    }
}

function clearAuthErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.classList.remove('visible');
        el.textContent = '';
    });
    document.querySelectorAll('.form-input').forEach(el => {
        el.classList.remove('error');
    });
}

function showAuthError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.add('visible');
}

async function handleSignIn(event) {
    event.preventDefault();
    clearAuthErrors();

    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    const submitBtn = document.getElementById('signinSubmit');

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Small delay for UX
    await sleep(400);

    const result = await Auth.signIn(email, password);

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    if (result.success) {
        onAuthSuccess(result.user);
        showNotification('✅ Berhasil login! Selamat datang, ' + result.user.username);
    } else {
        showAuthError('signinGeneralError', result.message);
    }
}

async function handleSignUp(event) {
    event.preventDefault();
    clearAuthErrors();

    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const submitBtn = document.getElementById('signupSubmit');

    // Client-side validation
    let hasError = false;
    if (username.trim().length < 2) {
        showAuthError('signupUsernameError', 'Username minimal 2 karakter');
        document.getElementById('signupUsername').classList.add('error');
        hasError = true;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAuthError('signupEmailError', 'Email tidak valid');
        document.getElementById('signupEmail').classList.add('error');
        hasError = true;
    }
    if (password.length < 6) {
        showAuthError('signupPasswordError', 'Password minimal 6 karakter');
        document.getElementById('signupPassword').classList.add('error');
        hasError = true;
    }
    if (hasError) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    await sleep(500);

    const result = await Auth.signUp(username, email, password);

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;

    if (result.success) {
        onAuthSuccess(result.user);
        showNotification('Akun berhasil dibuat! Selamat datang, ' + result.user.username);
    } else {
        showAuthError('signupGeneralError', result.message);
    }
}

function onAuthSuccess(user) {
    hideAuthModal();
    updateHeaderUI(user);
    updateDraftBadge();
}

function handleSignOut() {
    Auth.signOut();
    updateHeaderUI(null);
    resetApp();
    showAuthModal();
    showNotification('👋 Berhasil logout');
}

function updateHeaderUI(user) {
    const userArea = document.getElementById('headerUserArea');
    const signInBtn = document.getElementById('headerSignInBtn');

    if (user) {
        userArea.classList.remove('hidden');
        signInBtn.classList.add('hidden');
        document.getElementById('userAvatar').textContent = user.initials;
        document.getElementById('userName').textContent = user.username;
    } else {
        userArea.classList.add('hidden');
        signInBtn.classList.remove('hidden');
    }
}

function showForgotPassword() {
    showNotification('Fitur lupa password belum tersedia');
}

// ============================================
// DRAFT UI FUNCTIONS
// ============================================

function updateDraftBadge() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const count = Draft.getDraftCount(user.id);
    const badge = document.getElementById('draftBadge');
    if (count > 0) {
        badge.style.display = 'inline';
        badge.textContent = count;
    } else {
        badge.style.display = 'none';
    }
}

function openSaveDraftModal() {
    const user = Auth.getCurrentUser();
    if (!user) {
        showNotification('⚠️ Login terlebih dahulu untuk menyimpan draft');
        showAuthModal();
        return;
    }

    const input = document.getElementById('draftNameInput');

    if (app.currentDraftId) {
        const existingDraft = Draft.getDraft(user.id, app.currentDraftId);
        if (existingDraft) {
            input.value = existingDraft.name;
            // Langsung simpan tanpa modal
            confirmSaveDraft();
            return;
        }
    }

    const layoutName = app.layout ? layouts[app.layout].name : 'Draft';
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    input.value = `${layoutName} - ${date}`;

    document.getElementById('saveDraftOverlay').classList.remove('hidden');
    setTimeout(() => input.select(), 100);
}

function closeSaveDraftModal() {
    document.getElementById('saveDraftOverlay').classList.add('hidden');
}

async function confirmSaveDraft() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const name = document.getElementById('draftNameInput').value.trim() || 'Draft Tanpa Nama';

    // Render canvas fresh to ensure we capture the current state
    let thumbnail = null;
    if (app.layout && app.photos.length > 0) {
        const thumbCanvas = document.createElement('canvas');
        await renderCanvas(thumbCanvas);
        thumbnail = Draft.generateThumbnail(thumbCanvas);
    }

    const draftData = {
        name: name,
        layout: app.layout,
        photos: [...app.photos],
        frameColor: app.frameColor,
        selectedTemplate: app.selectedTemplate,
        eventInfo: { ...app.eventInfo },
        thumbnail: thumbnail
    };

    const result = Draft.saveDraft(user.id, draftData, app.currentDraftId);

    closeSaveDraftModal();

    if (result.success) {
        app.currentDraftId = result.draftId;
        showNotification('✅ Draft berhasil disimpan!');
        updateDraftBadge();
    } else {
        if (result.message === 'Draft tidak ditemukan') {
            app.currentDraftId = null;
            showNotification('❌ Draft lama tidak ditemukan. Silakan klik simpan lagi untuk membuat draft baru.');
        } else {
            showNotification('❌ ' + result.message);
        }
    }
}

function showDraftPage() {
    const user = Auth.getCurrentUser();
    if (!user) {
        showAuthModal();
        return;
    }

    showStep(5);
    renderDraftPage();
}

function renderDraftPage() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const drafts = Draft.getDrafts(user.id);
    const container = document.getElementById('draftContainer');
    const countText = document.getElementById('draftCountText');
    countText.textContent = `${drafts.length} draft tersimpan`;

    if (drafts.length === 0) {
        container.innerHTML = `
            <div class="draft-empty">
                <div class="draft-empty-icon">📸</div>
                <h3>Belum ada draft</h3>
                <p>Mulai buat foto dan simpan ke draft agar bisa dilanjutkan kapan saja</p>
            </div>
        `;
        return;
    }

    let html = '<div class="draft-grid">';
    drafts.forEach(draft => {
        const date = new Date(draft.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const time = new Date(draft.createdAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const layoutName = layouts[draft.layout] ? layouts[draft.layout].name : draft.layout;

        html += `
            <div class="draft-card" id="draft-${draft.id}">
                <div class="draft-card-thumb">
                    ${draft.thumbnail
                ? `<img src="${draft.thumbnail}" alt="${draft.name}">`
                : `<span class="no-thumb">📷</span>`
            }
                    <div class="draft-card-overlay">
                        <button class="draft-action-btn load" onclick="loadDraftToEditor('${draft.id}')">
                            Load
                        </button>
                        <button class="draft-action-btn rename" onclick="renameDraftPrompt('${draft.id}', '${draft.name.replace(/'/g, "\\'")}')">
                            ✏️
                        </button>
                        <button class="draft-action-btn delete" onclick="deleteDraftConfirm('${draft.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="draft-card-info">
                    <div class="draft-card-name">${draft.name}</div>
                    <div class="draft-card-meta">
                        <span>📐 ${layoutName}</span>
                        <span>📅 ${date} ${time}</span>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    container.innerHTML = html;
}

function loadDraftToEditor(draftId) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const draft = Draft.getDraft(user.id, draftId);
    if (!draft) {
        showNotification('❌ Draft tidak ditemukan');
        return;
    }

    // Restore state
    app.currentDraftId = draftId;
    app.layout = draft.layout;
    app.photos = [...draft.photos];
    app.frameColor = draft.frameColor || '#000000';
    app.selectedTemplate = draft.selectedTemplate || 'none';
    app.eventInfo = { ...draft.eventInfo };

    // Update UI: set active color swatch
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    const matchingSwatch = document.querySelector(`.color-swatch[style*="${app.frameColor}"]`);
    if (matchingSwatch) matchingSwatch.classList.add('active');
    document.getElementById('customFrameColor').value = app.frameColor;

    // Go to customize
    showStep(3);
    renderTemplateGallery();
    updateFramePreview();
    showNotification('✅ Draft berhasil dimuat!');
}

function deleteDraftConfirm(draftId) {
    if (confirm('Hapus draft ini? Tindakan ini tidak bisa dibatalkan.')) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const result = Draft.deleteDraft(user.id, draftId);
        if (result.success) {
            showNotification('✅ Draft berhasil dihapus');
            updateDraftBadge();
            renderDraftPage();
        } else {
            showNotification('❌ ' + result.message);
        }
    }
}

function renameDraftPrompt(draftId, currentName) {
    const newName = prompt('Nama baru untuk draft:', currentName);
    if (newName !== null && newName.trim().length > 0) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const result = Draft.renameDraft(user.id, draftId, newName);
        if (result.success) {
            showNotification('✅ Nama draft berhasil diubah');
            renderDraftPage();
        } else {
            showNotification('❌ ' + result.message);
        }
    }
}

// ============================================
// STEP NAVIGATION
// ============================================

function showStep(step) {
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`step${i}`).classList.add('hidden');
    }
    document.getElementById(`step${step}`).classList.remove('hidden');
    app.step = step;

    // Steps: 1=Layout, 2=Camera, 3=Customize, 4=Export, 5=Draft
    if (step <= 3) {
        document.getElementById('stepInfo').textContent = `Step ${step} of 3`;
    } else if (step === 4) {
        document.getElementById('stepInfo').textContent = 'Export';
    } else {
        document.getElementById('stepInfo').textContent = 'Draft Saya';
    }
}

// Layout Selection
function selectLayout(layoutId) {
    app.layout = layoutId;
    app.photos = [];

    document.querySelectorAll('.layout-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.layout-card').classList.add('selected');

    setTimeout(() => {
        document.getElementById('maxPhotos').textContent = layouts[layoutId].photos;
        renderPhotoGrid();
        showStep(2);
    }, 300);
}

// Camera Functions
async function startCamera() {
    try {
        app.stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: app.facingMode, width: 1280, height: 720 },
            audio: false
        });

        const video = document.getElementById('video');
        video.srcObject = app.stream;

        document.getElementById('placeholder').classList.add('hidden');
        document.getElementById('captureBtn').disabled = false;
        document.getElementById('switchBtn').disabled = false;

        showNotification('✅ Kamera berhasil diaktifkan!');
    } catch (error) {
        showNotification('❌ Gagal mengakses kamera: ' + error.message);
    }
}

async function switchCamera() {
    app.facingMode = app.facingMode === 'user' ? 'environment' : 'user';
    if (app.stream) {
        app.stream.getTracks().forEach(track => track.stop());
    }
    await startCamera();
}

function updateTimerLineFill() {
    const fillEl = document.getElementById('timerLineFill');
    if (!fillEl) return;

    let percent = '0%';
    if (app.timer === 5) percent = '50%';
    if (app.timer === 10) percent = '100%';

    const isHorizontal = window.innerWidth <= 1200;
    if (isHorizontal) {
        fillEl.style.height = '100%';
        fillEl.style.width = percent;
    } else {
        fillEl.style.width = '100%';
        fillEl.style.height = percent;
    }
}

window.addEventListener('resize', updateTimerLineFill);

function setTimer(seconds, silent = false) {
    app.timer = seconds;

    // Update active class on all timer buttons (cumulative fill)
    document.querySelectorAll('.timer-btn').forEach(btn => {
        const btnSeconds = parseInt(btn.getAttribute('data-seconds'));
        if (btnSeconds <= seconds) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    updateTimerLineFill();

    if (!silent) {
        showNotification(`⏱ Timer diatur ke ${seconds} detik`);
    }
}

let isDraggingTimer = false;

function initTimerDrag() {
    const capsule = document.querySelector('.timer-capsule');
    if (!capsule) return;

    const handleDrag = (e) => {
        if (!isDraggingTimer) return;

        // Prevent default browser touch actions to avoid scrolling while dragging
        if (e.cancelable) {
            e.preventDefault();
        }

        const rect = capsule.getBoundingClientRect();
        const isHorizontal = window.innerWidth <= 1200;

        let clientX = e.clientX;
        let clientY = e.clientY;

        // Touch support
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        let ratio;
        if (isHorizontal) {
            const relativeX = clientX - rect.left;
            ratio = relativeX / rect.width;
        } else {
            const relativeY = clientY - rect.top;
            ratio = relativeY / rect.height;
        }

        ratio = Math.max(0, Math.min(1, ratio));

        let targetSeconds = 3;
        if (ratio < 0.25) {
            targetSeconds = 3;
        } else if (ratio < 0.75) {
            targetSeconds = 5;
        } else {
            targetSeconds = 10;
        }

        if (app.timer !== targetSeconds) {
            setTimer(targetSeconds);
        }
    };

    // Mouse events
    capsule.addEventListener('mousedown', (e) => {
        isDraggingTimer = true;
        handleDrag(e);

        const onMouseMove = (moveEvent) => {
            handleDrag(moveEvent);
        };

        const onMouseUp = () => {
            isDraggingTimer = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    // Touch events
    capsule.addEventListener('touchstart', (e) => {
        isDraggingTimer = true;
        handleDrag(e);

        const onTouchMove = (moveEvent) => {
            handleDrag(moveEvent);
        };

        const onTouchEnd = () => {
            isDraggingTimer = false;
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };

        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
    }, { passive: true });
}

async function capturePhoto() {
    const layout = layouts[app.layout];
    if (app.photos.length >= layout.photos) {
        showNotification(`Maksimal ${layout.photos} foto untuk layout ini!`);
        return;
    }

    // Disable controls during active photo capture sequence
    const captureBtn = document.getElementById('captureBtn');
    const switchBtn = document.getElementById('switchBtn');
    const uploadInput = document.querySelector('.camera-toolbar input[type="file"]');
    const uploadBtn = uploadInput ? uploadInput.parentElement : null;
    const timerButtons = document.querySelectorAll('.timer-btn');

    if (captureBtn) captureBtn.disabled = true;
    if (switchBtn) switchBtn.disabled = true;
    if (uploadBtn) uploadBtn.style.pointerEvents = 'none';
    timerButtons.forEach(btn => btn.disabled = true);

    const maxPhotos = layout.photos;

    try {
        while (app.photos.length < maxPhotos) {
            // Countdown
            const countdown = document.getElementById('countdown');
            const number = document.getElementById('countdownNumber');
            countdown.classList.remove('hidden');

            const timerValue = app.timer || 3;
            for (let i = timerValue; i > 0; i--) {
                number.textContent = i;
                await sleep(1000);
            }

            countdown.classList.add('hidden');

            // Capture
            const video = document.getElementById('video');
            const canvas = document.getElementById('captureCanvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();

            app.photos.push(canvas.toDataURL('image/jpeg', 0.95));
            renderPhotoGrid();

            showNotification(`✅ Foto ${app.photos.length} dari ${maxPhotos} berhasil diambil!`);

            // Wait 1.5 seconds to let the user prepare the next pose
            if (app.photos.length < maxPhotos) {
                countdown.classList.remove('hidden');
                number.textContent = "Bersiap!";
                number.style.fontSize = "5rem";
                await sleep(1500);
                number.style.fontSize = ""; // reset font size
                countdown.classList.add('hidden');
            }
        }
    } catch (err) {
        showNotification(`❌ Terjadi kesalahan: ${err.message}`);
    } finally {
        // Re-enable controls
        if (captureBtn) captureBtn.disabled = false;
        if (switchBtn) switchBtn.disabled = false;
        if (uploadBtn) uploadBtn.style.pointerEvents = 'auto';
        timerButtons.forEach(btn => btn.disabled = false);
    }

    if (app.photos.length === layout.photos) {
        document.getElementById('nextToEditor').disabled = false;
    }
}

async function uploadPhoto(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const layout = layouts[app.layout];
    const remainingSlots = layout.photos - app.photos.length;

    if (remainingSlots <= 0) {
        showNotification(`⚠️ Maksimal ${layout.photos} foto!`);
        event.target.value = '';
        return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const uploadPromises = filesToUpload.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error(`Gagal membaca file ${file.name}`));
        reader.readAsDataURL(file);
    }));

    try {
        const uploadedPhotos = await Promise.all(uploadPromises);
        app.photos.push(...uploadedPhotos);
        renderPhotoGrid();

        if (app.photos.length === layout.photos) {
            document.getElementById('nextToEditor').disabled = false;
        }

        showNotification(
            uploadedPhotos.length > 1
                ? `✅ ${uploadedPhotos.length} foto berhasil diupload!`
                : '✅ Foto berhasil diupload!'
        );

        if (files.length > remainingSlots) {
            showNotification(`⚠️ Hanya ${remainingSlots} foto pertama yang ditambahkan karena slot sudah penuh.`);
        }
    } catch (err) {
        showNotification(`❌ Terjadi kesalahan: ${err.message}`);
    } finally {
        event.target.value = '';
    }
}

function renderPhotoGrid() {
    const layout = layouts[app.layout];
    const grid = document.getElementById('photoGrid');
    grid.innerHTML = '';

    document.getElementById('currentPhoto').textContent = app.photos.length;

    for (let i = 0; i < layout.photos; i++) {
        const slot = document.createElement('div');
        slot.className = 'photo-slot';

        if (app.photos[i]) {
            slot.innerHTML = `
                <img src="${app.photos[i]}" alt="Photo ${i + 1}">
                <div class="slot-actions">
                    <button class="slot-btn" onclick="deletePhoto(${i})" title="Delete">🗑️</button>
                </div>
            `;
        } else {
            slot.innerHTML = `<span class="slot-number">${i + 1}</span>`;
        }

        grid.appendChild(slot);
    }
}

function deletePhoto(index) {
    app.photos.splice(index, 1);
    renderPhotoGrid();
    document.getElementById('nextToEditor').disabled = app.photos.length < layouts[app.layout].photos;
}

// ============================================
// FRAME CUSTOMIZATION FUNCTIONS
// ============================================

// --- Template Definitions ---
const frameTemplates = {
    'none': {
        name: 'None',
        icon: '🚫',
        description: 'Tanpa dekorasi',
        decorations: []
    },
    'checkered-green': {
        name: 'Gingham Green',
        icon: '🍀',
        description: 'Kotak-kotak hijau dengan pita',
        frameColor: '#d4edda',
        pattern: 'gingham',
        patternColor: '#a8d5a2',
        decorations: [
            { emoji: '🎀', x: 0.50, y: 0.02, size: 40 },
            { emoji: '⭐', x: 0.08, y: 0.22, size: 32 },
            { emoji: '🍀', x: 0.08, y: 0.92, size: 42 },
            { emoji: '⭐', x: 0.88, y: 0.50, size: 28 },
            { emoji: '⭐', x: 0.82, y: 0.85, size: 24 },
        ]
    },
    'film-strip': {
        name: 'Film Strip',
        icon: '🎞️',
        description: 'Gaya film analog retro',
        frameColor: '#f5f0e8',
        pattern: 'film',
        decorations: []
    },
    'hearts': {
        name: 'Hearts Galore',
        icon: '💖',
        description: 'Penuh cinta dan hati',
        frameColor: '#ffe4ec',
        decorations: [
            { emoji: '💖', x: 0.12, y: 0.04, size: 36 },
            { emoji: '💕', x: 0.85, y: 0.08, size: 30 },
            { emoji: '❤️', x: 0.08, y: 0.35, size: 24 },
            { emoji: '💗', x: 0.90, y: 0.45, size: 28 },
            { emoji: '🩷', x: 0.06, y: 0.65, size: 22 },
            { emoji: '💖', x: 0.88, y: 0.75, size: 32 },
            { emoji: '💝', x: 0.15, y: 0.92, size: 34 },
            { emoji: '❤️', x: 0.80, y: 0.92, size: 26 },
        ]
    },
};

function goToCustomize() {
    const layout = layouts[app.layout];
    if (app.photos.length < layout.photos) {
        showNotification('⚠️ Lengkapi semua foto terlebih dahulu!');
        return;
    }

    showStep(3);
    renderTemplateGallery();
    updateFramePreview();
}

// --- Frame Color ---
function setFrameColor(color, btn) {
    app.frameColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('customFrameColor').value = color;
    updateFramePreview();
}

function setFrameColorCustom(color) {
    app.frameColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    updateFramePreview();
}

// --- Template Selection ---
function selectTemplate(templateId) {
    app.selectedTemplate = templateId;
    const template = frameTemplates[templateId];

    // If template has a suggested frame color, apply it
    if (template.frameColor && templateId !== 'none') {
        app.frameColor = template.frameColor;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        const matchingSwatch = document.querySelector(`.color-swatch[style*="${template.frameColor}"]`);
        if (matchingSwatch) matchingSwatch.classList.add('active');
        document.getElementById('customFrameColor').value = template.frameColor;
    }

    // Update active state in gallery
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.querySelector(`.template-card[data-template="${templateId}"]`);
    if (activeCard) activeCard.classList.add('active');

    updateFramePreview();
    if (templateId !== 'none') {
        showNotification(`${template.icon} Template "${template.name}" diterapkan!`);
    }
}

function renderTemplateGallery() {
    const gallery = document.getElementById('templateGallery');
    if (!gallery) return;

    let html = '';
    Object.entries(frameTemplates).forEach(([id, template]) => {
        const isActive = app.selectedTemplate === id;
        html += `
            <button class="template-card ${isActive ? 'active' : ''}" 
                    data-template="${id}" 
                    onclick="selectTemplate('${id}')"
                    title="${template.description}">
                <div class="template-card-preview">
                    <span class="template-card-icon">${template.icon}</span>
                </div>
                <span class="template-card-name">${template.name}</span>
            </button>
        `;
    });
    gallery.innerHTML = html;
}

// --- Live Preview Render ---
function updateFramePreview() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    renderCanvas(canvas);
}

// Canvas Rendering
async function renderCanvas(canvas, isEnchanted = false) {
    const layout = layouts[app.layout];
    const ctx = canvas.getContext('2d');

    canvas.width = layout.width;
    canvas.height = layout.height;

    // Background - use frame color
    ctx.fillStyle = app.frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border (inner area for photos)
    const border = 40;
    const footerHeight = 100;

    // Photos area - di atas
    const contentTop = border;
    const contentHeight = canvas.height - border - footerHeight - border;
    const contentWidth = canvas.width - 2 * border;

    if (layout.type === 'strip') {
        await renderStripLayout(ctx, layout, border, contentTop, contentWidth, contentHeight, isEnchanted);
    } else if (layout.type === 'grid') {
        await renderGridLayout(ctx, layout, border, contentTop, contentWidth, contentHeight, isEnchanted);
    } else if (layout.type === 'collage') {
        await renderCollageLayout(ctx, layout, border, contentTop, contentWidth, contentHeight, isEnchanted);
    }

    // Footer text — auto-contrast color based on frame brightness
    const footerY = contentTop + contentHeight + ((canvas.height - (contentTop + contentHeight) - border) / 2);
    ctx.fillStyle = isLightColor(app.frameColor) ? '#1e293b' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 24px Ailerons, "Futura", "Century Gothic", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(app.eventInfo.title.toUpperCase(), canvas.width / 2, footerY - 15);

    if (app.eventInfo.date) {
        const [year, month, day] = app.eventInfo.date.split('-');
        ctx.font = '400 24px Ailerons, "Futura", "Century Gothic", sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillText(`${day}.${month}.${year}`, canvas.width / 2, footerY + 20);
    }

    // Render template decorations on top
    renderTemplateDecorations(ctx, canvas.width, canvas.height);
}

// Helper: determine if a color is light
function isLightColor(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

// Render template pattern background (gingham, film, etc.)
function renderTemplatePattern(ctx, w, h, template) {
    if (!template.pattern) return;

    if (template.pattern === 'gingham') {
        const size = 20;
        const color = template.patternColor || '#a8d5a2';
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        for (let y = 0; y < h; y += size) {
            for (let x = 0; x < w; x += size) {
                if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
                    ctx.fillRect(x, y, size, size);
                }
            }
        }
        ctx.globalAlpha = 1.0;
    }

    if (template.pattern === 'film') {
        const border = 40;
        const sprocketSize = 14;
        const sprocketGap = 28;
        const sprocketMargin = 8;

        // Film sprocket holes on left and right edges
        ctx.fillStyle = '#222222';
        // Left strip
        ctx.fillRect(0, 0, border - 10, h);
        // Right strip  
        ctx.fillRect(w - border + 10, 0, border - 10, h);

        ctx.fillStyle = '#f5f0e8';
        for (let y = 15; y < h; y += sprocketGap) {
            // Left sprocket holes
            const lx = sprocketMargin;
            ctx.beginPath();
            ctx.roundRect(lx, y, sprocketSize, sprocketSize * 0.7, 2);
            ctx.fill();
            // Right sprocket holes
            const rx = w - sprocketMargin - sprocketSize;
            ctx.beginPath();
            ctx.roundRect(rx, y, sprocketSize, sprocketSize * 0.7, 2);
            ctx.fill();
        }

        // Film code text on the side
        ctx.save();
        ctx.fillStyle = '#888888';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        // Left side text (rotated)
        ctx.save();
        ctx.translate(border - 16, h / 4);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('FILM PORTRA 400', 0, 0);
        ctx.restore();
        // Frame numbers
        ctx.save();
        ctx.translate(border - 16, h * 0.6);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('15', 0, 0);
        ctx.restore();
        // Right side
        ctx.save();
        ctx.translate(w - border + 16, h / 4);
        ctx.rotate(Math.PI / 2);
        ctx.fillText('KODAK PORTRA 400', 0, 0);
        ctx.restore();
        ctx.save();
        ctx.translate(w - border + 16, h * 0.75);
        ctx.rotate(Math.PI / 2);
        ctx.fillText('7', 0, 0);
        ctx.restore();
        ctx.restore();
    }

    if (template.pattern === 'polaroid') {
        // Extra-thick bottom border for polaroid look
        const extraBottom = 60;
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(0, h - extraBottom - 40, w, extraBottom + 40);
        // Subtle shadow line
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, h - extraBottom - 42, w, 2);
    }
}

// Render decorations from the selected template
function renderTemplateDecorations(ctx, canvasWidth, canvasHeight) {
    const template = frameTemplates[app.selectedTemplate];
    if (!template) return;

    // Render pattern first (behind decorations)
    renderTemplatePattern(ctx, canvasWidth, canvasHeight, template);

    // Render emoji decorations
    template.decorations.forEach(dec => {
        const sx = dec.x * canvasWidth;
        const sy = dec.y * canvasHeight;

        ctx.save();
        ctx.font = `${dec.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dec.emoji, sx, sy);
        ctx.restore();
    });
}

async function renderStripLayout(ctx, layout, x, y, width, height, isEnchanted = false) {
    const gap = 30;
    const frameHeight = (height - gap * (layout.photos - 1)) / layout.photos;

    for (let i = 0; i < layout.photos; i++) {
        const frameY = y + i * (frameHeight + gap);

        if (app.photos[i]) {
            await drawPhoto(ctx, app.photos[i], x, frameY, width, frameHeight, isEnchanted);
        }
    }
}

async function renderGridLayout(ctx, layout, x, y, width, height, isEnchanted = false) {
    const gap = 30;
    const frameWidth = (width - gap * (layout.cols - 1)) / layout.cols;
    const frameHeight = (height - gap * (layout.rows - 1)) / layout.rows;

    for (let i = 0; i < layout.photos; i++) {
        const col = i % layout.cols;
        const row = Math.floor(i / layout.cols);
        const frameX = x + col * (frameWidth + gap);
        const frameY = y + row * (frameHeight + gap);

        if (app.photos[i]) {
            await drawPhoto(ctx, app.photos[i], frameX, frameY, frameWidth, frameHeight, isEnchanted);
        }
    }
}

async function renderCollageLayout(ctx, layout, x, y, width, height, isEnchanted = false) {
    const gap = 30;
    const largeWidth = width * 0.6;
    const smallWidth = width - largeWidth - gap;
    const smallHeight = (height - gap) / 2;

    // Large photo
    if (app.photos[0]) {
        await drawPhoto(ctx, app.photos[0], x, y, largeWidth, height, isEnchanted);
    }

    // Small photos
    for (let i = 1; i < 3; i++) {
        const smallY = y + (i - 1) * (smallHeight + gap);

        if (app.photos[i]) {
            await drawPhoto(ctx, app.photos[i], x + largeWidth + gap, smallY, smallWidth, smallHeight, isEnchanted);
        }
    }
}

async function drawPhoto(ctx, photoSrc, x, y, width, height, isEnchanted = false) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            ctx.save();

            // Clip to frame
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();

            // Apply enchantment filter if enabled
            if (isEnchanted) {
                // Subtle auto-enchant: auto brightness/contrast/saturation boost
                ctx.filter = 'brightness(1.08) contrast(1.05) saturate(1.1)';
            } else {
                ctx.filter = 'none';
            }

            // Draw image (cover fit)
            const scale = Math.max(width / img.width, height / img.height);
            const imgWidth = img.width * scale;
            const imgHeight = img.height * scale;
            const imgX = x + (width - imgWidth) / 2;
            const imgY = y + (height - imgHeight) / 2;

            ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

            ctx.restore();
            resolve();
        };
        img.src = photoSrc;
    });
}

// Export Functions
async function goToExport() {
    showStep(4);
    const canvasBefore = document.getElementById('beforeCanvas');
    const canvasAfter = document.getElementById('finalCanvas');

    if (canvasBefore) await renderCanvas(canvasBefore, false);
    if (canvasAfter) await renderCanvas(canvasAfter, true);
}

function downloadImage(format) {
    const canvas = document.getElementById('finalCanvas');
    const link = document.createElement('a');
    const timestamp = Date.now();

    if (format === 'png') {
        link.download = `cubephotobooth-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
    } else {
        link.download = `cubephotobooth-${timestamp}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
    }

    link.click();
    showNotification(`✅ Berhasil download ${format.toUpperCase()}!`);
}

// Reset
function resetApp() {
    if (app.stream) {
        app.stream.getTracks().forEach(track => track.stop());
    }

    app.step = 1;
    app.layout = null;
    app.photos = [];
    app.stream = null;
    app.frameColor = '#000000';
    app.selectedTemplate = 'none';
    app.currentDraftId = null;

    // Reset color swatches
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    const defaultSwatch = document.querySelector('.color-swatch[style*="#000000"]');
    if (defaultSwatch) defaultSwatch.classList.add('active');
    const customColor = document.getElementById('customFrameColor');
    if (customColor) customColor.value = '#000000';

    document.querySelectorAll('.layout-card').forEach(card => card.classList.remove('selected'));
    document.getElementById('placeholder').classList.remove('hidden');
    document.getElementById('captureBtn').disabled = true;
    document.getElementById('switchBtn').disabled = true;
    document.getElementById('nextToEditor').disabled = true;

    setTimer(3, true);
    showStep(1);
}

// Utilities
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

console.log('Cube PhotoBox Studio - Ready!');
