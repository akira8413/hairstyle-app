// ===== API Configuration =====
// For Capacitor: change to your production URL
const API_BASE_URL = '';  // Empty = same origin (Web), or 'https://your-api.com' (Capacitor)

// ===== Preset Data =====
const PRESETS = {
    mens: [
        { id: 'mens_very_short', name: 'ベリーショート', desc: 'スッキリ爽やか', prompt: 'very short hair, buzz cut style, clean and fresh look' },
        { id: 'mens_short', name: 'ショート', desc: 'スタンダード', prompt: 'short hair, natural short hairstyle for men' },
        { id: 'mens_two_block', name: 'ツーブロック', desc: '刈り上げスタイル', prompt: 'two-block haircut, undercut style, shaved sides with longer top' },
        { id: 'mens_mash', name: 'マッシュ', desc: '丸みのある', prompt: 'mushroom haircut, mash hairstyle, rounded shape covering forehead' },
        { id: 'mens_center_part', name: 'センターパート', desc: '真ん中分け', prompt: 'center parted hair, middle part hairstyle for men' },
        { id: 'mens_medium', name: 'ミディアム', desc: '耳が隠れる程度', prompt: 'medium length hair for men, ear-covering length' },
        { id: 'mens_wolf', name: 'ウルフ', desc: 'レイヤースタイル', prompt: 'wolf cut hairstyle, layered hair with volume on top and thin ends' },
        { id: 'mens_long', name: 'ロング', desc: '肩より長い', prompt: 'long hair for men, shoulder length or longer' },
    ],
    ladies: [
        { id: 'ladies_very_short', name: 'ベリーショート', desc: 'ボーイッシュ', prompt: 'very short pixie cut for women, boyish style' },
        { id: 'ladies_short_bob', name: 'ショートボブ', desc: 'あご上ライン', prompt: 'short bob haircut, chin-length bob for women' },
        { id: 'ladies_bob', name: 'ボブ', desc: '定番ボブ', prompt: 'bob haircut, classic bob hairstyle for women' },
        { id: 'ladies_lob', name: 'ロブ', desc: 'ロングボブ', prompt: 'lob haircut, long bob, shoulder-length bob' },
        { id: 'ladies_medium', name: 'ミディアム', desc: '鎖骨くらい', prompt: 'medium length hair for women, collarbone length' },
        { id: 'ladies_medium_layer', name: 'レイヤーミディ', desc: '動きのある', prompt: 'medium layered haircut for women, movement and volume' },
        { id: 'ladies_long', name: 'ロング', desc: '胸より長い', prompt: 'long straight hair for women, chest length or longer' },
        { id: 'ladies_long_wave', name: 'ロングウェーブ', desc: 'ゆるふわ巻き', prompt: 'long wavy hair for women, loose waves, romantic style' },
    ]
};

// Adjustment mappings
const LENGTH_MAP = {
    shorter: 'make the hair shorter than before',
    same: '',
    longer: 'make the hair longer than before'
};

const COLOR_MAP = {
    same: '',
    black: 'jet black hair color',
    dark_brown: 'dark brown hair color',
    brown: 'medium brown hair color',
    ash: 'ash gray hair color'
};

const STYLE_MAP = {
    same: '',
    straight: 'straight hair texture',
    wavy: 'wavy hair texture',
    curly: 'curly permed hair'
};

// ===== DOM Elements =====
const inputSection = document.getElementById('inputSection');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');

// Face photo
const faceDropZone = document.getElementById('faceDropZone');
const faceInput = document.getElementById('faceInput');
const facePreview = document.getElementById('facePreview');
const faceButtons = document.getElementById('faceButtons');
const faceCameraBtn = document.getElementById('faceCameraBtn');
const faceFileBtn = document.getElementById('faceFileBtn');

// Presets
const presetContainer = document.getElementById('presetContainer');
const tabs = document.querySelectorAll('.tab');
const selectionSummary = document.getElementById('selectionSummary');
const selectedStyleName = document.getElementById('selectedStyleName');

// Buttons
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const retryBtn = document.getElementById('retryBtn');
const regenerateBtn = document.getElementById('regenerateBtn');

// Adjustments
const adjustLength = document.getElementById('adjustLength');
const adjustColor = document.getElementById('adjustColor');
const adjustStyle = document.getElementById('adjustStyle');

// Result display
const resultFace = document.getElementById('resultFace');
const resultGenerated = document.getElementById('resultGenerated');
const resultImageLarge = document.getElementById('resultImageLarge');

// ===== State =====
let faceImageData = null;
let generatedImageData = null;
let currentGender = 'mens';
let selectedPreset = null;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    renderPresets(currentGender);
});

