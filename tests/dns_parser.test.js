const parse_wire_message = require('../scripts/dns_parser.js');
const tests = require('./fixtures/fixtures.json');
const withErrors = require('./fixtures/withErrors.json');

// one test case per wireMessage
Object.entries(tests).map(
    ([wireMessage, knownOutput]) => {
        test(`Testing parser output ${wireMessage.slice(0,8)}`, () => {

            expect(
                parse_wire_message(wireMessage)
            ).toStrictEqual(  // .toBe() does a shallow comparison and fails...
                knownOutput
            )
        });
    }
);

// the parser manages to work, although with errors
Object.entries(withErrors).map(
    ([wireMessage, knownOutput]) => {

        const id = `${wireMessage.slice(0, 8)}`;  // just a short id
        test(`Testing parser output ${id}`, () => {

            expect(
                parse_wire_message(wireMessage)
            ).toStrictEqual(  // .toBe() does a shallow comparison and fails...
                knownOutput
            )
        });
    }
)
