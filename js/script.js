// --- State Management ---
let diaries = JSON.parse(localStorage.getItem('diaries_app_data')) || {};
let currentDate = new Date(); // Active viewing month
let selectedDate = new Date(); // Selected date for editing
let selectedMood = '';
let selectedStamp = '';
let currentPhotoBase64 = '';

const moodMap = {
    happy: { emoji: '💖', text: 'さいこー', color: 'bg-p-pink' },
    good: { emoji: '🌸', text: 'はっぴー', color: 'bg-p-pink-light' },
    neutral: { emoji: '☁️', text: 'ふつう', color: 'bg-p-blue-light' },
    tired: { emoji: '💤', text: 'おつかれ', color: 'bg-p-purple' },
    sad: { emoji: '☔', text: 'しょぼん', color: 'bg-p-blue' }
};

const stampMap = {
    birthday: '🎂', travel: '✈️', eat: '🍱', shop: '🛍️', 
    work: '💻', game: '🎮', star: '🌟', none: ''
};

const dayNames = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];

// --- DOM Elements ---
const calendarYearMonth = document.getElementById('calendarYearMonth');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');

const selectedFullDate = document.getElementById('selectedFullDate');
const selectedDayOfWeek = document.getElementById('selectedDayOfWeek');
const diaryTitle = document.getElementById('diaryTitle');
const diaryContent = document.getElementById('diaryContent');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const editorViewTitle = document.getElementById('editorViewTitle');

const diaryList = document.getElementById('diaryList');
const diaryCount = document.getElementById('diaryCount');
const searchBar = document.getElementById('searchBar');

const diaryPhoto = document.getElementById('diaryPhoto');
const photoPreview = document.getElementById('photoPreview');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const removePhotoBtn = document.getElementById('removePhotoBtn');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

const bgmAudio = document.getElementById('bgmAudio');
const bgmToggle = document.getElementById('bgmToggle');
const musicIcon = document.getElementById('musicIcon');
const muteIcon = document.getElementById('muteIcon');

// --- Toast notification ---
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    
    const icon = toast.querySelector('i');
    if (isError) {
        icon.setAttribute('data-lucide', 'alert-circle');
        toast.classList.replace('bg-p-pink', 'bg-rose-400');
    } else {
        icon.setAttribute('data-lucide', 'check-circle-2');
        toast.classList.replace('bg-rose-400', 'bg-p-pink');
    }
    lucide.createIcons();

    toast.classList.remove('translate-y-32', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.add('translate-y-32', 'opacity-0');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3000);
}

// --- Format Helpers ---
function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// --- Image Processing ---
function resizeImage(file, maxWidth = 600) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// --- Render Calendar ---
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarYearMonth.textContent = `${year}年 ${month + 1}月`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    let daysHTML = "";

    for (let x = firstDayIndex; x > 0; x--) {
        daysHTML += `<div class="calendar-day opacity-0"></div>`;
    }

    for (let i = 1; i <= lastDay; i++) {
        const dayDate = new Date(year, month, i);
        const dateKey = formatDateKey(dayDate);
        const hasDiary = diaries[dateKey];
        const isToday = formatDateKey(new Date()) === dateKey;
        const isSelected = formatDateKey(selectedDate) === dateKey;
        
        let dayClasses = "calendar-day cursor-pointer transition-all duration-200 relative ";
        
        if (isSelected) {
            dayClasses += "selected ";
        } else if (isToday) {
            dayClasses += "border-2 border-p-pink text-p-pink font-bold ";
        } else {
            dayClasses += "hover:bg-p-pink-light/30 text-p-text dark:text-pink-100 ";
        }

        if (hasDiary) {
            dayClasses += "has-diary ";
        }

        let moodEmoji = "";
        let stampEmoji = "";
        if (hasDiary && !isSelected) {
            moodEmoji = `<span class="absolute top-0 right-0 text-[10px]">${moodMap[diaries[dateKey].mood]?.emoji || '✍️'}</span>`;
            if (diaries[dateKey].stamp && diaries[dateKey].stamp !== 'none') {
                stampEmoji = `<span class="absolute bottom-0 left-0 text-[10px]">${stampMap[diaries[dateKey].stamp]}</span>`;
            }
        }

        daysHTML += `
            <button onclick="selectDateByDay(${i})" class="${dayClasses}">
                <span>${i}</span>
                ${moodEmoji}
                ${stampEmoji}
            </button>
        `;
    }

    calendarDays.innerHTML = daysHTML;
}

window.selectDateByDay = function(day) {
    selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    loadDiaryEntry();
    renderCalendar();
    highlightSelectedDiaryInList();
};

