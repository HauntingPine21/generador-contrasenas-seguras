const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{};:,.?"
};

const COMMON_PATTERNS = [
  "password", "contraseña", "123456", "qwerty", "admin", "abc123", "letmein"
];

const passwordInput = document.getElementById("password");
const lengthRange = document.getElementById("lengthRange");
const lengthValue = document.getElementById("lengthValue");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const togglePasswordBtn = document.getElementById("togglePassword");
const strengthLabel = document.getElementById("strengthLabel");
const strengthBar = document.getElementById("strengthBar");
const reasonsList = document.getElementById("reasonsList");
const statusMessage = document.getElementById("statusMessage");

const optionInputs = {
  lowercase: document.getElementById("lowercase"),
  uppercase: document.getElementById("uppercase"),
  numbers: document.getElementById("numbers"),
  symbols: document.getElementById("symbols")
};

function secureRandomInt(max) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("El máximo debe ser un entero positivo.");
  }

  const maxUint = 0x100000000;
  const limit = maxUint - (maxUint % max);
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

function randomChar(charset) {
  return charset[secureRandomInt(charset.length)];
}

function shuffleSecure(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getSelectedCharsets() {
  return Object.entries(optionInputs)
    .filter(([, input]) => input.checked)
    .map(([key]) => CHARSETS[key]);
}

function generatePassword() {
  const selected = getSelectedCharsets();

  if (selected.length === 0) {
    optionInputs.lowercase.checked = true;
    statusMessage.textContent = "Debe existir al menos un tipo de carácter seleccionado.";
    return generatePassword();
  }

  const requestedLength = Number(lengthRange.value);
  const length = Math.max(requestedLength, selected.length);
  const allCharacters = selected.join("");
  const result = [];

  selected.forEach(charset => result.push(randomChar(charset)));

  while (result.length < length) {
    result.push(randomChar(allCharacters));
  }

  const password = shuffleSecure(result).join("");
  passwordInput.value = password;
  statusMessage.textContent = "";
  evaluateStrength(password);
}

function evaluateStrength(password) {
  let score = 0;

  if (password.length >= 12) score += 2;
  if (password.length >= 16) score += 2;
  if (password.length >= 20) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const lower = password.toLowerCase();
  if (COMMON_PATTERNS.some(pattern => lower.includes(pattern))) score -= 3;
  if (/(.)\1{2,}/.test(password)) score -= 1;
  if (/1234|abcd|qwer/i.test(password)) score -= 2;

  const normalizedScore = Math.max(0, score);
  let label;
  let width;
  let color;

  if (normalizedScore <= 3) {
    label = "Débil";
    width = 25;
    color = "var(--danger)";
  } else if (normalizedScore <= 5) {
    label = "Media";
    width = 50;
    color = "var(--warning)";
  } else if (normalizedScore <= 7) {
    label = "Fuerte";
    width = 75;
    color = "#6fdc95";
  } else {
    label = "Muy fuerte";
    width = 100;
    color = "var(--accent)";
  }

  strengthLabel.textContent = label;
  strengthBar.style.width = `${width}%`;
  strengthBar.style.background = color;
  updateReasons(password);
}

function updateReasons(password) {
  const checks = [
    [password.length >= 12, `Tiene ${password.length} caracteres (mínimo recomendado: 12).`],
    [/[a-z]/.test(password), "Incluye letras minúsculas."],
    [/[A-Z]/.test(password), "Incluye letras mayúsculas."],
    [/\d/.test(password), "Incluye números."],
    [/[^A-Za-z0-9]/.test(password), "Incluye símbolos."],
    [!COMMON_PATTERNS.some(pattern => password.toLowerCase().includes(pattern)), "No contiene contraseñas comunes detectadas."]
  ];

  reasonsList.innerHTML = "";
  checks.filter(([ok]) => ok).forEach(([, text]) => {
    const li = document.createElement("li");
    li.textContent = text;
    reasonsList.appendChild(li);
  });
}

async function copyPassword() {
  if (!passwordInput.value) return;

  try {
    await navigator.clipboard.writeText(passwordInput.value);
    statusMessage.textContent = "Contraseña copiada al portapapeles.";
  } catch {
    passwordInput.select();
    document.execCommand("copy");
    statusMessage.textContent = "Contraseña copiada al portapapeles.";
  }
}

function togglePasswordVisibility() {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePasswordBtn.textContent = isHidden ? "Ocultar" : "Mostrar";
  togglePasswordBtn.setAttribute("aria-label", isHidden ? "Ocultar contraseña" : "Mostrar contraseña");
}

lengthRange.addEventListener("input", () => {
  lengthValue.textContent = lengthRange.value;
  generatePassword();
});

generateBtn.addEventListener("click", generatePassword);
copyBtn.addEventListener("click", copyPassword);
togglePasswordBtn.addEventListener("click", togglePasswordVisibility);

Object.values(optionInputs).forEach(input => {
  input.addEventListener("change", () => {
    if (!Object.values(optionInputs).some(item => item.checked)) {
      input.checked = true;
      statusMessage.textContent = "Debe permanecer seleccionada al menos una opción.";
      return;
    }
    generatePassword();
  });
});

generatePassword();