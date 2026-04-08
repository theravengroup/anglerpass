#!/usr/bin/env node
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "downloads", "anglerpass-backgrounder.pdf");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Brand colors
const FOREST = [30, 58, 47];
const BRONZE = [168, 131, 72];
const TEXT = [60, 60, 60];
const TEXT_LIGHT = [120, 120, 120];
const WHITE = [255, 255, 255];
const DIVIDER = [210, 200, 185];

const doc = new PDFDocument({
  size: "letter",
  bufferPages: true,
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: "AnglerPass Press Backgrounder",
    Author: "AnglerPass (Angler Pass, LLC)",
    Subject: "Company backgrounder and fact sheet for press",
    Creator: "AnglerPass",
  },
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const PAGE_WIDTH = doc.page.width - doc.page.margins.left - doc.page.margins.right;

// ─── Helper functions ───

function sectionLabel(text) {
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(...BRONZE)
    .text(text.toUpperCase(), { characterSpacing: 2 });
  doc.moveDown(0.3);
}

function sectionHeading(text) {
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(...FOREST)
    .text(text);
  doc.moveDown(0.6);
}

function bodyText(text) {
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(...TEXT)
    .text(text, { lineGap: 4 });
  doc.moveDown(0.4);
}

function divider() {
  doc.moveDown(0.5);
  const y = doc.y;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor(...DIVIDER)
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(1);
}

function factRow(label, value) {
  const startY = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(...TEXT_LIGHT)
    .text(label.toUpperCase(), doc.page.margins.left, startY, { width: 120, characterSpacing: 1 });
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(...TEXT)
    .text(value, doc.page.margins.left + 130, startY, { width: PAGE_WIDTH - 130 });
  doc.moveDown(0.3);
}

function bulletPoint(text) {
  const x = doc.page.margins.left;
  const y = doc.y;
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(...TEXT)
    .text("•", x, y, { continued: false, width: 15 });
  doc
    .text(text, x + 15, y, { lineGap: 4, width: PAGE_WIDTH - 15 });
  doc.moveDown(0.2);
}

// ─── PAGE 1: HEADER ───

// Dark header bar
const headerHeight = 100;
doc
  .save()
  .rect(0, 0, doc.page.width, headerHeight)
  .fill(...FOREST);

doc
  .font("Helvetica-Bold")
  .fontSize(24)
  .fillColor(...WHITE)
  .text("AnglerPass", doc.page.margins.left, 30, { width: PAGE_WIDTH });
doc
  .font("Helvetica")
  .fontSize(11)
  .fillColor(...BRONZE)
  .text("PRESS BACKGROUNDER", doc.page.margins.left, 60, { characterSpacing: 3, width: PAGE_WIDTH });
doc.restore();

doc.y = headerHeight + 30;

// ─── COMPANY OVERVIEW ───

sectionLabel("Company Overview");
sectionHeading("The Best Trout Water in America Is Behind Locked Gates. AnglerPass Opens Them.");

bodyText(
  "AnglerPass is the first platform connecting all four participants in the private water fly fishing ecosystem — anglers, clubs, landowners, and guides — in a single marketplace. By keeping clubs at the center of every transaction, AnglerPass preserves the trust that defines private water access while giving every participant modern tools for memberships, bookings, listings, and guide services."
);

bodyText(
  "Private water access today runs on handshakes, spreadsheets, and knowing the right people. Clubs manage rosters in Excel. Landowners can't vet who's on their property. Anglers without connections can't find bookable water. Guides operate with no standardized verification. AnglerPass brings all of it onto one platform without stripping away the trust and stewardship that make private water worth protecting."
);

divider();

// ─── KEY FACTS ───

sectionLabel("Key Facts");
doc.moveDown(0.3);

factRow("Company", "AnglerPass (Angler Pass, LLC)");
factRow("Headquarters", "Denver, Colorado");
factRow("Launch", "May 15, 2026");
factRow("Founder", "Dan Jahn");
factRow("Website", "anglerpass.com");
factRow("Category", "Private water fly fishing marketplace");
factRow("Press Contact", "press@anglerpass.com");

divider();

// ─── WHAT ANGLERPASS DOES ───

sectionLabel("What AnglerPass Does");
sectionHeading("Four Audiences, One Platform");

bodyText("AnglerPass serves four distinct user types, each with tailored tools:");

doc.moveDown(0.3);

const audiences = [
  ["Anglers", "Join clubs, discover private water, book access, hire verified guides, and plan trips with AI-powered recommendations."],
  ["Clubs", "Manage memberships, dues, corporate members, and property bookings. Cross-club partnerships unlock water across the network."],
  ["Landowners", "List private water through a trusted club partner. Earn income while maintaining full control over who accesses the property."],
  ["Guides", "Industry-leading verification (background checks, license monitoring, insurance tracking). Connect with anglers through clubs."],
];

for (const [title, desc] of audiences) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(...FOREST)
    .text(title, { continued: true })
    .font("Helvetica")
    .fillColor(...TEXT)
    .text(` — ${desc}`, { lineGap: 4 });
  doc.moveDown(0.3);
}

divider();

// ─── KEY DIFFERENTIATORS ───

