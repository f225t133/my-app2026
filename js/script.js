// --- State Management ---
let diaries = JSON.parse(localStorage.getItem('diaries_app_data')) || {};
let currentDate = new Date(); // Active viewing month
let selectedDate = new Date(); // Selected date for editing
let selectedMood = '';

const moodMap = {
    happy: { emoji: '😆', text: '快適', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    good: { emoji: '😊', text: '良い', color: 'bg-amber-50 text-amber-700 border-amber-300' },
    neutral: { emoji: '😐', text: '普通', color: 'bg-blue-50 text-blue-700 border-blue-300' },
    tired: { emoji: '🥱', text: 'お疲れ', color: 'bg-purple-50 text-purple-700 border-purple-300' },
    sad: { emoji: '😢', text: 'いまいち', color: 'bg-rose-50 text-rose-700 border-rose-300' }
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

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

// --- Toast notification ---
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    
    // Icon customization
    const icon = toast.querySelector('i');
    if (isError) {
        icon.setAttribute('data-lucide', 'alert-circle');
        icon.className = 'w-5 h-5 text-rose-400';
    } else {
        icon.setAttribute('data-lucide', 'check-circle');
        icon.className = 'w-5 h-5 text-emerald-400';
    }
    lucide.createIcons();

    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
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

// --- Render Calendar ---
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarYearMonth.textContent = `${year}年 ${month + 1}月`;

    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Last day of current month
    const lastDay = new Date(year, month + 1, 0).getDate();

    let daysHTML = "";

    // Empty space for previous month days
    for (let x = firstDayIndex; x > 0; x--) {
        daysHTML += `<div class="p-2 text-stone-300 dark:text-zinc-600 text-sm"></div>`;
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
        const dayDate = new Date(year, month, i);
        const dateKey = formatDateKey(dayDate);
        const hasDiary = diaries[dateKey];
        const isToday = formatDateKey(new Date()) === dateKey;
        const isSelected = formatDateKey(selectedDate) === dateKey;
        
        let dayClasses = "p-2 text-sm rounded-xl transition cursor-pointer relative flex flex-col items-center justify-center h-10 w-full hover:bg-stone-100 dark:hover:bg-zinc-700/50 ";
        
        if (isToday) {
            dayClasses += " font-bold ring-2 ring-stone-400 dark:ring-zinc-500";
        }
        
        if (isSelected) {
            dayClasses += " bg-diary-500 text-white hover:bg-diary-600 shadow-sm";
        } else {
            dayClasses += " text-stone-700 dark:text-zinc-200";
        }

        let dotHTML = "";
        if (hasDiary && !isSelected) {
            const moodEmoji = moodMap[diaries[dateKey].mood]?.emoji || '✍️';
            dotHTML = `<span class="absolute -bottom-1 text-[10px]">${moodEmoji}</span>`;
        } else if (hasDiary && isSelected) {
            dotHTML = `<span class="absolute -bottom-1 text-[10px] opacity-60">•</span>`;
        }

        daysHTML += `
            <button onclick="selectDateByDay(${i})" class="${dayClasses}">
                <span>${i}</span>
                ${dotHTML}
            </button>
        `;
    }

    calendarDays.innerHTML = daysHTML;
}

// --- Set Active Date ---
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

    // Update Header Information
    selectedFullDate.textContent = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;
    selectedDayOfWeek.textContent = dayNames[selectedDate.getDay()];

    // Clear Mood Selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('ring-4', 'ring-diary-300', 'bg-diary-50', 'border-diary-400', 'dark:bg-zinc-700');
    });
    selectedMood = '';

    if (entry) {
        // Populate Existing Entry
        diaryTitle.value = entry.title || '';
        diaryContent.value = entry.content || '';
        selectedMood = entry.mood || '';
        
        if (selectedMood) {
            const activeBtn = document.querySelector(`[data-mood="${selectedMood}"]`);
            if (activeBtn) {
                activeBtn.classList.add('ring-4', 'ring-diary-300', 'bg-diary-50', 'border-diary-400', 'dark:bg-zinc-700');
            }
        }
        
        deleteBtn.classList.remove('hidden');
        editorViewTitle.textContent = "日記を編集";
    } else {
        // Set Up for New Entry
        diaryTitle.value = '';
        diaryContent.value = '';
        deleteBtn.classList.add('hidden');
        editorViewTitle.textContent = "今日の日記を書く";
    }
}

