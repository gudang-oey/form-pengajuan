let formCounter = 1;

document.getElementById("addRow").addEventListener("click", function () {
  var tbody = document.querySelector("#equipmentTable tbody");
  var newRow = tbody.rows[0].cloneNode(true);
  var inputs = newRow.getElementsByTagName("input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].value = "";
  }
  tbody.appendChild(newRow);
});

function removeRow(button) {
  var row = button.closest("tr");
  if (document.querySelectorAll("#equipmentTable tbody tr").length > 1) {
    row.remove();
  } else {
    alert("Anda tidak dapat menghapus baris terakhir.");
  }
}

document
  .getElementById("equipmentTable")
  .addEventListener("input", function (e) {
    if (e.target.name === "quantity[]" || e.target.name === "price[]") {
      var row = e.target.closest("tr");
      var quantity = row.querySelector('input[name="quantity[]"]').value;
      var price = row.querySelector('input[name="price[]"]').value;
      var total = quantity * price;
      row.querySelector('input[name="total[]"]').value = isNaN(total)
        ? ""
        : total.toFixed(2);
    }
  });

document
  .getElementById("generatePDF")
  .addEventListener("click", async function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Fungsi untuk menambahkan background dengan opacity
    const addBackgroundWithOpacity = async () => {
      try {
        const backgroundImage = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = "background.png";
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = backgroundImage.width;
        canvas.height = backgroundImage.height;

        // Atur opacity(tingkat transparan)
        ctx.globalAlpha = 1.0;

        ctx.drawImage(backgroundImage, 0, 0);
        const transparentImageData = canvas.toDataURL("image/png");

        // Mendapatkan ukuran halaman PDF
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Mengatur ukuran logo yang simetris
        const logoSize = 20; // Ukuran logo dalam mm (bisa disesuaikan)

        // Posisi di pojok kanan atas
        // Berikan margin 10mm dari atas dan kanan
        const xPos = pageWidth - logoSize - 14; // 15mm dari kanan
        const yPos = 32; // 10mm dari atas

        // Menambahkan background ke PDF dengan ukuran yang simetris
        doc.addImage(
          transparentImageData,
          "PNG",
          xPos,
          yPos,
          logoSize, // width
          logoSize, // height (sama dengan width agar simetris)
          "",
          "none",
          0
        );
      } catch (error) {
        console.error("Error adding background:", error);
      }
    };

    // Tambahkan background ke halaman pertama
    await addBackgroundWithOpacity();

    doc.setFontSize(16);
    doc.text("FORM PENGAJUAN PERALATAN", 105, 20, null, null, "center");
    doc.setFontSize(10);

    const currentDate = new Date().toISOString().split("T")[0];
    const outlet = document.getElementById("outlet").value;
    const idPengajuan = `Kopi Oey_${outlet}`;
    const name = document.getElementById("name").value;

    const labelWidth = 30;
    doc.text(`ID Pengajuan`, 14, 35);
    doc.text(`:`, 14 + labelWidth, 35);
    doc.text(`${idPengajuan}`, 14 + labelWidth + 2, 35);

    doc.text(`Nama Pemohon`, 14, 40);
    doc.text(`:`, 14 + labelWidth, 40);
    doc.text(`${name}`, 14 + labelWidth + 2, 40);

    doc.text(`Cabang Outlet`, 14, 45);
    doc.text(`:`, 14 + labelWidth, 45);
    doc.text(`${outlet}`, 14 + labelWidth + 2, 45);

    doc.text(`Tanggal`, 14, 50);
    doc.text(`:`, 14 + labelWidth, 50);
    doc.text(`${currentDate}`, 14 + labelWidth + 2, 50);

    const headers = [
      [
        "No",
        "Nama Peralatan",
        "QTY",
        "Satuan",
        "Harga Estimasi",
        "Total",
        "Tgl Last Order",
        "Keterangan",
      ],
    ];
    const data = [];
    let totalEstimasi = 0;
    const images = [];

    const rows = document.querySelectorAll("#equipmentTable tbody tr");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.querySelector('input[name="equipmentName[]"]').value;
      const quantity = row.querySelector('input[name="quantity[]"]').value;
      const unit = row.querySelector('input[name="unit[]"]').value;
      const price = row.querySelector('input[name="price[]"]').value;
      const total = row.querySelector('input[name="total[]"]').value;
      const date = row.querySelector('input[name="lastPurchaseDate[]"]').value;
      const keterangan = row.querySelector('input[name="keterangan[]"]').value;
      const imageFile = row.querySelector('input[name="image[]"]').files[0];

      data.push([
        i + 1,
        name,
        quantity,
        unit,
        `Rp ${parseFloat(price).toLocaleString("id-ID")}`,
        `Rp ${parseFloat(total).toLocaleString("id-ID")}`,
        date,
        keterangan,
      ]);

      totalEstimasi += parseFloat(total);

      if (imageFile) {
        const imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(imageFile);
        });
        images.push({ name, data: imageData });
      }
    }

    doc.autoTable({
      head: headers,
      body: data,
      startY: 55,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, halign: "center" },
      columnStyles: {
        0: { cellWidth: 10 },
        7: { cellWidth: 30 },
      },
    });

    const finalY = doc.lastAutoTable.finalY || 55;

    function formatMultilineText(text, maxWidth) {
      const words = text.split(" ");
      let lines = [];
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? currentLine + " " + word : word;
        const width =
          (doc.getStringUnitWidth(testLine) * doc.internal.getFontSize()) /
          doc.internal.scaleFactor;

        if (width < maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    }

    const description =
      "Berikut pengajuan peralatan outlet kami, agar tidak menimbulkan kendala di operasional, mohon disetujui agar segera diproses oleh tim gudang, terima kasih.";
    const formattedDesc = formatMultilineText(description, 180);

    formattedDesc.forEach((line, index) => {
      doc.text(line, 14, finalY + 10 + index * 5);
    });

    const totalEstimasiText = `Total Estimasi: Rp ${totalEstimasi.toLocaleString(
      "id-ID"
    )}`;
    const textWidth =
      (doc.getStringUnitWidth(totalEstimasiText) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    const boxWidth = textWidth + 10;
    const boxHeight = 8;
    const boxY = finalY + 20 + formattedDesc.length * 5;
    const pageWidth = doc.internal.pageSize.width;
    const boxX = (pageWidth - boxWidth) / 2;

    doc.setFillColor(255, 255, 0);
    doc.rect(boxX, boxY, boxWidth, boxHeight, "F");

    doc.setDrawColor(0);
    doc.rect(boxX, boxY, boxWidth, boxHeight, "S");

    doc.setFont(undefined, "bold");
    doc.setTextColor(0);
    doc.text(
      totalEstimasiText,
      pageWidth / 2,
      boxY + 5.5,
      null,
      null,
      "center"
    );

    doc.setFont(undefined, "normal");

    const pageHeight = doc.internal.pageSize.height;
    const signatureY = pageHeight - 70;

    doc.text(
      "_________________",
      pageWidth / 4,
      signatureY,
      null,
      null,
      "center"
    );
    doc.text("Pemohon", pageWidth / 4, signatureY + 5, null, null, "center");

    doc.text(
      "_________________",
      (pageWidth * 3) / 4,
      signatureY,
      null,
      null,
      "center"
    );
    doc.text("R&D", (pageWidth * 3) / 4, signatureY + 5, null, null, "center");

    doc.text(
      "_________________",
      pageWidth / 4,
      signatureY + 30,
      null,
      null,
      "center"
    );
    doc.text("HOD", pageWidth / 4, signatureY + 35, null, null, "center");

    doc.text(
      "_________________",
      (pageWidth * 3) / 4,
      signatureY + 30,
      null,
      null,
      "center"
    );
    doc.text(
      "Finance",
      (pageWidth * 3) / 4,
      signatureY + 35,
      null,
      null,
      "center"
    );

    if (images.length > 0) {
      doc.addPage();
      // Tambahkan background ke halaman baru
      await addBackgroundWithOpacity();

      doc.setFontSize(14);
      doc.text("Lampiran Gambar", 105, 15, null, null, "center");
      doc.setFontSize(10);

      let yPos = 30;
      for (let i = 0; i < images.length; i++) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          // Tambahkan background ke setiap halaman baru
          await addBackgroundWithOpacity();
          yPos = 20;
        }
        doc.text(`${images[i].name}:`, 14, yPos);
        doc.addImage(images[i].data, "JPEG", 14, yPos + 5, 80, 60);
        yPos += 75;
      }
    }

    doc.save("form_pengajuan_peralatan.pdf");

    formCounter++;
  });

document.getElementById("refreshForm").addEventListener("click", function () {
  document.getElementById("equipmentForm").reset();
  const tbody = document.querySelector("#equipmentTable tbody");
  while (tbody.children.length > 1) {
    tbody.removeChild(tbody.lastChild);
  }
});
