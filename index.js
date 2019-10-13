'use strict';

const request = require('request');
const fs = require('fs');
const stringify = require('json-stringify-pretty-compact');
const core = require('@actions/core');

try {
  request.get(
    `https://www.googleapis.com/webfonts/v1/webfonts?key=${
      process.env.GoogleToken
    }`,
    (error, response, body) => {
      if (error) core.setFailed(error.message);
      if (response.statusCode == 200) {
        // get current fonts in google fonts api
        const remote = JSON.parse(body);
        const remoteFonts = remote.items.map(font => font.family);
        // get list of families in font library
        let local = JSON.parse(fs.readFileSync('families.json'));
        const localFonts = local.map(font => font.family);
        // get difference between remote and local libraries
        const diff = remoteFonts.filter(x => !localFonts.includes(x));

        if (diff.length > 0) {
          // add diff to localFonts
          diff.map(font => local.push({ family: font, tags: [] }));
          // sort by "family"
          local = local.sort((a, b) => (a.family > b.family ? 1 : -1));
          // write file
          fs.writeFileSync(
            'families.json',
            stringify(local, { maxLength: 200 }),
            'utf-8'
          );
          console.log(`Updated library: ${diff.join(', ')}`);
        } else {
          console.log('Nothing to update.');
        }
      }
    }
  );
} catch (error) {
  core.setFailed(error.message);
}