// --- Load Diary into Editor ---
function loadDiaryEntry() {
    const dateKey = formatDateKey(selectedDate);
    const entry = diaries[dateKey];

    selectedFullDate.textContent = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;
    selectedDayOfWeek.textContent = dayNames[selectedDate.getDay()];

    // Reset selectors
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.stamp-btn').forEach(btn => btn.classList.remove('active'));
    selectedMood = '';
    selectedStamp = 'none';
    currentPhotoBase64 = '';
    photoPreview.src = '';
    photoPreview.classList.add('hidden');
    photoPlaceholder.classList.remove('hidden');
    removePhotoBtn.classList.add('hidden');

    if (entry) {
        diaryTitle.value = entry.title || '';
        diaryContent.value = entry.content || '';
        selectedMood = entry.mood || '';
        selectedStamp = entry.stamp || 'none';
        currentPhotoBase64 = entry.photo || '';
        
        if (selectedMood) {
            const activeBtn = document.querySelector(`[data-mood="${selectedMood}"]`);
            if (activeBtn) activeBtn.classList.add('active');
        }
        
        const activeStampBtn = document.querySelector(`[data-stamp="${selectedStamp}"]`);
        if (activeStampBtn) activeStampBtn.classList.add('active');

        if (currentPhotoBase64) {
            photoPreview.src = currentPhotoBase64;
            photoPreview.classList.remove('hidden');
            photoPlaceholder.classList.add('hidden');
            removePhotoBtn.classList.remove('hidden');
        }
        
        deleteBtn.classList.remove('hidden');
        editorViewTitle.textContent = "おもいでをなおす";
    } else {
        diaryTitle.value = '';
        diaryContent.value = '';
        deleteBtn.classList.add('hidden');
        editorViewTitle.textContent = "きょうのきろく";
        document.querySelector('[data-stamp="none"]').classList.add('active');
    }
}

// --- Save Diary Entry ---
function saveDiary() {
    const dateKey = formatDateKey(selectedDate);
    const title = diaryTitle.value.trim();
    const content = diaryContent.value.trim();

    if (!title && !content && !selectedMood && !currentPhotoBase64) {
        showToast("なにか書いてね〜✨", true);
        return;
    }

    diaries[dateKey] = {
        title: title || "むだいのきろく",
        content: content,
        mood: selectedMood,
        stamp: selectedStamp,
        photo: currentPhotoBase64,
        updatedAt: new Date().toISOString()
    };

    try {
        localStorage.setItem('diaries_app_data', JSON.stringify(diaries));
        showToast("ほぞんしました！✨");
        loadDiaryEntry();
        renderCalendar();
        renderDiaryList();
    } catch (e) {
        showToast("容量がいっぱいかも...画像を消してみて😢", true);
    }
}

// --- Delete Diary Entry ---
function deleteDiary() {
    const dateKey = formatDateKey(selectedDate);
    if (diaries[dateKey]) {
        if (confirm("このおもいでを消しちゃうの？😢")) {
            delete diaries[dateKey];
            localStorage.setItem('diaries_app_data', JSON.stringify(diaries));
            showToast("おもいでを消しました...");
            loadDiaryEntry();
            renderCalendar();
            renderDiaryList();
        }
    }
}

