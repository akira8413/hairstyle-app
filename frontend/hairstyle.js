// ===== プリセットデータ =====
const PRESETS = {
    mens: [
        { id: 'mens_very_short', name: 'ベリーショート', icon: '💈', desc: 'スッキリ爽やか', prompt: 'very short hair, buzz cut style, clean and fresh look' },
        { id: 'mens_short', name: 'ショート', icon: '✂️', desc: 'スタンダード', prompt: 'short hair, natural short hairstyle for men' },
        { id: 'mens_two_block', name: 'ツーブロック', icon: '🔥', desc: '刈り上げスタイル', prompt: 'two-block haircut, undercut style, shaved sides with longer top' },
        { id: 'mens_mash', name: 'マッシュ', icon: '🍄', desc: '丸みのある', prompt: 'mushroom haircut, mash hairstyle, rounded shape covering forehead' },
        { id: 'mens_center_part', name: 'センターパート', icon: '↔️', desc: '真ん中分け', prompt: 'center parted hair, middle part hairstyle for men' },
        { id: 'mens_medium', name: 'ミディアム', icon: '💇‍♂️', desc: '耳が隠れる程度', prompt: 'medium length hair for men, ear-covering length' },
        { id: 'mens_wolf', name: 'ウルフ', icon: '🐺', desc: 'レイヤースタイル', prompt: 'wolf cut hairstyle, layered hair with volume on top and thin ends' },
        { id: 'mens_long', name: 'ロング', icon: '🎸', desc: '肩より長い', prompt: 'long hair for men, shoulder length or longer' },
    ],
    ladies: [
        { id: 'ladies_very_short', name: 'ベリーショート', icon: '💈', desc: 'ボーイッシュ', prompt: 'very short pixie cut for women, boyish style' },
        { id: 'ladies_short_bob', name: 'ショートボブ', icon: '✂️', desc: 'あご上ライン', prompt: 'short bob haircut, chin-length bob for women' },
        { id: 'ladies_bob', name: 'ボブ', icon: '👩', desc: '定番ボブ', prompt: 'bob haircut, classic bob hairstyle for women' },
        { id: 'ladies_lob', name: 'ロブ', icon: '💇‍♀️', desc: 'ロングボブ', prompt: 'lob haircut, long bob, shoulder-length bob' },
        { id: 'ladies_medium', name: 'ミディアム', icon: '🌸', desc: '鎖骨くらい', prompt: 'medium length hair for women, collarbone length' },
        { id: 'ladies_medium_layer', name: 'レイヤーミディ', icon: '🌊', desc: '動きのある', prompt: 'medium layered haircut for women, movement and volume' },
        { id: 'ladies_long', name: 'ロング', icon: '👸', desc: '胸より長い', prompt: 'long straight hair for women, chest length or longer' },
        { id: 'ladies_long_wave', name: 'ロングウェーブ', icon: '🌊', desc: 'ゆるふわ巻き', prompt: 'long wavy hair for women, loose waves, romantic style' },
    ]
};

// 調整オプションのマッピング
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
    light_brown: 'light brown hair color',
    blonde: 'blonde hair color',
    ash: 'ash gray hair color',
    red: 'reddish brown hair color'
};

const STYLE_MAP = {
    same: '',
    straight: 'straight hair texture',
    wavy: 'wavy hair texture',
    curly: 'curly permed hair',
    natural: 'natural texture hair'
};

// ===== DOM要素 =====
const inputSection = document.getElementById('inputSection');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');

// 顔写真
const faceDropZone = document.getElementById('faceDropZone');
const faceInput = document.getElementById('faceInput');
const facePreview = document.getElementById('facePreview');
const faceCameraBtn = document.getElementById('faceCameraBtn');
const faceFileBtn = document.getElementById('faceFileBtn');

// 髪型参照（オプション）
const hairstyleDropZone = document.getElementById('hairstyleDropZone');
const hairstyleInput = document.getElementById('hairstyleInput');
const hairstylePreview = document.getElementById('hairstylePreview');
const referenceToggle = document.getElementById('referenceToggle');
const referenceContent = document.getElementById('referenceContent');
const toggleArrow = document.getElementById('toggleArrow');

// プリセット
const presetContainer = document.getElementById('presetContainer');
const genderTabs = document.querySelectorAll('.gender-tab');
const selectionSummary = document.getElementById('selectionSummary');
const selectedStyleName = document.getElementById('selectedStyleName');

// ボタン
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const retryBtn = document.getElementById('retryBtn');
const newBtn = document.getElementById('newBtn');
const regenerateBtn = document.getElementById('regenerateBtn');

// 調整
const adjustLength = document.getElementById('adjustLength');
const adjustColor = document.getElementById('adjustColor');
const adjustStyle = document.getElementById('adjustStyle');

// 結果表示
const resultFace = document.getElementById('resultFace');
const resultGenerated = document.getElementById('resultGenerated');
const resultImageLarge = document.getElementById('resultImageLarge');

// ===== 状態 =====
let faceImageData = null;
let hairstyleImageData = null; // オプション参考画像
let generatedImageData = null;
let currentGender = 'mens';
let selectedPreset = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    renderPresets(currentGender);
});

// ===== イベントリスナー =====

// 顔写真
faceDropZone.addEventListener('click', () => faceInput.click());
faceCameraBtn.addEventListener('click', () => {
    faceInput.setAttribute('capture', 'user');
    faceInput.click();
});
faceFileBtn.addEventListener('click', () => {
    faceInput.removeAttribute('capture');
    faceInput.click();
});
faceInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        loadImage(e.target.files[0], 'face');
    }
});
setupDropZone(faceDropZone, faceInput, 'face');

