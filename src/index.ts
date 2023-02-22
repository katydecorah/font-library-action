"use strict";

import { exportVariable, getInput, setFailed, info } from "@actions/core";
import fetch from "node-fetch";
import { readFileSync, writeFileSync } from "fs";
import stringify from "json-stringify-pretty-compact";

type Family = { family: string; tags: string[] };
type ApiFamily = {
  family: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: { [key: string]: string };
  category: string;
  kind: string;
};
type ApiLibrary = {
  items: ApiFamily[];
};
type CombinedFamily = {
  family: string;
  variants: string[];
  variantCount: number;
  hasItalic: boolean;
  hasBold: boolean;
  hasRegular: boolean;
  fullVariant: boolean;
  subsets: string[];
  lastModified: string;
  category: string;
  tags: string[];
  count: number;
  lineNumber: number;
};

async function library() {
  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${getInput(
        "GoogleToken"
      )}`
    );
    const library = (await response.json()) as ApiLibrary;
    // build list of family names in Google Fonts API
    const remoteFonts = library.items.map(({ family }) => family);

    // get list of families in font library
    let local = JSON.parse(readFileSync("families.json", "utf-8")) as Family[];
    const localFonts = local.map((font) => font.family);
    // get difference between remote and local libraries
    const familiesToAdd = remoteFonts.filter((x) => !localFonts.includes(x));
    // get difference between local and remote library
    const familiesToRemove = localFonts.filter((x) => !remoteFonts.includes(x));

    const commitMessage: string[] = [];

    const generatedData = combineLibraries(library.items, local);
    const localGeneratedData = JSON.parse(
      readFileSync("generated/data.json", "utf-8")
    );

    const hasFamiliesToAdd = familiesToAdd.length > 0;
    const hasFamiliesToRemove = familiesToRemove.length > 0;
    const hasGeneratedDataToUpdate = generatedData !== localGeneratedData;

    if (
      !hasFamiliesToAdd &&
      !hasFamiliesToRemove &&
      !hasGeneratedDataToUpdate
    ) {
      exportVariable("UpdatedLibrary", false);
      info("Nothing to update.");
      return;
    }

    if (hasFamiliesToAdd) {
      familiesToAdd.map((font) => local.push({ family: font, tags: [] }));
      const added = `➕ Added: ${familiesToAdd.join(", ")}`;
      commitMessage.push(added);
      info(added);
      exportVariable("UpdatedLibrary", true);
    }

    if (hasFamiliesToRemove) {
      local = local.filter((f) => !familiesToRemove.includes(f.family));
      const removed = `✂️ Removed: ${familiesToRemove.join(", ")}`;
      commitMessage.push(removed);
      info(removed);
      exportVariable("UpdatedLibrary", true);
    }

    if (hasGeneratedDataToUpdate) {
      writeFileSync("generated/data.json", generatedData, "utf-8");
      const updated = "📝 Updated generated data";
      commitMessage.push(updated);
      info(updated);
      exportVariable("UpdatedLibrary", true);
    }

    if (hasFamiliesToAdd || hasFamiliesToRemove) {
      writeFileSync(
        "families.json",
        stringify(
          local.sort((a, b) => (a.family > b.family ? 1 : -1)),
          { maxLength: 200 }
        ),
        "utf-8"
      );
    }

    exportVariable("LibraryCommitMessage", commitMessage.join("; "));
  } catch (error) {
    setFailed(error);
  }
}

function combineLibraries(
  remoteFonts: ApiLibrary["items"],
  local: Family[]
): string {
  const combineLibrary: CombinedFamily[] = [];

  for (const [index, font] of remoteFonts.entries()) {
    const localFont = local.find((f) => f.family === font.family);

    // Check for main variants
    let hasItalic = false,
      hasBold = false,
      hasRegular = false,
      fullVariant = false;
    if (font.variants.includes("italic")) {
      hasItalic = true;
    }
    if (font.variants.includes("regular") || font.variants.includes("400")) {
      hasRegular = true;
    }
    if (
      font.variants.includes("500") ||
      font.variants.includes("600") ||
      font.variants.includes("700") ||
      font.variants.includes("800") ||
      font.variants.includes("900")
    ) {
      hasBold = true;
    }

    if (hasBold && hasRegular && hasItalic) {
      fullVariant = true;
    }

    combineLibrary.push({
      family: font.family,
      variants: font.variants,
      variantCount: font.variants.length,
      hasItalic,
      hasBold,
      hasRegular,
      fullVariant,
      subsets: font.subsets,
      lastModified: font.lastModified,
      category: font.category,
      tags: localFont ? localFont.tags : [],
      count: localFont ? localFont.tags.length : 0, // number of tags
      lineNumber: index + 2,
    });
  }

  const tagArr = combineLibrary.map((f) => f.tags).flat();
  const variantArr = combineLibrary.map((f) => f.variants).flat();
  const subsetArr = combineLibrary.map((f) => f.subsets).flat();
  const categoryArr = combineLibrary.map((f) => f.category);
  return JSON.stringify({
    uniqueTags: [...new Set(tagArr)],
    tags: groupBy(tagArr, "tag"),
    uniqueVariants: [...new Set(variantArr)],
    variants: groupBy(variantArr, "variant"),
    uniqueSubsets: [...new Set(subsetArr)],
    subsets: groupBy(subsetArr, "subset"),
    uniqueCategories: [...new Set(categoryArr)],
    categories: groupBy(categoryArr, "category"),
    families: combineLibrary.sort((a, b) => (a.family > b.family ? 1 : -1)),
  });
}

function groupBy(array, label) {
  const obj = array.reduce((obj, key) => {
    if (!obj[key]) obj[key] = 0;
    obj[key]++;
    return obj;
  }, {});

  return Object.keys(obj).map((key) => ({ [label]: key, value: obj[key] }));
}

export default library();
