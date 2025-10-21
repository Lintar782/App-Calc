const historyDisplay = document.getElementById('historyDisplay');
const mainDisplay = document.getElementById('mainDisplay');
const keypad = document.querySelector('.keypad');
const themeToggle = document.querySelector('.theme-toggle');
const historyList = document.getElementById('historyList');
const displayArea = document.querySelector('.display-area');
const clearHistoryBtn = document.getElementById('clearHistoryBtn')

let currentInput = '0';
let history = '';
let shouldResetDisplay = false;
let calculationHistory = JSON.parse(localStorage.getItem('smartCalcHistory')) || [];

// --- UTILITY FUNCTIONS ---

// Update tampilan utama dan riwayat
function updateDisplay() {
    // Batasi panjang tampilan utama
    mainDisplay.textContent = currentInput.length > 15 ? 
        parseFloat(currentInput).toPrecision(10) : currentInput;
    
    // Tampilkan history
    historyDisplay.textContent = history.replace(/\*/g, '×').replace(/\//g, '÷');
}

// Tambahkan hasil perhitungan ke riwayat
function addToHistory(expression, result) {
    calculationHistory.unshift({ expression, result });
    // Batasi riwayat (misalnya 10 entri)
    calculationHistory = calculationHistory.slice(0, 10);
    localStorage.setItem('smartCalcHistory', JSON.stringify(calculationHistory));
    renderHistory();
}

// Render riwayat ke panel
function renderHistory() {
    historyList.innerHTML = '';
    
    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<li class="empty-history-message">Belum ada riwayat.</li>';
        return;
    }

    calculationHistory.forEach((item, index) => {
        const li = document.createElement('li');
        li.classList.add('history-item');
        li.dataset.index = index;
        li.innerHTML = `
            <div class="expression">${item.expression.replace(/\*/g, '×').replace(/\//g, '÷')}</div>
            <div class="result">${item.result}</div>
        `;
        li.addEventListener('click', () => loadFromHistory(index));
        historyList.appendChild(li);
    });
}

// Fungsi menghapus riwayat
function clearHistory() {
    calculationHistory = []
    localStorage.removeItem('smartCalcHistory')
    renderHistory()
}

// Muat hasil dari riwayat
function loadFromHistory(index) {
    const item = calculationHistory[index];
    if (item) {
        currentInput = item.result;
        history = '';
        shouldResetDisplay = true; // Siap untuk input baru atau operator
        updateDisplay();
        // Beri feedback visual
        const historyItem = historyList.querySelector(`[data-index="${index}"]`);
        historyItem.style.backgroundColor = 'var(--color-primary)';
        setTimeout(() => {
            historyItem.style.backgroundColor = 'var(--color-bg-main)';
        }, 300);
    }
}

// Handle Error
function handleError(message) {
    mainDisplay.textContent = message || 'Error';
    displayArea.classList.add('error');
    history = '';
    currentInput = '0';
    shouldResetDisplay = true;

    setTimeout(() => {
        displayArea.classList.remove('error');
        updateDisplay();
    }, 1000);
}

// --- CALCULATION LOGIC ---

// Evaluasi ekspresi menggunakan Function konstruktor (hati-hati, tapi efektif untuk kalkulator)
function evaluateExpression(expression) {
    try {
        // Ganti operator × dan ÷ kembali ke * dan /
        let formula = expression.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Cek ekspresi yang valid (hindari kode berbahaya)
        if (!/^[\d\.\s\+\-\*\/%]+$/.test(formula)) {
            throw new Error('Invalid Expression');
        }

        const result = new Function('return ' + formula)();

        if (!isFinite(result)) {
            throw new Error('Math Error');
        }

        // Format hasil dengan presisi yang wajar
        return parseFloat(result.toFixed(10)).toString();

    } catch (e) {
        return 'Error';
    }
}



