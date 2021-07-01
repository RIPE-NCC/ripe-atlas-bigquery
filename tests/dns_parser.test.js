const parse_wire_message = require('../scripts/dns_parser.js');
const tests = require('./fixtures.json');

test('Testing parser output', () => {

    for (let [wireMessage, parsedOutput] of Object.entries(tests)) {
        expect(
            parse_wire_message(wireMessage)
        ).toStrictEqual(  // .toBe() does a shallow comparison and fails...
            parsedOutput
        )
    }
});