// ===== Event Listeners =====

// Face photo
faceDropZone.addEventListener('click', () => faceInput.click());

if (faceCameraBtn) {
    faceCameraBtn.addEventListener('click', () => {
        faceInput.setAttribute('capture', 'user');
        faceInput.click();
    });
}

if (faceFileBtn) {
    faceFileBtn.addEventListener('click', () => {
        faceInput.removeAttribute('capture');
        faceInput.click();
    });
}

faceInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
});

setupDropZone(faceDropZone, faceInput);

// Gender tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentGender = tab.dataset.gender;
        selectedPreset = null;
        renderPresets(currentGender);
        updateSelectionSummary();
        updateGenerateButton();
    });
});

// Generate button
generateBtn.addEventListener('click', generateHairstyle);

// Result buttons
downloadBtn.addEventListener('click', downloadImage);

retryBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    adjustLength.value = 'same';
    adjustColor.value = 'same';
    adjustStyle.value = 'same';
});

regenerateBtn.addEventListener('click', regenerateWithAdjustments);

// ===== Functions =====

function renderPresets(gender) {
    const presets = PRESETS[gender];
    presetContainer.innerHTML = '';

    presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.dataset.presetId = preset.id;
        btn.innerHTML = `
            <div class="preset-name">${preset.name}</div>
            <div class="preset-desc">${preset.desc}</div>
        `;
        btn.addEventListener('click', () => selectPreset(preset));
        presetContainer.appendChild(btn);
    });
}

function selectPreset(preset) {
    selectedPreset = preset;

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.presetId === preset.id) {
            btn.classList.add('selected');
        }
    });

    updateSelectionSummary();
    updateGenerateButton();
}

function updateSelectionSummary() {
    if (selectedPreset) {
        selectionSummary.classList.remove('hidden');
        selectedStyleName.textContent = selectedPreset.name;
    } else {
        selectionSummary.classList.add('hidden');
    }
}

function loadImage(file) {
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

            faceImageData = canvas.toDataURL('image/jpeg', 0.85);
            facePreview.src = faceImageData;
            facePreview.classList.remove('hidden');
            faceDropZone.classList.add('hidden');

            if (faceButtons) {
                faceButtons.classList.remove('hidden');
            }

            updateGenerateButton();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setupDropZone(dropZone, input) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--color-primary)';
        dropZone.style.background = 'var(--color-surface)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';

        if (e.dataTransfer.files[0]) {
            loadImage(e.dataTransfer.files[0]);
        }
    });
}

function updateGenerateButton() {
    generateBtn.disabled = !(faceImageData && selectedPreset);
}

async function generateHairstyle() {
    if (!faceImageData) {
        alert('顔写真を選択してください');
        return;
    }
    if (!selectedPreset) {
        alert('髪型を選択してください');
        return;
    }

    inputSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/vision/hairstyle/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                face: faceImageData,
                preset: selectedPreset.prompt,
                presetName: selectedPreset.name,
                gender: currentGender
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || data.message || '生成に失敗しました');
        }

        generatedImageData = data.generatedImage;

        resultFace.src = faceImageData;
        resultGenerated.src = generatedImageData;
        resultImageLarge.src = generatedImageData;

        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        loadingSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        alert(`エラー: ${error.message}`);
    }
}

async function regenerateWithAdjustments() {
    if (!generatedImageData) return;

    const lengthAdj = adjustLength.value;
    const colorAdj = adjustColor.value;
    const styleAdj = adjustStyle.value;

    if (lengthAdj === 'same' && colorAdj === 'same' && styleAdj === 'same') {
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
                face: faceImageData,
                currentImage: generatedImageData,
                preset: selectedPreset ? selectedPreset.prompt : null,
                adjustments: {
                    length: LENGTH_MAP[lengthAdj],
                    color: COLOR_MAP[colorAdj],
                    style: STYLE_MAP[styleAdj]
                }
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || data.message || '再生成に失敗しました');
        }

        generatedImageData = data.generatedImage;

        resultGenerated.src = generatedImageData;
        resultImageLarge.src = generatedImageData;

        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        adjustLength.value = 'same';
        adjustColor.value = 'same';
        adjustStyle.value = 'same';

    } catch (error) {
        console.error('Error:', error);
        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        alert(`エラー: ${error.message}`);
    }
}

function downloadImage() {
    if (!generatedImageData) return;

    const link = document.createElement('a');
    link.href = generatedImageData;
    link.download = `hairstyle_${Date.now()}.png`;
    link.click();
}
