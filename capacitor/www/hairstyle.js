// ===== API Configuration =====
const API_BASE_URL = '';

// ===== Icon System (SVG Icons) =====
const ICONS = {
    camera: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>`,
    upload: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
    </svg>`,
    sparkles: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
    </svg>`,
    arrowLeft: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
    </svg>`,
    download: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>`,
    refresh: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>`,
    share: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
    </svg>`
};

// ===== Preset Data with Image Paths =====
const PRESETS = {
    mens: [
        { id: 'none', name: 'なし', prompt: null, image: null },
        { id: 'short', name: 'ショート', prompt: '清潔感のある短髪、サイドすっきり、トップに軽い動き', image: '/images/presets/mens/short.png' },
        { id: 'twoblock', name: 'ツーブロック', prompt: 'サイドを刈り上げたツーブロック、トップは長めで流す', image: '/images/presets/mens/twoblock.png' },
        { id: 'mash', name: 'マッシュ', prompt: '丸みのあるマッシュヘア、前髪重め、柔らかい印象', image: '/images/presets/mens/mash.png' },
        { id: 'center', name: 'センターパート', prompt: 'センター分け、顔周りをフレーミング、韓国風', image: '/images/presets/mens/center.png' },
        { id: 'wolf', name: 'ウルフ', prompt: 'ウルフカット、襟足長め、レイヤー多め、動きのあるスタイル', image: '/images/presets/mens/wolf.png' },
        { id: 'perm', name: 'パーマ', prompt: 'ゆるめのパーマ、ナチュラルなウェーブ、こなれ感', image: '/images/presets/mens/perm.png' },
        { id: 'long', name: 'ロング', prompt: '肩につく長さ、ナチュラルなストレート、清潔感', image: '/images/presets/mens/long.png' },
    ],
    ladies: [
        { id: 'none', name: 'なし', prompt: null, image: null },
        { id: 'short', name: 'ショート', prompt: '耳が出るショートヘア、すっきりシルエット、女性らしい', image: '/images/presets/ladies/short.png' },
        { id: 'bob', name: 'ボブ', prompt: 'あご下ラインのボブ、内巻き、清楚な印象', image: '/images/presets/ladies/bob.png' },
        { id: 'lob', name: 'ロブ', prompt: '肩につくロングボブ、外ハネ、こなれ感', image: '/images/presets/ladies/lob.png' },
        { id: 'medium', name: 'ミディアム', prompt: '鎖骨ラインのミディアム、レイヤー入り、ナチュラル', image: '/images/presets/ladies/medium.png' },
        { id: 'layer', name: 'レイヤー', prompt: 'たっぷりレイヤーの動きのあるスタイル、顔周りに軽さ', image: '/images/presets/ladies/layer.png' },
        { id: 'long', name: 'ロング', prompt: '胸下までのロングヘア、つやつやストレート、清楚', image: '/images/presets/ladies/long.png' },
        { id: 'wave', name: 'ウェーブ', prompt: 'ゆるふわウェーブ、巻き髪、華やかな印象', image: '/images/presets/ladies/wave.png' },
    ]
};

const LENGTH_MAP = {
    shorter: 'make the hair shorter',
    same: '',
    longer: 'make the hair longer'
};

const COLOR_MAP = {
    same: '',
    black: 'jet black hair color',
    brown: 'brown hair color',
    ash: 'ash gray hair color'
};

// ===== DOM Elements =====
const inputSection = document.getElementById('inputSection');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');

const photoPlaceholder = document.getElementById('photoPlaceholder');
const photoPreview = document.getElementById('photoPreview');
const photoInput = document.getElementById('photoInput');
const photoActions = document.getElementById('photoActions');
const retakeBtn = document.getElementById('retakeBtn');

const modeTabs = document.querySelectorAll('.mode-tab');
const genderTabs = document.querySelectorAll('.gender-tab');
const presetRow = document.getElementById('presetRow');
const generateBtn = document.getElementById('generateBtn');

const resultImage = document.getElementById('resultImage');
const backBtn = document.getElementById('backBtn');
const shareBtn = document.getElementById('shareBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const adjustLength = document.getElementById('adjustLength');
const adjustColor = document.getElementById('adjustColor');

// ===== State =====
let photoData = null;
let generatedData = null;
let currentGender = 'mens';
let selectedPreset = null;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    renderPresets(currentGender);
});

// ===== Event Listeners =====

// Photo selection
photoPlaceholder.addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', (e) => {
    if (e.target.files[0]) loadPhoto(e.target.files[0]);
});

retakeBtn.addEventListener('click', () => {
    photoInput.click();
});

// Mode tabs
modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// Gender tabs
genderTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        genderTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentGender = tab.dataset.gender;
        selectedPreset = null;
        renderPresets(currentGender);
        updateGenerateButton();
    });
});

// Generate
generateBtn.addEventListener('click', generate);

// Result controls
backBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
});

shareBtn.addEventListener('click', async () => {
    if (navigator.share && generatedData) {
        try {
            const blob = await fetch(generatedData).then(r => r.blob());
            const file = new File([blob], 'hairstyle.png', { type: 'image/png' });
            await navigator.share({ files: [file] });
        } catch (e) {
            console.log('Share cancelled');
        }
    }
});

regenerateBtn.addEventListener('click', regenerate);
downloadBtn.addEventListener('click', download);

// ===== Functions =====

function renderPresets(gender) {
    const presets = PRESETS[gender];
    presetRow.innerHTML = '';

    presets.forEach(preset => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.dataset.presetId = preset.id;

        const thumb = document.createElement('div');
        thumb.className = 'preset-thumb';

        if (preset.id === 'none') {
            thumb.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke-width="1.5"/>
                <path stroke-linecap="round" stroke-width="1.5" d="M6 6l12 12"/>
            </svg>`;
        } else if (preset.image) {
            // サムネイル画像を表示
            const img = document.createElement('img');
            img.src = preset.image;
            img.alt = preset.name;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            // 画像が読み込めない場合はプレースホルダーを表示
            img.onerror = () => {
                thumb.innerHTML = `<span style="font-size:12px;color:#999;">${preset.name.charAt(0)}</span>`;
                thumb.style.background = `linear-gradient(135deg, #e0e0e0, #f5f5f5)`;
            };
            thumb.appendChild(img);
        } else {
            // フォールバック
            thumb.style.background = `linear-gradient(135deg, #e0e0e0, #f5f5f5)`;
            thumb.innerHTML = `<span style="font-size:12px;color:#999;">${preset.name.charAt(0)}</span>`;
        }

        const label = document.createElement('div');
        label.className = 'preset-label';
        label.textContent = preset.name;

        item.appendChild(thumb);
        item.appendChild(label);
        item.addEventListener('click', () => selectPreset(preset, item));
        presetRow.appendChild(item);
    });
}

