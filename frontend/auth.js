// ===== Auth & Credits Module =====
// Supabase認証 + クレジット管理 + Stripe課金

let supabaseClient = null;
let currentUser = null;
let userProfile = null;
let appConfig = null;

// --- 初期化 ---
async function initAuth() {
    try {
        // サーバーから設定を取得
        const res = await fetch('/api/v1/config');
        appConfig = await res.json();

        if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) {
            console.warn('Supabase未設定: 認証スキップ');
            return;
        }

        // Supabase JS Client (CDNから読み込み)
        const { createClient } = supabase;
        supabaseClient = createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);

        // セッション確認
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            await loadProfile(session.access_token);
        }

        // 認証状態の変化を監視
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await loadProfile(session.access_token);
                updateUI();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                userProfile = null;
                updateUI();
            }
        });

        updateUI();

    } catch (e) {
        console.error('Auth初期化エラー:', e);
    }
}

// --- Googleログイン ---
async function loginWithGoogle() {
    if (!supabaseClient) {
        alert('認証が設定されていません');
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        }
    });
    if (error) {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました');
    }
}

// --- ログアウト ---
async function logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
    userProfile = null;
    updateUI();
}

// --- プロフィール取得 ---
async function loadProfile(token) {
    try {
        const res = await fetch('/api/v1/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            userProfile = await res.json();
        }
    } catch (e) {
        console.error('プロフィール取得エラー:', e);
    }
}

// --- 認証トークン取得 ---
async function getAuthToken() {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
}

// --- 認証付きfetch ---
async function authFetch(url, options = {}) {
    const token = await getAuthToken();
    if (!token) {
        showLoginModal();
        throw new Error('ログインが必要です');
    }
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        }
    });
}

// --- クレジット購入 ---
async function purchaseCredits(planId) {
    try {
        const res = await authFetch('/api/v1/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: planId })
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            alert('購入処理に失敗しました');
        }
    } catch (e) {
        console.error('購入エラー:', e);
    }
}

// --- UI更新 ---
function updateUI() {
    const loginSection = document.getElementById('loginSection');
    const appContent = document.getElementById('appContent');
    const creditBadge = document.getElementById('creditBadge');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    if (currentUser && userProfile) {
        // ログイン済み
        if (loginSection) loginSection.classList.add('hidden');
        if (appContent) appContent.classList.remove('hidden');

        // クレジット表示
        if (creditBadge) {
            const credits = userProfile.credits;
            if (userProfile.is_premium) {
                creditBadge.textContent = '∞';
                creditBadge.title = 'プレミアム会員';
            } else {
                creditBadge.textContent = credits;
                creditBadge.title = `残りクレジット: ${credits}`;
            }
        }

        // ユーザー情報
        if (userAvatar && userProfile.avatar_url) {
            userAvatar.src = userProfile.avatar_url;
            userAvatar.classList.remove('hidden');
        }
        if (userName) {
            userName.textContent = userProfile.display_name || userProfile.email || '';
        }
    } else {
        // 未ログイン
        if (loginSection) loginSection.classList.remove('hidden');
        if (appContent) appContent.classList.add('hidden');
    }
}

// --- クレジット更新（API呼び出し後） ---
function updateCredits(newCredits) {
    if (userProfile) {
        userProfile.credits = newCredits;
        updateUI();
    }
}

// --- ログインモーダル表示 ---
function showLoginModal() {
    const loginSection = document.getElementById('loginSection');
    if (loginSection) {
        loginSection.classList.remove('hidden');
        document.getElementById('appContent')?.classList.add('hidden');
    }
}

// --- 購入モーダル表示 ---
function showPurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    if (modal) modal.classList.remove('hidden');
}

function hidePurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    if (modal) modal.classList.add('hidden');
}

// --- 支払い成功チェック ---
function checkPaymentResult() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
        const credits = params.get('credits');
        alert(`${credits}クレジットを追加しました！`);
        // URLパラメータをクリア
        window.history.replaceState({}, '', '/');
        // プロフィール再読み込み
        setTimeout(async () => {
            const token = await getAuthToken();
            if (token) await loadProfile(token);
            updateUI();
        }, 1000);
    } else if (params.get('payment') === 'cancel') {
        window.history.replaceState({}, '', '/');
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    checkPaymentResult();
});