// メンズ/レディース切り替え
genderTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        genderTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentGender = tab.dataset.gender;
        selectedPreset = null;
        renderPresets(currentGender);
        updateSelectionSummary();
        updateGenerateButton();
    });
});

// 参考画像トグル
referenceToggle.addEventListener('click', () => {
    referenceContent.classList.toggle('hidden');
    toggleArrow.textContent = referenceContent.classList.contains('hidden') ? '▼' : '▲';
});

// 参考画像アップロード
hairstyleDropZone.addEventListener('click', () => hairstyleInput.click());
hairstyleInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        loadImage(e.target.files[0], 'hairstyle');
    }
});
setupDropZone(hairstyleDropZone, hairstyleInput, 'hairstyle');

// 合成ボタン
generateBtn.addEventListener('click', generateHairstyle);

// 結果画面のボタン
downloadBtn.addEventListener('click', downloadImage);
retryBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    // 調整をリセット
    adjustLength.value = 'same';
    adjustColor.value = 'same';
    adjustStyle.value = 'same';
});
newBtn.addEventListener('click', resetAll);

// 再生成ボタン
regenerateBtn.addEventListener('click', regenerateWithAdjustments);

// ===== 関数 =====

function renderPresets(gender) {
    const presets = PRESETS[gender];
    presetContainer.innerHTML = '';

    presets.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.dataset.presetId = preset.id;
        btn.innerHTML = `
            <span class="preset-icon">${preset.icon}</span>
            <span class="preset-name">${preset.name}</span>
            <span class="preset-desc">${preset.desc}</span>
        `;
        btn.addEventListener('click', () => selectPreset(preset));
        presetContainer.appendChild(btn);
    });
}

function selectPreset(preset) {
    selectedPreset = preset;

    // UI更新
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
        selectedStyleName.textContent = `${selectedPreset.icon} ${selectedPreset.name}`;
    } else {
        selectionSummary.classList.add('hidden');
    }
}

function loadImage(file, type) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // リサイズ（速度改善のため小さめに）
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxSize = 640; // 800→640に縮小
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

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            if (type === 'face') {
                faceImageData = dataUrl;
                facePreview.src = dataUrl;
                facePreview.classList.remove('hidden');
                faceDropZone.classList.add('hidden');
            } else {
                hairstyleImageData = dataUrl;
                hairstylePreview.src = dataUrl;
                hairstylePreview.classList.remove('hidden');
                hairstyleDropZone.classList.add('hidden');
            }

            updateGenerateButton();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setupDropZone(dropZone, input, type) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#667eea';
        dropZone.style.background = '#f0f4ff';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.background = '';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.background = '';

        if (e.dataTransfer.files[0]) {
            loadImage(e.dataTransfer.files[0], type);
        }
    });
}

function updateGenerateButton() {
    // 顔写真 + (プリセット または 参考画像) が必要
    const hasStyle = selectedPreset || hairstyleImageData;
    generateBtn.disabled = !(faceImageData && hasStyle);
}

async function generateHairstyle() {
    if (!faceImageData) {
        alert('顔写真を選択してください');
        return;
    }
    if (!selectedPreset && !hairstyleImageData) {
        alert('髪型を選択するか、参考画像をアップロードしてください');
        return;
    }

    // ローディング表示
    inputSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        const response = await fetch('/api/v1/vision/hairstyle/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                face: faceImageData,
                hairstyle: hairstyleImageData, // オプション
                preset: selectedPreset ? selectedPreset.prompt : null,
                presetName: selectedPreset ? selectedPreset.name : null,
                gender: currentGender
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || data.message || '合成に失敗しました');
        }

        generatedImageData = data.generatedImage;

        // 結果を表示
        resultFace.src = faceImageData;
        resultGenerated.src = generatedImageData;
        resultImageLarge.src = generatedImageData;

        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

    } catch (error) {
        console.error('生成エラー:', error);
        loadingSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        alert(`生成エラー: ${error.message}`);
    }
}

async function regenerateWithAdjustments() {
    if (!generatedImageData) return;

    const lengthAdj = adjustLength.value;
    const colorAdj = adjustColor.value;
    const styleAdj = adjustStyle.value;

    // 全て「現状維持」なら何もしない
    if (lengthAdj === 'same' && colorAdj === 'same' && styleAdj === 'same') {
        alert('調整項目を選択してください');
        return;
    }

    // ローディング表示
    resultSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    try {
        const response = await fetch('/api/v1/vision/hairstyle/adjust', {
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

        // 結果を更新
        resultGenerated.src = generatedImageData;
        resultImageLarge.src = generatedImageData;

        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        // 調整をリセット
        adjustLength.value = 'same';
        adjustColor.value = 'same';
        adjustStyle.value = 'same';

    } catch (error) {
        console.error('再生成エラー:', error);
        loadingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        alert(`再生成エラー: ${error.message}`);
    }
}

function downloadImage() {
    if (!generatedImageData) return;

    const link = document.createElement('a');
    link.href = generatedImageData;
    link.download = `hairstyle_${Date.now()}.png`;
    link.click();
}

function resetAll() {
    faceImageData = null;
    hairstyleImageData = null;
    generatedImageData = null;
    selectedPreset = null;

    facePreview.classList.add('hidden');
    faceDropZone.classList.remove('hidden');
    hairstylePreview.classList.add('hidden');
    hairstyleDropZone.classList.remove('hidden');

    faceInput.value = '';
    hairstyleInput.value = '';

    // プリセット選択解除
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // 調整リセット
    adjustLength.value = 'same';
    adjustColor.value = 'same';
    adjustStyle.value = 'same';

    updateSelectionSummary();
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');

    updateGenerateButton();
}