function selectPreset(preset, element) {
    document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('selected'));

    if (preset.id === 'none') {
        selectedPreset = null;
    } else {
        selectedPreset = preset;
        element.classList.add('selected');
    }

    updateGenerateButton();
}

function loadPhoto(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 640;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            } else if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            photoData = canvas.toDataURL('image/jpeg', 0.85);
            photoPreview.src = photoData;
            photoPreview.classList.remove('hidden');
            photoPlaceholder.classList.add('hidden');
            photoActions.classList.remove('hidden');

            updateGenerateButton();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function updateGenerateButton() {
    generateBtn.disabled = !(photoData && selectedPreset);
}

async function generate() {
    if (!photoData || !selectedPreset) return;

    inputSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/vision/hairstyle/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                face: photoData,
                preset: selectedPreset.prompt,
                presetName: selectedPreset.name,
                gender: currentGender
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Generation failed');
        }

        generatedData = data.generatedImage;
        resultImage.src = generatedData;

        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        loadingSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        alert(`エラー: ${error.message}`);
    }
}

async function regenerate() {
    if (!generatedData) return;

    const lengthAdj = adjustLength.value;
    const colorAdj = adjustColor.value;

    if (lengthAdj === 'same' && colorAdj === 'same') {
        alert('調整項目を選択してください');
        return;
    }

    resultSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/vision/hairstyle/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                face: photoData,
                currentImage: generatedData,
                adjustments: {
                    length: LENGTH_MAP[lengthAdj],
                    color: COLOR_MAP[colorAdj]
                }
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Regeneration failed');
        }

        generatedData = data.generatedImage;
        resultImage.src = generatedData;

        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        adjustLength.value = 'same';
        adjustColor.value = 'same';

    } catch (error) {
        console.error('Error:', error);
        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        alert(`エラー: ${error.message}`);
    }
}

function download() {
    if (!generatedData) return;
    const link = document.createElement('a');
    link.href = generatedData;
    link.download = `hairstyle_${Date.now()}.png`;
    link.click();
}
