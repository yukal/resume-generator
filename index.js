const fs = require("fs");
const PDFDocument = require("./lib/dpfkit-updated");
const size = require("./lib/size");

const person = require("./data/persons/person-john-doe.json");
const template = require("./data/templates/template-noto.json");
// const template = require("./data/templates/template-helvetica.json");

const shortPersonName = person.name.replace(/\s/g, "");
const shortTarget = person.target.replace(/\s/g, "-");
const filename = `${shortPersonName}-${shortTarget}.pdf`;

const doc = new PDFDocument({
  size: template.size,
  layout: template.layout,
});

doc.pipe(fs.createWriteStream(filename));

const { DOC_WIDTH, DOC_HEIGHT } = template.metrics;
const { fontBold, fontNorm, leftColumnBg } = template;

const FRAME_X1 = size.mm.toPoints(template.metrics.leftMargin);
const FRAME_Y1 = size.mm.toPoints(template.metrics.topMargin);
const FRAME_X2 = DOC_WIDTH - size.mm.toPoints(template.metrics.rightMargin);
const FRAME_Y2 = DOC_HEIGHT - size.mm.toPoints(template.metrics.bottomMargin);

const COLUMNS_GAP = size.mm.toPoints(template.metrics.columnsGap);
const COLUMN1_END = size.mm.toPoints(template.metrics.leftColumn.width);
const COLUMN2_START = COLUMN1_END + COLUMNS_GAP;
const COLUMN2_WIDTH = FRAME_X2 - COLUMN2_START;

const ROW_LEGEND_TOP = size.mm.toPoints(template.metrics.rowLegendTop);

let POS_Y = 0;

doc.info.Title = `${person.position} - ${person.name}`;
doc.info.Author = person.name;
// doc.info.Creator = name;
// doc.info.Producer = name;
doc.info.Keywords = "CV,resume,backend,nodejs,developer";
doc.options.margins = {
  left: FRAME_X1,
  top: FRAME_Y1,
  right: FRAME_X2,
  bottom: FRAME_Y2,
};

doc.rect(0, 0, COLUMN1_END, DOC_HEIGHT).fill(leftColumnBg);
doc.lineGap(template.lineHeight);

// const middle = DOC_WIDTH / 2;
// doc.lineAnnotation(middle, 0, middle, DOC_HEIGHT, { color: "red" });

// doc.lineAnnotation(0, ROW_LEGEND_TOP, DOC_WIDTH, ROW_LEGEND_TOP, { color: "aqua" });
// doc.lineAnnotation(0, FRAME_Y1, DOC_WIDTH, FRAME_Y1, { color: "aqua" });
// doc.lineAnnotation(0, FRAME_Y2, DOC_WIDTH, FRAME_Y2, { color: "aqua" });
// doc.lineAnnotation(FRAME_X1, 0, FRAME_X1, DOC_HEIGHT, { color: "aqua" });
// doc.lineAnnotation(FRAME_X2, 0, FRAME_X2, DOC_HEIGHT, { color: "aqua" });
// doc.lineAnnotation(COLUMN1_END, 0, COLUMN1_END, DOC_HEIGHT, { color: "aqua" });
// doc.lineAnnotation(COLUMN2_START, 0, COLUMN2_START, DOC_HEIGHT, { color: "aqua" });

// ...................................................................
// BIRTH DATA
{
  const { textDefault } = template.data;
  const { fontColor, fontWeight, fontSize } = textDefault;
  const fontPath = getFontPath(template, fontWeight);

  doc.font(fontPath).fontSize(fontSize).fillColor(fontColor);
  doc.text(person.birth, FRAME_X1, ROW_LEGEND_TOP);
}