// Fungsi utama untuk menangani input tombol
function handleInput(value) {
    // Hapus feedback error jika ada
    displayArea.classList.remove('error');

    if (value === 'AC') {
        currentInput = '0';
        history = '';
        shouldResetDisplay = false;
    } else if (value === 'DEL') {
        if (currentInput === 'Error') {
             currentInput = '0';
        } else {
             currentInput = currentInput.slice(0, -1);
             if (currentInput === '' || currentInput === '-') currentInput = '0';
        }
       
    } else if (['+', '-', '*', '/', '%'].includes(value)) {
        if (shouldResetDisplay) {
            history = currentInput; // Pindahkan hasil ke history
            currentInput = '0'; // Reset current input untuk operator
            shouldResetDisplay = false;
        }

        // Jika history kosong, gunakan currentInput sebagai awal
        if (history === '') {
            history = currentInput;
        } else {
            // Ganti operator terakhir jika operator baru ditekan
            const lastChar = history.slice(-1);
            if (['+', '-', '*', '/', '%'].includes(lastChar)) {
                history = history.slice(0, -1);
            }
        }
        
        // Tambahkan operator baru ke history
        history += value; 
        currentInput = '0'; // Reset input siap untuk angka berikutnya
        
    } else if (value === '=') {
        if (history === '') return; // Tidak ada perhitungan untuk dilakukan

        // Tambahkan current input ke ekspresi penuh
        const fullExpression = history + currentInput;
        const result = evaluateExpression(fullExpression);

        if (result === 'Error') {
            handleError('Math Error');
            return;
        }

        // Simpan ke riwayat
        addToHistory(fullExpression, result);

        // Update tampilan
        history = fullExpression;
        currentInput = result;
        shouldResetDisplay = true; // Setelah "=", siap untuk input angka/operator baru
        
        // Efek Pulse "="
        const equalsBtn = document.querySelector('.btn-equals');
        equalsBtn.classList.add('pulsing');
        setTimeout(() => equalsBtn.classList.remove('pulsing'), 800);

    } else { // Angka atau Titik Desimal
        if (currentInput === '0' || shouldResetDisplay) {
            currentInput = value === '.' ? '0.' : value;
            shouldResetDisplay = false;
        } else if (value === '.') {
            if (!currentInput.includes('.')) {
                currentInput += value;
            }
        } else {
            currentInput += value;
        }
    }

    updateDisplay();
}

// --- THEME TOGGLE (Light/Dark Mode) ---

function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}


// --- EVENT LISTENERS & INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    renderHistory();
    updateDisplay();
});

clearHistoryBtn.addEventListener('click', clearHistory)

// Button Clicks
keypad.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn')) {
        handleInput(e.target.dataset.value);
    }
});

// Theme Toggle
themeToggle.addEventListener('click', toggleTheme);

// Keyboard Support
document.addEventListener('keydown', (e) => {
    let key = e.key;

    // Normalisasi input keyboard
    if (key === 'Enter') key = '=';
    if (key === 'Backspace') key = 'DEL';
    if (key === 'Delete') key = 'AC';
    if (key === ',') key = '.';

    const validKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', '%', '=', 'DEL', 'AC'];

    if (validKeys.includes(key)) {
        e.preventDefault(); // Mencegah aksi default browser (misal: Enter)
        
        // Temukan dan simulasikan klik tombol untuk feedback visual
        let btn = document.querySelector(`.btn[data-value="${key.replace('*', '\\*').replace('/', '\\/')}"]`);
        if (!btn && key === 'AC') { // Cek untuk AC (jika DEL dipetakan ke AC)
             btn = document.querySelector(`.btn[data-value="AC"]`);
        }
        
        if (btn) {
            btn.focus();
            btn.classList.add('active-key-feedback'); // Tambahkan kelas untuk feedback visual
            setTimeout(() => btn.classList.remove('active-key-feedback'), 150);
        }

        handleInput(key);
    }
});