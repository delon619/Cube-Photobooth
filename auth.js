// ============================================
// Auth Module — Cube PhotoBox Studio
// Uses localStorage + SHA-256 hashing
// ============================================

const Auth = (() => {
    const USERS_KEY = 'cube_users';
    const SESSION_KEY = 'cube_session';

    // --- Helpers ---

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getInitials(name) {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    // --- Public API ---

    async function signUp(username, email, password) {
        const users = getUsers();

        // Validate
        if (!username || username.trim().length < 2) {
            return { success: false, message: 'Username minimal 2 karakter' };
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, message: 'Email tidak valid' };
        }
        if (!password || password.length < 6) {
            return { success: false, message: 'Password minimal 6 karakter' };
        }

        // Check duplicates
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'Email sudah terdaftar' };
        }

        const hashedPassword = await hashPassword(password);
        const user = {
            id: generateId(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        saveUsers(users);

        // Auto sign in
        setSession(user);

        return { success: true, user: sanitizeUser(user) };
    }

    async function signIn(email, password) {
        const users = getUsers();

        if (!email || !password) {
            return { success: false, message: 'Email dan password wajib diisi' };
        }

        const user = users.find(u => u.email === email.toLowerCase().trim());
        if (!user) {
            return { success: false, message: 'Email atau password salah' };
        }

        const hashedPassword = await hashPassword(password);
        if (user.password !== hashedPassword) {
            return { success: false, message: 'Email atau password salah' };
        }

        setSession(user);
        return { success: true, user: sanitizeUser(user) };
    }

    function signOut() {
        localStorage.removeItem(SESSION_KEY);
    }

    function getCurrentUser() {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        if (!session) return null;

        // Verify user still exists
        const users = getUsers();
        const user = users.find(u => u.id === session.id);
        if (!user) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        return sanitizeUser(user);
    }

    function isLoggedIn() {
        return getCurrentUser() !== null;
    }

    // --- Internal ---

    function setSession(user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email
        }));
    }

    function sanitizeUser(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            initials: getInitials(user.username),
            createdAt: user.createdAt
        };
    }

    return {
        signUp,
        signIn,
        signOut,
        getCurrentUser,
        isLoggedIn
    };
})();
