/*
 Utility that generates new fixtures based on the current dns_parser.
 Useful when adding new features to the parser.

 It's based on the jest testing framework, and it can be invoked through:
 `npm run fixtures <filename>`
 ...where filename defaults to 'fixtures.json'
 */

const fs = require('fs');
const parse_wire_message = require('../scripts/dns_parser.js');
const tests = require('./fixtures/fixtures.json');

let [_, filename] = process.argv.slice(2);
filename = filename ? filename : 'fixtures.json'

let entries = {}
Object.entries(tests).map(
    ([wireMessage, knownOutput]) => {
        entries[wireMessage] = parse_wire_message(wireMessage)
    }
);

fs.writeFile(
    filename,
    JSON.stringify(
        entries,
        0, 2 // we're pretty-printing
    ),
    'utf-8',
    () => {} // empty promise
)

// we need to have at least 1 test in the suite
// let's leave an empty test here...
test('empty test', () => {
    expect(1).toStrictEqual(1)
})

