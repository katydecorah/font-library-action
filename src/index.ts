"use strict";

import { exportVariable, getInput, setFailed, info } from "@actions/core";
import fetch from "node-fetch";
import { readFileSync, writeFileSync } from "fs";
import stringify from "json-stringify-pretty-compact";

type Family = { family: string; tags: string[] };
type ApiLibrary = { items: { family: string }[] };

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

    const hasFamiliesToAdd = familiesToAdd.length > 0;
    const hasFamiliesToRemove = familiesToRemove.length > 0;

    if (!hasFamiliesToAdd && !hasFamiliesToRemove) {
      exportVariable("UpdatedLibrary", false);
      info("Nothing to update.");
      return;
    }

    const commitMessage: string[] = [];

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

    exportVariable("LibraryCommitMessage", commitMessage.join("; "));

    writeFileSync(
      "families.json",
      stringify(
        local.sort((a, b) => (a.family > b.family ? 1 : -1)),
        { maxLength: 200 }
      ),
      "utf-8"
    );
  } catch (error) {
    setFailed(error);
  }
}

export default library();
