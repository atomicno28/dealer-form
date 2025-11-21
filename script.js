const addImageBtn = document.getElementById("addImageBtn");
const cameraBtn = document.getElementById("cameraBtn");

const galleryInput = document.getElementById("galleryInput");
const cameraInput = document.getElementById("cameraInput");

const imageList = document.getElementById("imageList");
const dropZone = document.getElementById("dropZone");
const generatePdfBtn = document.getElementById("generatePdfBtn");
const errorMsg = document.getElementById("errorMsg");

let images = [];

/************************************
 * IMAGE COMPRESSION
 ************************************/
async function compressImage(base64, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
  });
}

/************************************
 * CAMERA
 ************************************/
cameraBtn.onclick = () => cameraInput.click();

/************************************
 * GALLERY
 ************************************/
addImageBtn.onclick = () => galleryInput.click();
dropZone.onclick = () => galleryInput.click();

galleryInput.onchange = (e) => handleFiles(e.target.files);
cameraInput.onchange = (e) => handleFiles(e.target.files);

/************************************
 * DRAG DROP
 ************************************/
dropZone.ondragover = (e) => e.preventDefault();

dropZone.ondrop = (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
};

/************************************
 * HANDLE FILES + COMPRESS
 ************************************/
function handleFiles(files) {
  [...files].forEach((file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const compressed = await compressImage(event.target.result);
      images.push(compressed);
      renderImages();
    };
    reader.readAsDataURL(file);
  });
}

/************************************
 * RENDER IMAGES
 ************************************/
function renderImages() {
  imageList.innerHTML = "";

  images.forEach((src, index) => {
    const box = document.createElement("div");
    box.className = "img-box";

    const img = document.createElement("img");
    img.src = src;

    const del = document.createElement("div");
    del.className = "remove-btn";
    del.textContent = "×";
    del.onclick = () => {
      images.splice(index, 1);
      renderImages();
    };

    box.appendChild(img);
    box.appendChild(del);
    imageList.appendChild(box);
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
 * FILE NAME
 ************************************/
function getPdfFileName() {
  const parts = partsName.value.trim();
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const mon = String(now.getMonth() + 1).padStart(2, "0");
  const yr = now.getFullYear();

  let hr = now.getHours();
  let min = String(now.getMinutes()).padStart(2, "0");

  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  hr = String(hr).padStart(2, "0");

  return `${parts}_${day}_${mon}_${yr}_${hr}_${min}_${ampm}.pdf`;
}

/************************************
 * PDF EXPORT (OPTION B)
 ************************************/
generatePdfBtn.onclick = async () => {
  if (!validate()) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Dealer Report", 75, 15);

  pdf.setFontSize(12);
  pdf.text("Exported On:", 10, 28);
  pdf.setFont("Helvetica", "normal");
  pdf.text(new Date().toLocaleString("en-GB"), 40, 28);

  // Option B Alignment
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
  pdf.setFont("Helvetica", "normal");
  pdf.text(descLines, 40, 60);

  let y = 60 + descLines.length * 6 + 10;

  // Images (2 per row)
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

  pdf.text("Made with ❤️ by Nikhil Patel", 75, 290);

  pdf.save(getPdfFileName());
};
