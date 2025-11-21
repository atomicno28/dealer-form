const addImageBtn = document.getElementById("addImageBtn");
const cameraBtn = document.getElementById("cameraBtn");
const imageInput = document.getElementById("imageInput");
const imageList = document.getElementById("imageList");
const dropZone = document.getElementById("dropZone");
const generatePdfBtn = document.getElementById("generatePdfBtn");
const errorMsg = document.getElementById("errorMsg");

let images = [];

/************************************
 * IMAGE COMPRESSION FUNCTION
 ************************************/
async function compressImage(base64, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Maintain ratio
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
  });
}

/************************************
 * CAMERA BUTTON — DIRECT CAMERA OPEN
 ************************************/
cameraBtn.onclick = () => {
  const camInput = document.createElement("input");
  camInput.type = "file";
  camInput.accept = "image/*";
  camInput.capture = "environment";

  camInput.onchange = (e) => handleFiles(e.target.files);
  camInput.click();
};

/************************************
 * IMAGE UPLOAD (CLICK + DRAG DROP)
 ************************************/
addImageBtn.onclick = () => imageInput.click();
dropZone.onclick = () => imageInput.click();

imageInput.onchange = (e) => handleFiles(e.target.files);

dropZone.ondragover = (e) => {
  e.preventDefault();
  dropZone.style.background = "#d0e6ff";
};

dropZone.ondragleave = () => {
  dropZone.style.background = "";
};

dropZone.ondrop = (e) => {
  e.preventDefault();
  dropZone.style.background = "";
  handleFiles(e.dataTransfer.files);
};

/************************************
 * HANDLE FILES + COMPRESS
 ************************************/
function handleFiles(files) {
  [...files].forEach((file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      compressImage(event.target.result).then((compressed) => {
        images.push(compressed);
        renderImages();
      });
    };
    reader.readAsDataURL(file);
  });
}

/************************************
 * RENDER IMAGES WITH DELETE BUTTON
 ************************************/
function renderImages() {
  imageList.innerHTML = "";

  images.forEach((src, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "img-box";

    const img = document.createElement("img");
    img.src = src;

    const removeBtn = document.createElement("div");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "×";

    removeBtn.onclick = () => {
      images.splice(index, 1);
      renderImages();
    };

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    imageList.appendChild(wrapper);
  });
}

/************************************
 * VALIDATION
 ************************************/
function validate() {
  errorMsg.textContent = "";

  if (!dealerName.value.trim())
    return (errorMsg.textContent = "Please add dealer name", false);

  if (!partsName.value.trim())
    return (errorMsg.textContent = "Please add parts name", false);

  if (!description.value.trim())
    return (errorMsg.textContent = "Please add description", false);

  if (images.length === 0)
    return (errorMsg.textContent = "Please upload at least 1 image", false);

  return true;
}

/************************************
 * PDF FILE NAME FORMAT
 ************************************/
function getPdfFileName() {
  const parts = partsName.value.trim() || "Report";
  const now = new Date();

  let day = String(now.getDate()).padStart(2, "0");
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let year = now.getFullYear();

  let hours = now.getHours();
  let minutes = String(now.getMinutes()).padStart(2, "0");

  let ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  hours = String(hours).padStart(2, "0");

  return `${parts}_${day}_${month}_${year}_${hours}_${minutes}_${ampm}.pdf`;
}

/************************************
 * EXPORT PDF — Option-B Alignment + Compressed Images
 ************************************/
generatePdfBtn.onclick = async () => {
  if (!validate()) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  // Title
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Dealer Report", 75, 15);

  // Timestamp
  pdf.setFontSize(12);
  pdf.text("Exported On:", 10, 28);
  pdf.setFont("Helvetica", "normal");
  pdf.text(new Date().toLocaleString("en-GB"), 40, 28);

  // Option-B alignment
  pdf.setFont("Helvetica", "bold");
  pdf.text("Dealer:", 10, 40);
  pdf.setFont("Helvetica", "normal");
  pdf.text(dealerName.value, 40, 40);

  pdf.setFont("Helvetica", "bold");
  pdf.text("Parts:", 10, 50);
  pdf.setFont("Helvetica", "normal");
  pdf.text(partsName.value, 40, 50);

  pdf.setFont("Helvetica", "bold");
  pdf.text("Desc:", 10, 60);

  const descLines = pdf.splitTextToSize(description.value.trim(), 160);
  pdf.text(descLines, 40, 60);

  let y = 60 + descLines.length * 6 + 10;

  /************************************
   * ADD COMPRESSED IMAGES TO PDF (2 per row)
   ************************************/
  let col = 0;

  for (let i = 0; i < images.length; i++) {
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }

    const x = col === 0 ? 10 : 110;
    pdf.addImage(images[i], "JPEG", x, y, 90, 70);

    if (col === 1) y += 80;

    col = 1 - col;
  }

  pdf.text("Created by Nikhil Patel", 75, 290);

  pdf.save(getPdfFileName());
};
