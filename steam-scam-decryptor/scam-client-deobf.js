// This code handles encryption and decryption, fingerprinting, and making a login request

// Function to shift characters in a string by a specified amount
function shiftStringCharacters(input, shiftAmount) {
  let shiftedString = "";
  for (let i = 0; i < input.length; i++) {
    shiftedString += String.fromCharCode(input.charCodeAt(i) + shiftAmount);
  }
  return shiftedString;
}

// Function to decrypt data
function decryptData(encryptedData, timeOffset = 0) {
  // Check if the data is recent (within 15 seconds)
  if (Math.abs(Date.now() - encryptedData.time - timeOffset) > 15000) {
    console.log(Date.now(), encryptedData.time, timeOffset);
    throw new Error("Data is corrupted or has been tampered with");
  }

  // Function to remove the shift indicator from the string
  function removeShiftIndicator(input) {
    const midpoint = Math.ceil(input.length / 2 - 1);
    const offset = input.length % 2 === 0 ? 2 : 1;
    return input.slice(0, midpoint) + input.slice(midpoint + offset);
  }

  // Function to convert a hex string to a regular string
  function hexToString(hex) {
    return hex.match(/.{2}/g).map((char) => {
      return String.fromCharCode(parseInt(char, 16));
    }).join("");
  }

  // Decrypt the data
  const encryptedString = removeShiftIndicator(encryptedData.encrypted);
  const shiftAmount = -1 * Number(encryptedData.encrypted.substr(Math.ceil(encryptedData.encrypted.length / 2 - 1), encryptedData.encrypted.length % 2 === 0 ? 2 : 1));
  const decryptedString = decodeURIComponent(shiftStringCharacters(hexToString(encryptedString), shiftAmount));
  const decryptedData = JSON.parse(decryptedString);
  decryptedData.time = decryptedData.time - timeOffset;

  return decryptedData;
}

// Function to encrypt data
function encryptData(data, shiftAmount, timeOffset = 0) {
  const currentTime = Date.now() - timeOffset;
  data.time = currentTime;

  // Function to convert a string to a hex string
  function stringToHex(str) {
    return str.split("").map((char) => {
      return char.charCodeAt(0).toString(16).padStart(2, "0");
    }).join("");
  }

  // Encrypt the data
  const jsonString = encodeURIComponent(JSON.stringify(data));
  const encryptedString = shiftStringCharacters(jsonString, shiftAmount);
  const encryptedHex = stringToHex(encryptedString);
  const midpoint = Math.ceil(encryptedHex.length / 2);
  const shiftIndicator = encryptedHex.slice(0, midpoint) + shiftAmount + encryptedHex.slice(midpoint);

  return { encrypted: shiftIndicator, time: currentTime };
}

// Function to collect browser fingerprint data
function collectFingerprintData() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    languages: navigator.languages,
    userAgentData: navigator.userAgentData,
    webdriver: navigator.webdriver
  };
}

// Utility functions
function getType(value) {
  return typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? typeof value
    : value && typeof Symbol === "function" && value.constructor === Symbol && value !== Symbol.prototype
    ? "symbol"
    : typeof value;
}

function assignProperties(target, ...sources) {
  for (const source of sources) {
    const keys = Object.keys(source);
    if (Object.getOwnPropertySymbols) {
      const symbols = Object.getOwnPropertySymbols(source);
      const enumerableSymbols = symbols.filter((sym) => Object.getOwnPropertyDescriptor(source, sym).enumerable);
      keys.push(...enumerableSymbols);
    }
    for (const key of keys) {
      const value = source[key];
      if (getType(value) === "symbol") {
        Object.defineProperty(target, key, {
          value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        target[key] = value;
      }
    }
  }
  return target;
}

const randomShiftAmount = Math.floor(99 * Math.random());

// Function to handle login requests
function loginRequest(endpoint, requestData, additionalData = {}) {
  if (endpoint !== "") {
    let storedData = {};
    try {
      storedData = assignProperties(
        {},
        JSON.parse(localStorage.getItem('login')),
        JSON.parse(localStorage.getItem('site'))
      );
    } catch (error) {
      console.error("Error parsing local storage data:", error);
    }

    const timeOffset = Number(localStorage.getItem('time_offset')) || 0;
    const state = encryptData(assignProperties({}, additionalData, storedData, { ts: Date.now() }), randomShiftAmount, timeOffset);
    const fingerprint = encryptData(collectFingerprintData(), randomShiftAmount, timeOffset);
    const payload = encryptData(requestData, Math.floor(99 * Math.random()), timeOffset);

    const requestBody = {
      time: Date.now() - timeOffset,
      state,
      fingerprint,
      payload
    };

    return fetch(`/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
      .then((response) => response.json())
      .then((data) => {
        const decryptedData = decryptData(data, timeOffset);
        if (decryptedData.mafile) {
          document.cookie = "mafile=1; max-age=14400"; // 4 hours
        }
        if (decryptedData.done) {
          console.log("Login success");
        }
        console.log(decryptedData);
        return decryptedData;
      });
  }
}
