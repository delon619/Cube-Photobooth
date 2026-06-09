// ============================================
// Draft Module — Cube PhotoBox Studio
// Uses localStorage for draft persistence
// ============================================

const Draft = (() => {

    function getDraftsKey(userId) {
        return `cube_drafts_${userId}`;
    }

    function generateId() {
        return 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // --- Thumbnail Generation ---

    function generateThumbnail(canvas, maxSize = 200) {
        const thumb = document.createElement('canvas');
        const scale = maxSize / Math.max(canvas.width, canvas.height);
        thumb.width = canvas.width * scale;
        thumb.height = canvas.height * scale;
        const ctx = thumb.getContext('2d');
        ctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
        return thumb.toDataURL('image/jpeg', 0.6);
    }

    // --- Public API ---

    function saveDraft(userId, draftData, existingDraftId = null) {
        if (!userId) return { success: false, message: 'User belum login' };

        const key = getDraftsKey(userId);
        let drafts = JSON.parse(localStorage.getItem(key) || '[]');

        const now = new Date().toISOString();

        if (existingDraftId) {
            // Update existing draft
            const index = drafts.findIndex(d => d.id === existingDraftId);
            if (index === -1) {
                return { success: false, message: 'Draft tidak ditemukan' };
            }
            drafts[index] = {
                ...drafts[index],
                ...draftData,
                updatedAt: now
            };
            
            try {
                localStorage.setItem(key, JSON.stringify(drafts));
                return { success: true, message: 'Draft berhasil disimpan!', draftId: existingDraftId };
            } catch (e) {
                // handle quota exception below
            }
        } else {
            // Create new draft
            const draft = {
                id: generateId(),
                name: draftData.name || `Draft ${drafts.length + 1}`,
                layout: draftData.layout,
                photos: draftData.photos,
                filters: { ...draftData.filters },
                eventInfo: { ...draftData.eventInfo },
                thumbnail: draftData.thumbnail || null,
                createdAt: now,
                updatedAt: now
            };
            drafts.unshift(draft); // newest first
            
            try {
                localStorage.setItem(key, JSON.stringify(drafts));
                return { success: true, message: 'Draft berhasil disimpan!', draftId: draft.id };
            } catch (e) {
                // handle quota exception below
            }
        }

        try {
            localStorage.setItem(key, JSON.stringify(drafts));
            // This is just a fallback for the catch block
            return { success: true, message: 'Draft berhasil disimpan!' };
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                return { success: false, message: 'Penyimpanan penuh! Hapus beberapa draft lama.' };
            }
            return { success: false, message: 'Gagal menyimpan draft: ' + e.message };
        }
    }

    function getDrafts(userId) {
        if (!userId) return [];
        const key = getDraftsKey(userId);
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    function getDraft(userId, draftId) {
        const drafts = getDrafts(userId);
        return drafts.find(d => d.id === draftId) || null;
    }

    function deleteDraft(userId, draftId) {
        if (!userId) return { success: false, message: 'User belum login' };

        const key = getDraftsKey(userId);
        let drafts = JSON.parse(localStorage.getItem(key) || '[]');
        const index = drafts.findIndex(d => d.id === draftId);

        if (index === -1) {
            return { success: false, message: 'Draft tidak ditemukan' };
        }

        drafts.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(drafts));
        return { success: true, message: 'Draft berhasil dihapus!' };
    }

    function renameDraft(userId, draftId, newName) {
        if (!userId) return { success: false, message: 'User belum login' };
        if (!newName || newName.trim().length === 0) {
            return { success: false, message: 'Nama draft tidak boleh kosong' };
        }

        const key = getDraftsKey(userId);
        let drafts = JSON.parse(localStorage.getItem(key) || '[]');
        const draft = drafts.find(d => d.id === draftId);

        if (!draft) {
            return { success: false, message: 'Draft tidak ditemukan' };
        }

        draft.name = newName.trim();
        draft.updatedAt = new Date().toISOString();
        localStorage.setItem(key, JSON.stringify(drafts));
        return { success: true, message: 'Nama draft berhasil diubah!' };
    }

    function getDraftCount(userId) {
        return getDrafts(userId).length;
    }

    return {
        saveDraft,
        getDrafts,
        getDraft,
        deleteDraft,
        renameDraft,
        getDraftCount,
        generateThumbnail
    };
})();