// --- Save Diary Entry ---
function saveDiary() {
    const dateKey = formatDateKey(selectedDate);
    const title = diaryTitle.value.trim();
    const content = diaryContent.value.trim();

    if (!title && !content && !selectedMood) {
        showToast("何か内容を入力するか、気分を選択してください", true);
        return;
    }

    diaries[dateKey] = {
        title: title || "無題の日記",
        content: content,
        mood: selectedMood,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('diaries_app_data', JSON.stringify(diaries));
    showToast("日記を安全に保存しました！");
    
    loadDiaryEntry();
    renderCalendar();
    renderDiaryList();
}

// --- Delete Diary Entry ---
function deleteDiary() {
    const dateKey = formatDateKey(selectedDate);
    if (diaries[dateKey]) {
        if (confirm("この記事を削除してもよろしいですか？（この操作は取り消せません）")) {
            delete diaries[dateKey];
            localStorage.setItem('diaries_app_data', JSON.stringify(diaries));
            showToast("日記を削除しました");
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
        
        // Search filter check
        if (filterQuery) {
            const query = filterQuery.toLowerCase();
            const titleMatch = entry.title.toLowerCase().includes(query);
            const contentMatch = entry.content.toLowerCase().includes(query);
            const dateMatch = key.includes(query);
            if (!titleMatch && !contentMatch && !dateMatch) return;
        }

        matchCount++;
        const isSelected = formatDateKey(selectedDate) === key;
        const moodInfo = moodMap[entry.mood];
        const displayMood = moodInfo ? moodInfo.emoji : '✍️';
        const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 (${dayNames[dateObj.getDay()].replace('曜日', '')})`;

        listHTML += `
            <div onclick="selectDateByKey('${key}')" data-key="${key}" class="diary-list-item p-3.5 rounded-2xl cursor-pointer transition flex justify-between items-start border ${
                isSelected 
                ? 'bg-diary-50 dark:bg-zinc-700/40 border-diary-200 dark:border-zinc-700 ring-1 ring-diary-200 dark:ring-zinc-700' 
                : 'bg-stone-50 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800/80 hover:bg-stone-100 dark:hover:bg-zinc-800'
            }">
                <div class="flex-1 min-w-0 pr-2">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-semibold text-stone-400 dark:text-zinc-500">${key.replace(/-/g, '/')}</span>
                        <span class="text-[10px] bg-stone-200/50 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 px-1.5 py-0.2 rounded">${formattedDate}</span>
                    </div>
                    <h4 class="font-bold text-sm truncate text-stone-800 dark:text-stone-100">${entry.title || '無題'}</h4>
                    <p class="text-xs text-stone-500 dark:text-zinc-400 truncate mt-1">${entry.content || '本文なし'}</p>
                </div>
                <div class="text-xl bg-white dark:bg-zinc-800 p-2 shadow-sm rounded-xl flex items-center justify-center">
                    ${displayMood}
                </div>
            </div>
        `;
    });

    diaryCount.textContent = `${matchCount}件`;

    if (matchCount === 0) {
        diaryList.innerHTML = `
            <div class="text-center text-stone-400 dark:text-zinc-500 py-12 text-sm flex flex-col items-center justify-center gap-2">
                <i data-lucide="inbox" class="w-8 h-8 opacity-40"></i>
                <span>該当する日記が見つかりません</span>
            </div>
        `;
    } else {
        diaryList.innerHTML = listHTML;
    }
    lucide.createIcons();
}

// --- Select Date by History List Click ---
window.selectDateByKey = function(key) {
    const dateParts = key.split('-');
    selectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    currentDate = new Date(dateParts[0], dateParts[1] - 1, 1); // Align calendar month
    
    loadDiaryEntry();
    renderCalendar();
    highlightSelectedDiaryInList();
};

function highlightSelectedDiaryInList() {
    const items = document.querySelectorAll('.diary-list-item');
    const targetKey = formatDateKey(selectedDate);
    
    items.forEach(item => {
        const key = item.getAttribute('data-key');
        if (key === targetKey) {
            item.className = "diary-list-item p-3.5 rounded-2xl cursor-pointer transition flex justify-between items-start border bg-diary-50 dark:bg-zinc-700/40 border-diary-200 dark:border-zinc-700 ring-1 ring-diary-200 dark:ring-zinc-700";
        } else {
            item.className = "diary-list-item p-3.5 rounded-2xl cursor-pointer transition flex justify-between items-start border bg-stone-50 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800/80 hover:bg-stone-100 dark:hover:bg-zinc-800";
        }
    });
}

// --- Backup Data Export ---
exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(diaries, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `my-diary-backup-${formatDateKey(new Date())}.json`);
    dlAnchorElem.click();
    showToast("日記データをエクスポートしました");
});

// --- Backup Data Import ---
importBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsedData = JSON.parse(event.target.result);
            if (typeof parsedData === 'object' && parsedData !== null) {
                if (confirm("日記データを上書きインポートしますか？（現在のすべてのデータと置き換わります）")) {
                    diaries = parsedData;
                    localStorage.setItem('diaries_app_data', JSON.stringify(diaries));
                    showToast("インポートに成功しました！");
                    
                    // Reload UI
                    renderCalendar();
                    loadDiaryEntry();
                    renderDiaryList();
                }
            } else {
                showToast("不正なファイル形式です", true);
            }
        } catch (err) {
            showToast("ファイルの解析に失敗しました", true);
        }
    };
    reader.readAsText(file);
});

// --- Theme Toggle Control ---
function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
}

themeToggle.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
});

// --- Event Listeners Setup ---

// Month navigation
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// Today button
if (todayBtn) {
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        selectedDate = new Date();
        renderCalendar();
        loadDiaryEntry();
        highlightSelectedDiaryInList();
        showToast("今日にジャンプしました");
    });
}

// Search action
searchBar.addEventListener('input', (e) => {
    renderDiaryList(e.target.value);
});

// Mood buttons
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => {
            b.classList.remove('ring-4', 'ring-diary-300', 'bg-diary-50', 'border-diary-400', 'dark:bg-zinc-700');
        });
        
        const selected = btn.getAttribute('data-mood');
        if (selectedMood === selected) {
            selectedMood = ''; // Deselect
        } else {
            selectedMood = selected;
            btn.classList.add('ring-4', 'ring-diary-300', 'bg-diary-50', 'border-diary-400', 'dark:bg-zinc-700');
        }
    });
});

// Save & Delete triggers
saveBtn.addEventListener('click', saveDiary);
deleteBtn.addEventListener('click', deleteDiary);

// --- App Initialization ---
window.onload = function() {
    lucide.createIcons();
    initTheme();
    renderCalendar();
    loadDiaryEntry();
    renderDiaryList();
}
