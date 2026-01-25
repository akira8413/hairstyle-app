// ===== API Configuration =====
const API_BASE_URL = '';

// ===== Preset Data with Thumbnail Placeholders =====
const PRESETS = {
    mens: [
        { id: 'none', name: 'なし', prompt: null, thumb: null },
        { id: 'mens_short', name: 'ショート', prompt: 'short hair, natural short hairstyle for men, clean cut', thumb: 'M1' },
        { id: 'mens_two_block', name: 'ツーブロック', prompt: 'two-block haircut, undercut style, shaved sides with longer top', thumb: 'M2' },
        { id: 'mens_mash', name: 'マッシュ', prompt: 'mushroom haircut, mash hairstyle, rounded shape covering forehead', thumb: 'M3' },
        { id: 'mens_center', name: 'センターパート', prompt: 'center parted hair, middle part hairstyle for men', thumb: 'M4' },
        { id: 'mens_wolf', name: 'ウルフ', prompt: 'wolf cut hairstyle, layered hair with volume on top', thumb: 'M5' },
        { id: 'mens_perm', name: 'パーマ', prompt: 'permed hair for men, curly textured hairstyle', thumb: 'M6' },
        { id: 'mens_long', name: 'ロング', prompt: 'long hair for men, shoulder length or longer', thumb: 'M7' },
    ],
    ladies: [
        { id: 'none', name: 'なし', prompt: null, thumb: null },
        { id: 'ladies_short', name: 'ショート', prompt: 'short pixie cut for women, boyish style', thumb: 'L1' },
        { id: 'ladies_bob', name: 'ボブ', prompt: 'bob haircut, classic bob hairstyle for women', thumb: 'L2' },
        { id: 'ladies_lob', name: 'ロブ', prompt: 'lob haircut, long bob, shoulder-length', thumb: 'L3' },
        { id: 'ladies_medium', name: 'ミディアム', prompt: 'medium length hair for women, collarbone length', thumb: 'L4' },
        { id: 'ladies_layer', name: 'レイヤー', prompt: 'layered haircut for women, movement and volume', thumb: 'L5' },
        { id: 'ladies_long', name: 'ロング', prompt: 'long straight hair for women', thumb: 'L6' },
        { id: 'ladies_wave', name: 'ウェーブ', prompt: 'long wavy hair for women, loose waves', thumb: 'L7' },
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
        } else {
            // Placeholder with initials
            thumb.style.background = `linear-gradient(135deg, #e0e0e0, #f5f5f5)`;
            thumb.innerHTML = `<span style="font-size:14px;color:#999;">${preset.thumb}</span>`;
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