// --- Render Diary List Summary ---
function renderDiaryList(filterQuery = '') {
    const sortedKeys = Object.keys(diaries).sort((a, b) => new Date(b) - new Date(a));
    let listHTML = '';
    let matchCount = 0;

    sortedKeys.forEach(key => {
        const entry = diaries[key];
        const dateObj = new Date(key);
        
        if (filterQuery) {
            const query = filterQuery.toLowerCase();
            if (!entry.title.toLowerCase().includes(query) && 
                !entry.content.toLowerCase().includes(query) && 
                !key.includes(query)) return;
        }

        matchCount++;
        const isSelected = formatDateKey(selectedDate) === key;
        const moodInfo = moodMap[entry.mood];
        const displayMood = moodInfo ? moodInfo.emoji : '✨';
        const displayStamp = entry.stamp && entry.stamp !== 'none' ? stampMap[entry.stamp] : '';
        const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 (${dayNames[dateObj.getDay()].replace('曜日', '')})`;

        listHTML += `
            <div onclick="selectDateByKey('${key}')" data-key="${key}" class="p-5 rounded-[25px] cursor-pointer transition-all duration-300 flex justify-between items-center border-4 ${
                isSelected 
                ? 'bg-p-pink-light border-p-pink shadow-[0_4px_0_#ff8fab] transform scale-[1.02]' 
                : 'bg-white dark:bg-zinc-800 border-p-pink-light/30 hover:border-p-pink-light'
            }">
                <div class="flex-1 min-w-0 pr-4">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-[10px] font-bold text-p-pink uppercase tracking-widest">${key.replace(/-/g, '.')}</span>
                        <span class="text-[10px] bg-p-pink text-white px-2 py-0.5 rounded-full font-bold">${formattedDate}</span>
                        ${displayStamp ? `<span class="text-sm">${displayStamp}</span>` : ''}
                    </div>
                    <div class="flex gap-3 items-start">
                        ${entry.photo ? `<img src="${entry.photo}" class="w-12 h-12 object-cover rounded-xl border-2 border-p-pink-light flex-shrink-0">` : ''}
                        <div class="min-w-0 flex-1">
                            <h4 class="font-bold text-md truncate text-p-text dark:text-pink-100">${entry.title || 'むだい'}</h4>
                            <p class="text-xs text-p-text/60 dark:text-pink-100/60 truncate mt-1">${entry.content || '本文なし'}</p>
                        </div>
                    </div>
                </div>
                <div class="text-3xl filter drop-shadow-sm">
                    ${displayMood}
                </div>
            </div>
        `;
    });

    diaryCount.textContent = `${matchCount}件`;

    if (matchCount === 0) {
        diaryList.innerHTML = `
            <div class="text-center text-p-pink py-16 flex flex-col items-center justify-center gap-4">
                <i data-lucide="ghost" class="w-12 h-12 opacity-30 animate-bounce"></i>
                <span class="font-bold">おもいでがまだないよ...</span>
            </div>
        `;
    } else {
        diaryList.innerHTML = listHTML;
    }
    lucide.createIcons();
}

window.selectDateByKey = function(key) {
    const [y, m, d] = key.split('-').map(Number);
    selectedDate = new Date(y, m - 1, d);
    currentDate = new Date(y, m - 1, 1);
    loadDiaryEntry();
    renderCalendar();
    highlightSelectedDiaryInList();
};

function highlightSelectedDiaryInList() {
    renderDiaryList(searchBar.value);
}

// --- Events ---
diaryPhoto.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        currentPhotoBase64 = await resizeImage(file);
        photoPreview.src = currentPhotoBase64;
        photoPreview.classList.remove('hidden');
        photoPlaceholder.classList.add('hidden');
        removePhotoBtn.classList.remove('hidden');
    }
});

removePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentPhotoBase64 = '';
    photoPreview.src = '';
    photoPreview.classList.add('hidden');
    photoPlaceholder.classList.remove('hidden');
    removePhotoBtn.classList.add('hidden');
    diaryPhoto.value = '';
});

exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(diaries, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `puri-diary-${formatDateKey(new Date())}.json`);
    dlAnchorElem.click();
    showToast("おもいでを保存したよ！✨");
});

importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsedData = JSON.parse(event.target.result);
            if (confirm("おもいでを上書きしちゃうけどいい？")) {
                diaries = parsedData;
                localStorage.setItem('diaries_app_data', JSON.stringify(diaries));
                showToast("読みこみせいこう！✨");
                renderCalendar(); loadDiaryEntry(); renderDiaryList();
            }
        } catch (err) { showToast("こわれたファイルかも...😢", true); }
    };
    reader.readAsText(file);
});

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    sunIcon.classList.toggle('hidden', !isDark);
    moonIcon.classList.toggle('hidden', isDark);
});

bgmToggle.addEventListener('click', () => {
    if (bgmAudio.paused) {
        bgmAudio.play();
        musicIcon.classList.add('hidden');
        muteIcon.classList.remove('hidden');
        showToast("BGMをながしたよ🎶");
    } else {
        bgmAudio.pause();
        musicIcon.classList.remove('hidden');
        muteIcon.classList.add('hidden');
        showToast("BGMをとめたよ");
    }
});

prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

todayBtn.addEventListener('click', () => {
    currentDate = new Date(); selectedDate = new Date();
    renderCalendar(); loadDiaryEntry(); highlightSelectedDiaryInList();
    showToast("今日にかえってきたよ！✨");
});

searchBar.addEventListener('input', (e) => renderDiaryList(e.target.value));

document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-mood');
        if (selectedMood === selected) {
            selectedMood = '';
            btn.classList.remove('active');
        } else {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            selectedMood = selected;
            btn.classList.add('active');
        }
    });
});

document.querySelectorAll('.stamp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-stamp');
        document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('active'));
        selectedStamp = selected;
        btn.classList.add('active');
    });
});

saveBtn.addEventListener('click', saveDiary);
deleteBtn.addEventListener('click', deleteDiary);

window.onload = function() {
    lucide.createIcons();
    const isDark = localStorage.getItem('theme') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    sunIcon.classList.toggle('hidden', !isDark);
    moonIcon.classList.toggle('hidden', isDark);
    renderCalendar(); loadDiaryEntry(); renderDiaryList();
}
