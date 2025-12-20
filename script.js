const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" +
  "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

const keyInput = document.getElementById("key-input");
const generateBtn = document.getElementById("generate-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const copyBtn = document.getElementById("copy-btn");
const hashOutput = document.getElementById("hash-output");

const sampleKeys = [
  "midnight-signal",
  "copper-lantern",
  "waveform-11",
  "atlas-echo",
  "harbor-lane-7",
];

async function hashKey(input) {
  if (!input) {
    return "";
  }
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-512", data);
  const bytes = new Uint8Array(digest);
  let out = "";
  for (const byte of bytes) {
    out += ALPHABET[byte % ALPHABET.length];
  }
  return out;
}

async function renderHash() {
  const value = keyInput.value.trim();
  if (!value) {
    hashOutput.textContent = "Waiting for input...";
    return;
  }
  hashOutput.textContent = "Generating...";
  try {
    const result = await hashKey(value);
    hashOutput.textContent = result;
  } catch (error) {
    hashOutput.textContent = "Hashing failed. Try again.";
  }
}

function shuffleKey() {
  const pick = sampleKeys[Math.floor(Math.random() * sampleKeys.length)];
  keyInput.value = pick;
  renderHash();
}

async function copyHash() {
  const value = hashOutput.textContent;
  if (!value || value === "Waiting for input..." || value === "Generating...") {
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1200);
  } catch (error) {
    copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1400);
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

generateBtn.addEventListener("click", renderHash);
shuffleBtn.addEventListener("click", shuffleKey);
copyBtn.addEventListener("click", copyHash);

keyInput.addEventListener("input", () => {
  if (keyInput.value.trim().length === 0) {
    hashOutput.textContent = "Waiting for input...";
  }
});
