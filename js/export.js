/*
 * export.js
 * Turns the assembled policy text (Render.getPolicyHtml) into a
 * downloadable PDF or Word document. 
 *
 * PDF export uses html2pdf.js, loaded from a CDN in index.html.
 * Word export uses "HTML wrapped as .doc", which
 * needs no library and opens correctly in Microsoft Word.
 */

const PolicyExport = (function () {
  function filenameBase() {
    const name = (AppState.get().practiceName || "policy").trim();
    return name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "policy";
  }

  function wrapperHtml(bodyHtml) {
    return `<div class="pdf-export" style="padding: 40px; font-family:'Times New Roman', Times, serif; font-size:12pt; color:#000; line-height:1.5;">
      ${bodyHtml}
    </div>`;
  }

  function toPdf() {
    if (typeof html2pdf === "undefined") {
      alert("PDF export library failed to load (no internet connection?). Please check your connection and try again.");
      return;
    }
    const container = document.createElement("div");
    container.id = "pdf-export-container"
    container.innerHTML = wrapperHtml(Render.getPolicyHtml());
    document.body.insertBefore(container, document.body.firstChild);

    const opts = {
      margin: 30,
      filename: `${filenameBase()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
    };

    const cleanup = () => container.remove();
    html2pdf().set(opts).from(container).save().then(cleanup).catch(cleanup);
  }

  function toWord() {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>AI Policy</title></head>
      <body>${wrapperHtml(Render.getPolicyHtml())}</body>
      </html>`;
    const blob = new Blob(["", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase()}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return { toPdf, toWord };
})();
