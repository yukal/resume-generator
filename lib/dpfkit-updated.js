const PDFDocument = require("pdfkit");

PDFDocument.prototype.currentCapHeight = function currentCapHeight() {
  return (this._font.capHeight / 1000) * this._fontSize;
};

PDFDocument.prototype.lineHeightOffset = function lineHeightOffset(
  offset,
  capHeight = false
) {
  const y = this.y + offset;
  return capHeight
    ? y - ((this._font.capHeight / 1000) * this._fontSize) / 2
    : y;
};

PDFDocument.prototype.textOffset = function textOffset(
  text,
  offsY,
  x,
  options
) {
  const y = this.lineHeightOffset(offsY);
  return this.text(text, x, y, options);
};

// doc.textOffset(text, offset);
// doc.textOffset(text, offset, x);
// doc.textOffset(text, offset, x, options);

module.exports = PDFDocument;