// ...................................................................
// PERSON NAME & PERSON POSITION
{
  const { personName, personPosition } = template.data;
  const nameFontPath = getFontPath(template, personName.fontWeight);
  const posFontPath = getFontPath(template, personPosition.fontWeight);

  doc
    .font(nameFontPath)
    .fontSize(personName.fontSize)
    .fillColor(personName.fontColor);

  doc.text(person.name.toUpperCase(), FRAME_X1, FRAME_Y1);

  doc
    .font(posFontPath)
    .fontSize(personPosition.fontSize)
    .fillColor(personPosition.fontColor);

  const offs = size.mm.toPoints(personPosition.marginTop);
  POS_Y = doc.lineHeightOffset(offs);

  doc.text(person.position, FRAME_X1, POS_Y);
}

// ...................................................................
// CONTACTS
{
  POS_Y = size.mm.toPoints(template.data.contacts.positionY);
  addContacts(doc, template, person.contacts, FRAME_X1, POS_Y);
}

// ...................................................................
// SKILLS
{
  const skillsData = prepareSkillsData(person);
  POS_Y = size.mm.toPoints(template.data.skills.positionY);
  addSkills(doc, template, skillsData, FRAME_X1, POS_Y);
}

// ...................................................................
// THE PROJECTS
{
  const { text, fontSize, fontColor } = template.data.textProjects;
  doc.font(fontNorm).fontSize(fontSize).fillColor(fontColor);

  const POS_X = FRAME_X2 - doc.widthOfString(text);
  doc.text(text, POS_X, ROW_LEGEND_TOP, { lineBreak: false });

  addProjects(
    doc,
    template,
    person.projects,
    COLUMN2_START,
    FRAME_Y1,
    COLUMN2_WIDTH
  );
}

// ...................................................................
// RESUME VERSION
{
  const { textDefault, primaryColor, secondaryColor } = template.data;
  const { fontSize, fontColor } = textDefault;

  doc.font(fontNorm).fontSize(fontSize).fillColor(secondaryColor);

  const dt = new Date();
  const creationDate = dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { version } = person.meta;
  const textVersion = `ver. ( ${version} ) ${creationDate}`;
  const POS_X = FRAME_X2 - doc.widthOfString(textVersion);
  // const POS_Y = FRAME_Y2 - doc.currentLineHeight(true);

  // doc.text(textVersion, POS_X, POS_Y, { lineBreak: false });
  doc.text(textVersion, POS_X, FRAME_Y2, { lineBreak: false });
}

// ...................................................................
// AVATAR
{
  const { avatar } = template.data;
  const AVA_WIDTH = size.mm.toPoints(avatar.width);
  const AVA_POS_Y = avatar.positionY;
  const AVA_RADIUS = AVA_WIDTH / 2;

  // Create a clipping path
  const CLIP_X = FRAME_X1 + AVA_RADIUS;
  const CLIP_Y = AVA_POS_Y + AVA_RADIUS;

  doc.circle(CLIP_X, CLIP_Y, AVA_RADIUS).clip();
  doc.image(person.photo, FRAME_X1, AVA_POS_Y, {
    fit: [AVA_WIDTH, AVA_WIDTH],
    align: "center",
    valign: "center",
  });
}
// ...................................................................

doc.end();

function addContacts(doc, template, data, startX = 0, startY = 0) {
  const { linkColor, contacts } = template.data;
  const { fontBold, fontNorm } = template;

  doc.font(fontNorm).fontSize(contacts.fontSize);

  const lineHeight = doc.currentLineHeight(true) + 3;
  const spaceWidth = doc.widthOfString("\t");
  let POS_Y = startY;

  data.map((contact) => {
    const caption = contact.name + ":";

    const nameWidth = doc.widthOfString(caption);
    const linkWidth = doc.widthOfString(contact.link);

    const POS_X = startX + nameWidth + spaceWidth;

    doc.fillColor("black").text(caption, startX, POS_Y);
    doc
      .fillColor(linkColor)
      .text(contact.link, POS_X, POS_Y)
      .underline(POS_X, POS_Y, linkWidth, lineHeight - 3, { color: linkColor })
      .link(POS_X, POS_Y, linkWidth, lineHeight - 3, contact.url);

    POS_Y += lineHeight;
  });
}

