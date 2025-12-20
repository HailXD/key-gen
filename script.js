const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" +
  "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const OUTPUT_LENGTH = 64;

const keyInput = document.getElementById("key-input");
const hashSelect = document.getElementById("hash-select");
const augmentToggle = document.getElementById("augment-toggle");
const augmentMenu = document.getElementById("augment-menu");
const augmentList = document.getElementById("augment-list");
const shuffleBtn = document.getElementById("shuffle-btn");
const copyBtn = document.getElementById("copy-btn");
const hashOutput = document.getElementById("hash-output");
const augmentedOutput = document.getElementById("augmented-output");
const hashChip = document.getElementById("hash-chip");
const outputLabel = document.getElementById("output-label");

const HASH_TYPES = [
  { id: "sha-512", label: "SHA-512", algorithm: "SHA-512", rounds: 1 },
  { id: "sha-384", label: "SHA-384", algorithm: "SHA-384", rounds: 1 },
  { id: "sha-256", label: "SHA-256", algorithm: "SHA-256", rounds: 1 },
  { id: "sha-1", label: "SHA-1", algorithm: "SHA-1", rounds: 1 },
  { id: "sha-512x2", label: "SHA-512 x2", algorithm: "SHA-512", rounds: 2 },
  { id: "sha-256x2", label: "SHA-256 x2", algorithm: "SHA-256", rounds: 2 },
];

const AUGMENTATIONS = [
  { id: "none", label: "None (disable)", transform: (value) => value },
  { id: "trim", label: "Trim whitespace", transform: (value) => value.trim() },
  { id: "lower", label: "Lowercase", transform: (value) => value.toLowerCase() },
  { id: "upper", label: "Uppercase", transform: (value) => value.toUpperCase() },
  { id: "swap", label: "Swap case", transform: (value) => swapCase(value) },
  { id: "reverse", label: "Reverse characters", transform: (value) => reverseString(value) },
  {
    id: "reverse-lower",
    label: "Reverse + lowercase",
    transform: (value) => reverseString(value).toLowerCase(),
  },
  {
    id: "reverse-upper",
    label: "Reverse + uppercase",
    transform: (value) => reverseString(value).toUpperCase(),
  },
  { id: "nospace", label: "Remove spaces", transform: (value) => value.replace(/\s+/g, "") },
  {
    id: "kebab",
    label: "Kebab-case",
    transform: (value) => value.trim().replace(/[\s_]+/g, "-").toLowerCase(),
  },
  {
    id: "snake",
    label: "Snake_case",
    transform: (value) => value.trim().replace(/[\s-]+/g, "_").toLowerCase(),
  },
  {
    id: "alnum",
    label: "Alphanumeric only",
    transform: (value) => value.replace(/[^0-9a-zA-Z]+/g, ""),
  },
];

const selectedAugmentations = new Set(["trim"]);

const sampleKeys = [
  "midnight-signal",
  "copper-lantern",
  "waveform-11",
  "atlas-echo",
  "harbor-lane-7",
  "orbit-12",
  "ember-seed",
  "tidal-shift",
];

function populateSelect(select, options, defaultSelection) {
  const defaults = Array.isArray(defaultSelection) ? defaultSelection : [defaultSelection];
  options.forEach((option) => {
    const entry = document.createElement("option");
    entry.value = option.id;
    entry.textContent = option.label;
    if (defaults.includes(option.id)) {
      entry.selected = true;
    }
    select.appendChild(entry);
  });
  if (!select.multiple && defaults.length > 0) {
    select.value = defaults[0];
  }
}

function getHashConfig() {
  return HASH_TYPES.find((option) => option.id === hashSelect.value) || HASH_TYPES[0];
}

function getAugmentations() {
  if (selectedAugmentations.has("none")) {
    return [];
  }
  return AUGMENTATIONS.filter(
    (option) => option.id !== "none" && selectedAugmentations.has(option.id)
  );
}

function reverseString(value) {
  return Array.from(value).reverse().join("");
}

function swapCase(value) {
  return value.replace(/[a-zA-Z]/g, (char) =>
    char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
  );
}

async function hashRounds(data, config) {
  let buffer = data;
  for (let i = 0; i < config.rounds; i += 1) {
    const digest = await crypto.subtle.digest(config.algorithm, buffer);
    buffer = new Uint8Array(digest);
  }
  return buffer;
}

function withCounter(bytes, counter) {
  const combined = new Uint8Array(bytes.length + 4);
  combined.set(bytes, 0);
  combined[bytes.length] = (counter >>> 24) & 0xff;
  combined[bytes.length + 1] = (counter >>> 16) & 0xff;
  combined[bytes.length + 2] = (counter >>> 8) & 0xff;
  combined[bytes.length + 3] = counter & 0xff;
  return combined;
}

