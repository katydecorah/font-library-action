"use strict";

import { setFailed } from "@actions/core";
import fetch from 'node-fetch';
import {readFileSync, writeFileSync} from 'fs'
import stringify from "json-stringify-pretty-compact";

async function library() {
  try {
    const response = await fetch(
    "https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyDK4Jz71F7DQCrUhXYaF3xgEXoQGLDk5iE"
  );
  const { items } = await response.json();
  // build list of family names in Google Fonts API
  const remoteFonts = items.map(({ family }) => family);

        // get list of families in font library
        let local = JSON.parse(readFileSync('families.json','utf-8'));
        const localFonts = local.map(font => font.family);
        // get difference between remote and local libraries
        const diff = remoteFonts.filter(x => !localFonts.includes(x));

        if (diff.length > 0) {
          // add diff to localFonts
          diff.map(font => local.push({ family: font, tags: [] }));
          // sort by "family"
          local = local.sort((a, b) => (a.family > b.family ? 1 : -1));
          // write file
          writeFileSync(
            'families.json',
            stringify(local, { maxLength: 200 }),
            'utf-8'
          );
          console.log(`Updated library: ${diff.join(', ')}`);
        } else {
          console.log('Nothing to update.');
        }

  } catch (error) {
    setFailed(error.message);
  }
}

export default library();