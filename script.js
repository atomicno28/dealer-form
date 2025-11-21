const addImageBtn = document.getElementById("addImageBtn");
const imageInput = document.getElementById("imageInput");
const imageList = document.getElementById("imageList");
const dropZone = document.getElementById("dropZone");
const generatePdfBtn = document.getElementById("generatePdfBtn");
const errorMsg = document.getElementById("errorMsg");

let images = [];

/************************************
 * IMAGE UPLOAD (CLICK + DRAG-DROP)
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

function handleFiles(files) {
  [...files].forEach((file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      images.push(event.target.result);
      renderImages();
    };
    reader.readAsDataURL(file);
  });
}

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
 * VALIDATION — TRUE/FALSE ONLY
 ************************************/
function validate() {
  errorMsg.textContent = "";

  if (!dealerName.value.trim()) {
    errorMsg.textContent = "Please add dealer name";
    return false;
  }

  if (!partsName.value.trim()) {
    errorMsg.textContent = "Please add parts name";
    return false;
  }

  if (!description.value.trim()) {
    errorMsg.textContent = "Please add description";
    return false;
  }

  if (images.length === 0) {
    errorMsg.textContent = "Please upload at least 1 image";
    return false;
  }

  return true;
}

/************************************
 * PDF FILENAME FORMAT
 * PartsName_DD_MM_YYYY_HH_MM_AM.pdf
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
  hours = hours % 12;
  hours = hours ? hours : 12;
  hours = String(hours).padStart(2, "0");

  return `${parts}_${day}_${month}_${year}_${hours}_${minutes}_${ampm}.pdf`;
}

/************************************
 * PDF EXPORT (Option-B Alignment)
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

  /***********************
   * OPTION-B ALIGNMENT
   ***********************/
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

  pdf.setFont("Helvetica", "normal");
  const descX = 40;
  const descY = 60;

  let descValue = description.value.trim();
  let descLines = pdf.splitTextToSize(descValue, 160);

  pdf.text(descLines, descX, descY);

  let y = descY + descLines.length * 6 + 10;

  /************************************
   * IMAGES 2 PER ROW
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

  // Footer
  pdf.text("Made with Love by Nikhil Patel", 75, 290);

  // SAVE WITH FORMATTED NAME
  pdf.save(getPdfFileName());
};

