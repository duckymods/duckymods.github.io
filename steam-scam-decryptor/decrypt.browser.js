// Function to shift characters in a string by a specified amount
function shiftStringCharacters(input, shiftAmount) {
  let shiftedString = "";
  for (let i = 0; i < input.length; i++) {
    shiftedString += String.fromCharCode(input.charCodeAt(i) + shiftAmount);
  }
  return shiftedString;
}

// Function to decrypt data
function decryptData(encryptedData) {
  // Function to remove the shift indicator from the string
  function removeShiftIndicator(input) {
    const midpoint = Math.ceil(input.length / 2 - 1);
    const offset = input.length % 2 === 0 ? 2 : 1;
    return input.slice(0, midpoint) + input.slice(midpoint + offset);
  }

  // Function to convert a hex string to a regular string
  function hexToString(hex) {
    return hex
      .match(/.{2}/g)
      .map((char) => {
        return String.fromCharCode(parseInt(char, 16));
      })
      .join("");
  }

  // Decrypt the data
  const encryptedString = removeShiftIndicator(encryptedData.encrypted);
  const shiftAmount =
    -1 *
    Number(
      encryptedData.encrypted.substr(
        Math.ceil(encryptedData.encrypted.length / 2 - 1),
        encryptedData.encrypted.length % 2 === 0 ? 2 : 1
      )
    );
  const decryptedString = decodeURIComponent(
    shiftStringCharacters(hexToString(encryptedString), shiftAmount)
  );
  const decryptedData = JSON.parse(decryptedString);

  return decryptedData;
}

function syntaxHighlight(json) {
  if (typeof json !== "string") {
    json = JSON.stringify(json, undefined, 2);
  }
  json = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)|(\b(true|false|null)\b)|(-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let cls = "number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "key";
        } else {
          cls = "string";
        }
      } else if (/true|false/.test(match)) {
        cls = "boolean";
      } else if (/null/.test(match)) {
        cls = "null";
      }
      return '<span class="' + cls + '">' + match + "</span>";
    }
  );
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      Notiflix.Notify.success("Copied Successfully!");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
}
let oldData = "{}";
const output = document.getElementById("output");
function decrypt() {
  const encryptedInput = document.getElementById("encryptedInput").value;
  if (!encryptedInput) {
    output.textContent = "Please provide some data!";
    return;
  }

  try {
    const decryptedData = decryptData({
      encrypted: encryptedInput,
    });
    if (oldData !== JSON.stringify(decryptedData)) {
      oldData = JSON.stringify(decryptedData);
      console.log("Refreshed data!", oldData, decryptedData);
      const highlightedData = syntaxHighlight(decryptedData);
      output.innerHTML = highlightedData;
      output.classList.remove("invalid");

      document
        .querySelectorAll(".key, .value, .string, .number, .boolean, .null")
        .forEach((element) => {
          element.onclick = () => copyToClipboard(element.textContent);
        });
    }
  } catch (error) {
    output.textContent = "Invalid data provided.";
    output.classList.add("invalid");
  }
}
setInterval(decrypt, 10);

document.querySelector(".copy-content").addEventListener("click", () => copyToClipboard(output.textContent));
