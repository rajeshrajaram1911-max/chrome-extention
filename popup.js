const passwordText = document.getElementById('passwordText');
const copyBtn = document.getElementById('copyBtn');
const refreshBtn = document.getElementById('refreshBtn');
const generateBtn = document.getElementById('generateBtn');
const themeToggle = document.getElementById('themeToggle');
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');
const optUpper = document.getElementById('optUpper');
const optLower = document.getElementById('optLower');
const optNumbers = document.getElementById('optNumbers');
const optSymbols = document.getElementById('optSymbols');
const optExclude = document.getElementById('optExclude');
const strengthLabel = document.getElementById('strengthLabel');
const strengthSection = document.querySelector('.strength-section');
const strengthBars = document.querySelectorAll('.strength-bar');
const reqLength = document.getElementById('reqLength');
const reqUpper = document.getElementById('reqUpper');
const reqLower = document.getElementById('reqLower');
const reqNumber = document.getElementById('reqNumber');
const reqSymbol = document.getElementById('reqSymbol');
const toast = document.getElementById('toast');

const THEME_KEY = 'theme';
const SETTINGS_KEY = 'generatorSettings';
let toastTimeout = null;
let currentPassword = '';

const storage = (() => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      async get(keys) {
        return chrome.storage.local.get(keys);
      },
      async set(items) {
        return chrome.storage.local.set(items);
      }
    };
  }
  return {
    async get(keys) {
      const result = {};
      if (typeof keys === 'string') {
        const raw = localStorage.getItem(keys);
        result[keys] = raw ? JSON.parse(raw) : undefined;
      } else if (Array.isArray(keys)) {
        keys.forEach(k => {
          const raw = localStorage.getItem(k);
          result[k] = raw ? JSON.parse(raw) : undefined;
        });
      } else if (keys && typeof keys === 'object') {
        Object.keys(keys).forEach(k => {
          const raw = localStorage.getItem(k);
          result[k] = raw ? JSON.parse(raw) : undefined;
        });
      }
      return result;
    },
    async set(items) {
      Object.keys(items).forEach(k => {
        localStorage.setItem(k, JSON.stringify(items[k]));
      });
    }
  };
})();

document.addEventListener('DOMContentLoaded', async () => {
  await loadTheme();
  await loadSettings();
  generatePassword();
});

async function loadTheme() {
  const { [THEME_KEY]: savedTheme } = await storage.get(THEME_KEY);
  const theme = savedTheme || 'dark';
  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(`theme-${theme}`);
}

themeToggle.addEventListener('click', async () => {
  const isDark = document.body.classList.contains('theme-dark');
  const newTheme = isDark ? 'light' : 'dark';
  document.body.classList.remove('theme-dark', 'theme-light');
  document.body.classList.add(`theme-${newTheme}`);
  await storage.set({ [THEME_KEY]: newTheme });
});

async function loadSettings() {
  const { [SETTINGS_KEY]: settings } = await storage.get(SETTINGS_KEY);
  if (settings) {
    if (settings.length) {
      lengthSlider.value = settings.length;
      lengthValue.textContent = settings.length;
    }
    if (settings.upper !== undefined) optUpper.checked = settings.upper;
    if (settings.lower !== undefined) optLower.checked = settings.lower;
    if (settings.numbers !== undefined) optNumbers.checked = settings.numbers;
    if (settings.symbols !== undefined) optSymbols.checked = settings.symbols;
    if (settings.exclude !== undefined) optExclude.checked = settings.exclude;
  }
}

async function saveSettings() {
  await storage.set({
    [SETTINGS_KEY]: {
      length: parseInt(lengthSlider.value),
      upper: optUpper.checked,
      lower: optLower.checked,
      numbers: optNumbers.checked,
      symbols: optSymbols.checked,
      exclude: optExclude.checked
    }
  });
}

function generatePassword() {
  const length = parseInt(lengthSlider.value);
  const includeUpper = optUpper.checked;
  const includeLower = optLower.checked;
  const includeNumbers = optNumbers.checked;
  const includeSymbols = optSymbols.checked;
  const excludeAmbiguous = optExclude.checked;

  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let numberChars = '0123456789';
  let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (excludeAmbiguous) {
    upperChars = upperChars.replace(/[IO]/g, '');
    lowerChars = lowerChars.replace(/[l]/g, '');
    numberChars = numberChars.replace(/[01]/g, '');
  }

  const selectedSets = [];
  if (includeUpper) selectedSets.push(upperChars);
  if (includeLower) selectedSets.push(lowerChars);
  if (includeNumbers) selectedSets.push(numberChars);
  if (includeSymbols) selectedSets.push(symbolChars);

  if (selectedSets.length === 0) {
    showToast('Select at least one character type', 'error');
    return;
  }

  const allChars = selectedSets.join('');
  let password = '';

  selectedSets.forEach(set => {
    password += set[Math.floor(Math.random() * set.length)];
  });

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  currentPassword = chars.join('');
  displayPassword(currentPassword);
  updateStrength(currentPassword);
  updateRequirements(currentPassword);
}

function displayPassword(password) {
  passwordText.textContent = password;
  passwordText.classList.remove('placeholder');
  copyBtn.classList.remove('copied');
}

function updateStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let level = 1;
  if (score >= 3) level = 2;
  if (score >= 4) level = 3;
  if (score >= 5) level = 4;

  const labels = ['', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  const labelClasses = ['', 'weak', 'medium', 'strong', 'strong'];

  strengthLabel.textContent = labels[level];
  strengthLabel.className = `strength-label ${labelClasses[level]}`;
  strengthSection.dataset.level = level;

  strengthBars.forEach((bar, i) => {
    bar.classList.toggle('active', i < level);
  });
}

function updateRequirements(password) {
  reqLength.classList.toggle('met', password.length >= 8);
  reqUpper.classList.toggle('met', /[A-Z]/.test(password));
  reqLower.classList.toggle('met', /[a-z]/.test(password));
  reqNumber.classList.toggle('met', /\d/.test(password));
  reqSymbol.classList.toggle('met', /[^A-Za-z0-9]/.test(password));
}

copyBtn.addEventListener('click', async () => {
  if (!currentPassword) return;

  try {
    await navigator.clipboard.writeText(currentPassword);
    copyBtn.classList.add('copied');
    showToast('Password copied to clipboard!');

    setTimeout(() => {
      copyBtn.classList.remove('copied');
    }, 1500);
  } catch (error) {
    console.error('Copy failed:', error);
    showToast('Copy failed', 'error');
  }
});

generateBtn.addEventListener('click', generatePassword);
refreshBtn.addEventListener('click', generatePassword);

lengthSlider.addEventListener('input', () => {
  lengthValue.textContent = lengthSlider.value;
  generatePassword();
  saveSettings();
});

[optUpper, optLower, optNumbers, optSymbols, optExclude].forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    generatePassword();
    saveSettings();
  });
});

function showToast(message, type = 'success') {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toast.textContent = message;
  toast.classList.add('show');

  if (type === 'error') {
    toast.style.background = '#ef4444';
    toast.style.color = '#fff';
  } else {
    toast.style.background = '';
    toast.style.color = '';
  }

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    toastTimeout = null;
  }, 2000);
}