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
        const data = JSON.parse(body);

        // get data from families.json
        const buffer = JSON.parse(fs.readFileSync('families.json'));

        // get full library
        let library = buffer;

        // get list of families in font library
        const libraryFonts = buffer.map(font => font.family);

        // track missing fonts
        const missing = [];

        // see if every google font is in font library
        data.items.forEach(font => {
          if (libraryFonts.indexOf(font.family) == -1) {
            // if not, add to library
            library.push({ family: font.family, tags: [] });
            missing.push(font.family);
          }
        });

        // if there are missing fonts
        if (missing.length > 0) {
          library = sortByKey(library, 'family');

          // write new data to families.json
          fs.writeFileSync(
            'families.json',
            stringify(library, { maxLength: 200 }),
            'utf-8'
          );
          console.log('Added ' + missing.join(', ') + ' to families.json');
        } else {
          // otherwise carry on
          console.log('No new fonts to add');
        }
      }
    }
  );
} catch (error) {
  core.setFailed(error.message);
}

// sort the library
function sortByKey(array, key) {
  return array.sort((a, b) => {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}