async function deriveBytes(input, config, targetLength) {
  const encoder = new TextEncoder();
  let digest = await hashRounds(encoder.encode(input), config);
  const output = new Uint8Array(targetLength);
  let offset = 0;
  let counter = 0;

  while (offset < targetLength) {
    const take = Math.min(digest.length, targetLength - offset);
    output.set(digest.slice(0, take), offset);
    offset += take;
    if (offset < targetLength) {
      counter += 1;
      digest = await hashRounds(withCounter(digest, counter), config);
    }
  }

  return output;
}

function bytesToAlphabet(bytes) {
  let out = "";
  for (const byte of bytes) {
    out += ALPHABET[byte % ALPHABET.length];
  }
  return out;
}

function updateLabels() {
  const hashConfig = getHashConfig();
  hashChip.textContent = hashConfig.label;
  outputLabel.textContent = `64-character output (${hashConfig.label})`;
}

function updateAugmentLabel() {
  const active = AUGMENTATIONS.filter((option) => selectedAugmentations.has(option.id));
  let label = "None (disable)";
  if (active.length > 0) {
    label = active.length === 1 ? active[0].label : `${active[0].label} +${active.length - 1}`;
  }
  augmentToggle.textContent = label;
}

function updateAugmentButtons() {
  augmentList.querySelectorAll(".augment-option").forEach((button) => {
    const id = button.dataset.augmentId;
    button.classList.toggle("is-active", selectedAugmentations.has(id));
  });
  updateAugmentLabel();
}

function toggleAugmentation(id) {
  if (id === "none") {
    selectedAugmentations.clear();
    selectedAugmentations.add("none");
  } else {
    selectedAugmentations.delete("none");
    if (selectedAugmentations.has(id)) {
      selectedAugmentations.delete(id);
    } else {
      selectedAugmentations.add(id);
    }
    if (selectedAugmentations.size === 0) {
      selectedAugmentations.add("none");
    }
  }
  updateAugmentButtons();
}

function renderAugmentMenu() {
  augmentList.innerHTML = "";
  AUGMENTATIONS.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "augment-option";
    button.textContent = option.label;
    button.dataset.augmentId = option.id;
    button.addEventListener("click", () => {
      toggleAugmentation(option.id);
      renderHash();
    });
    augmentList.appendChild(button);
  });
  updateAugmentButtons();
}

function openAugmentMenu() {
  augmentMenu.hidden = false;
  augmentToggle.setAttribute("aria-expanded", "true");
}

function closeAugmentMenu() {
  augmentMenu.hidden = true;
  augmentToggle.setAttribute("aria-expanded", "false");
}

async function renderHash() {
  const rawValue = keyInput.value;
  if (!rawValue.trim()) {
    hashOutput.textContent = "Waiting for input...";
    augmentedOutput.textContent = "Waiting for input...";
    return;
  }
  hashOutput.textContent = "Generating...";
  augmentedOutput.textContent = "Generating...";
  try {
    const hashConfig = getHashConfig();
    const augmentations = getAugmentations();
    const prepared = augmentations.reduce((current, augmentation) => {
      return augmentation.transform(current);
    }, rawValue);
    if (!prepared || !prepared.trim()) {
      hashOutput.textContent = "No usable input after augmentation.";
      augmentedOutput.textContent = "No usable input after augmentation.";
      return;
    }
    augmentedOutput.textContent = prepared;
    const bytes = await deriveBytes(prepared, hashConfig, OUTPUT_LENGTH);
    hashOutput.textContent = bytesToAlphabet(bytes);
  } catch (error) {
    hashOutput.textContent = "Hashing failed. Try again.";
    augmentedOutput.textContent = "Hashing failed. Try again.";
  }
}

function shuffleKey() {
  const pick = sampleKeys[Math.floor(Math.random() * sampleKeys.length)];
  keyInput.value = pick;
  renderHash();
}

async function copyHash() {
  const value = hashOutput.textContent;
  if (
    !value ||
    value === "Waiting for input..." ||
    value === "Generating..." ||
    value === "Hashing failed. Try again." ||
    value === "No usable input after augmentation."
  ) {
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

populateSelect(hashSelect, HASH_TYPES, "sha-512");
updateLabels();
renderAugmentMenu();
closeAugmentMenu();

shuffleBtn.addEventListener("click", shuffleKey);
copyBtn.addEventListener("click", copyHash);

hashSelect.addEventListener("change", () => {
  updateLabels();
  renderHash();
});

augmentToggle.addEventListener("click", (event) => {
  event.preventDefault();
  if (augmentMenu.hidden) {
    openAugmentMenu();
  } else {
    closeAugmentMenu();
  }
});

document.addEventListener("click", (event) => {
  if (augmentMenu.hidden) {
    return;
  }
  if (augmentMenu.contains(event.target) || augmentToggle.contains(event.target)) {
    return;
  }
  closeAugmentMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !augmentMenu.hidden) {
    closeAugmentMenu();
    augmentToggle.focus();
  }
});

keyInput.addEventListener("input", () => {
  renderHash();
});