function addSkills(doc, template, data, startX = 0, startY = 0, width = 210) {
  const options = { width };
  let marginY = startY;
  let offset = 0;

  const { textDefault, primaryColor, secondaryColor } = template.data;
  const { listOffset } = template.data;
  const { fontSize, fontColor } = textDefault;
  const { fontBold, fontNorm } = template;

  const minOffest = size.mm.toPoints(listOffset.min);
  const maxOffest = size.mm.toPoints(listOffset.max);

  data.map((item) => {
    const caption = item.caption.toUpperCase();
    const subject = item.subject;

    doc.font(fontBold).fontSize(fontSize).fillColor(primaryColor);
    offset = doc.currentLineHeight(true);

    doc.text(caption, startX, marginY - offset, options);
    marginY += doc.heightOfString(caption, options) + minOffest;

    doc
      .font(fontNorm)
      .fontSize(fontSize - 1)
      .fillColor(secondaryColor);
    offset = doc.currentLineHeight(true);

    doc.text(subject, startX, marginY - offset, options);
    marginY += doc.heightOfString(subject, options) + maxOffest;
  });
}

function addProjects(doc, template, data, startX = 0, startY = 0, width) {
  const options = { width };
  let marginY = startY;
  let offs = 0;

  const { textDefault, primaryColor, secondaryColor } = template.data;
  const { listOffset } = template.data;
  const { fontSize, fontColor } = textDefault;
  const { fontBold, fontNorm } = template;

  const minOffest = size.mm.toPoints(listOffset.min);
  const maxOffest = size.mm.toPoints(listOffset.max);

  data.map((item) => {
    const caption = item.name.toUpperCase();
    const subject = item.description;
    const tech = item.tech.join(", ");

    doc.font(fontBold).fontSize(fontSize).fillColor(primaryColor);
    // offs = doc.currentLineHeight(true);
    // doc.lineAnnotation(startX, marginY, DOC_WIDTH, marginY, { color: "aqua" });

    doc.text(caption, startX, marginY, options);
    marginY += doc.heightOfString(caption, options) + minOffest;

    doc
      .font(fontNorm)
      .fontSize(fontSize - 1)
      .fillColor("green");
    // offs = doc.currentLineHeight(true);
    // doc.lineAnnotation(startX, marginY, DOC_WIDTH, marginY, { color: "aqua" });

    doc.text(tech, startX, marginY, options);
    marginY += doc.heightOfString(tech, options) + minOffest;

    doc
      .font(fontNorm)
      .fontSize(fontSize - 1)
      .fillColor(secondaryColor);
    // offs = doc.currentLineHeight(true);
    // doc.lineAnnotation(startX, marginY, DOC_WIDTH, marginY, { color: "aqua" });

    doc.text(subject, startX, marginY, options);
    marginY += doc.heightOfString(subject, options) + maxOffest;
  });
}

function prepareSkillsData(person) {
  const data = [];

  if (person?.skills?.length) {
    data.push({
      caption: "Skills",
      subject: person.skills.join(", "),
    });
  }

  if (person?.extraSkills?.length) {
    data.push({
      caption: "Extra Skills",
      subject: person.extraSkills.join(", "),
    });
  }

  if (person?.education?.length) {
    data.push({
      caption: "Education",
      subject: person.education.join(", "),
    });
  }

  if (person?.courses?.length) {
    data.push({
      caption: "Courses",
      subject: person.courses.join(", "),
    });
  }

  if (person?.english) {
    data.push({
      caption: "English",
      subject: person.english,
    });
  }

  return data;
}

function getFontPath(template, fontWeight) {
  const capitalized =
    fontWeight === "regular"
      ? "Norm"
      : fontWeight[0].toUpperCase() + fontWeight.substr(1).toLowerCase();

  const fontName = `font${capitalized}`;

  return template.hasOwnProperty(fontName)
    ? template[fontName]
    : template.fontNorm;
}
