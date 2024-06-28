
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
  const decryptedData = (decryptedString);
  decryptedData.time = decryptedData.time - timeOffset;

  return decryptedData;
}

// Main function to run the decryption
function main() {
  const args = process.argv.slice(1);
  if (args.length < 1) {
    console.error("Usage: node decrypt.js <encrypted>");
    process.exit(1);
  }
  const encrypted = args[1];

  try {
    const decryptedData = decryptData({ encrypted: encrypted });
    console.log("Decrypted Data:", decryptedData);
  } catch (error) {
    console.error("Error decrypting data:", error.message);
  }
}

main();