sectionLabel("Key Differentiators");
doc.moveDown(0.3);

bulletPoint("Cross-Club Access — A single club membership can unlock water managed by partner clubs across the network. This kind of reach has never existed digitally in fly fishing.");
bulletPoint("Club-Centric Model — Every angler belongs to a club, and every property is managed by a club. Clubs remain the vetting layer that landowners trust and anglers respect.");
bulletPoint("Guide Verification — Background checks through Checkr, credential monitoring, and automatic suspension when licenses or insurance lapse. Every guide is verified before meeting a client.");
bulletPoint("AnglerPass Compass — An AI trip planner offering personalized recommendations based on water conditions, hatch timing, and gear.");
bulletPoint("Conservation First — Built-in rod limits, catch-and-release tracking, and habitat reporting tools to protect the resource.");

// ─── PAGE 2 ───
doc.addPage();

// ─── THE PROBLEM ───

sectionLabel("The Problem");
sectionHeading("A Market Running on Handshakes");

bodyText(
  "The private water fly fishing market is fragmented and largely offline. There is no centralized platform where anglers can discover and book private water, where clubs can manage their operations digitally, where landowners can list and monetize their water with confidence, or where guides can establish verified credentials."
);

bodyText(
  "The result: quality private water sits underutilized while capable anglers can't find access. Clubs waste administrative hours on spreadsheets. Landowners lack visibility into who's on their property. Guides have no industry-standard verification."
);

divider();

// ─── THE MODEL ───

sectionLabel("How It Works");
sectionHeading("Trust at Every Layer");

bodyText("The AnglerPass model is built on a simple principle: clubs are the trust layer.");

doc.moveDown(0.3);

const steps = [
  "Landowners partner with a club to list their private water on AnglerPass.",
  "Clubs manage the property, set booking rules, rod limits, and seasonal availability.",
  "Anglers join a club (or are invited) and book access through the platform.",
  "Guides are independently verified and connect with anglers through club networks.",
  "Cross-club partnerships allow members of one club to book water managed by another.",
];

steps.forEach((step, i) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .fillColor(...BRONZE)
    .text(`${i + 1}.`, doc.page.margins.left, doc.y, { continued: false, width: 20 });
  doc
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor(...TEXT)
    .text(step, doc.page.margins.left + 20, doc.y - doc.currentLineHeight() - 1, { lineGap: 4, width: PAGE_WIDTH - 20 });
  doc.moveDown(0.3);
});

divider();

// ─── FOUNDER ───

sectionLabel("Founder");
sectionHeading("Dan Jahn");

bodyText(
  "Dan Jahn built AnglerPass together with lifelong fly fisher friends who run one of the country's most respected fly fishing clubs. A leadership coach, author, and speaker whose work spans 68 countries, and founder of a 30-year+ technology consulting firm, Dan built AnglerPass after years of watching quality private water sit underutilized while capable anglers couldn't find access."
);

bodyText(
  "His background building and leading organizations across business, education, and the arts — combined with three decades of technology consulting — gave him both the industry perspective and the technical instinct to build the platform fly fishing's private water ecosystem has been missing."
);

doc.moveDown(0.3);

// Pull quote
const quoteX = doc.page.margins.left + 15;
const quoteY = doc.y;
doc
  .moveTo(doc.page.margins.left + 5, quoteY)
  .lineTo(doc.page.margins.left + 5, quoteY + 45)
  .strokeColor(...BRONZE)
  .lineWidth(2)
  .stroke();

doc
  .font("Helvetica-Oblique")
  .fontSize(11)
  .fillColor(...FOREST)
  .text(
    '"The best trout water in America doesn\'t need more technology. It needs a better handshake — one where clubs, landowners, guides, and anglers can all trust each other before anyone opens a gate."',
    quoteX,
    quoteY,
    { width: PAGE_WIDTH - 25, lineGap: 4 }
  );

doc.moveDown(0.3);
doc
  .font("Helvetica")
  .fontSize(9)
  .fillColor(...TEXT_LIGHT)
  .text("— Dan Jahn, Founder", quoteX);

divider();

// ─── CONTACT ───

sectionLabel("Media Contact");
doc.moveDown(0.3);

factRow("Email", "press@anglerpass.com");
factRow("Website", "anglerpass.com");
factRow("Media Kit", "anglerpass.com/downloads/anglerpass-media-kit.zip");

doc.moveDown(0.8);

doc
  .font("Helvetica")
  .fontSize(9)
  .fillColor(...TEXT_LIGHT)
  .text("We respond within 24 hours. If you're on deadline, include URGENT in your subject line.", {
    align: "center",
  });

// ─── Footer on both pages ───
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(...TEXT_LIGHT)
    .text(
      `AnglerPass Press Backgrounder  •  anglerpass.com  •  Page ${i + 1} of ${pages.count}`,
      doc.page.margins.left,
      doc.page.height - 40,
      { width: PAGE_WIDTH, align: "center" }
    );
}

doc.end();

stream.on("finish", () => {
  const stats = fs.statSync(OUT);
  const kb = Math.round(stats.size / 1024);
  console.log(`Done! Backgrounder PDF: ${OUT}`);
  console.log(`Size: ${kb}KB`);
});
