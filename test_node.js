// Node.js test runner for index.html
'use strict';

// Minimal DOM polyfill
function makeEl() {
    return {
        style: {}, innerHTML: '', textContent: '',
        addEventListener: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        classList: { add:()=>{}, remove:()=>{}, toggle:()=>{} },
        dataset: {},
        appendChild: ()=>{},
        querySelectorAll: () => [],
        removeChild: ()=>{},
        click: ()=>{}
    };
}

// Patch global scope
global.document = {
    getElementById: (id) => {
        const el = makeEl();
        return el;
    },
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => makeEl()
};

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract all script blocks
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
const scripts = [];
let m;
while ((m = scriptRegex.exec(html)) !== null) {
    scripts.push(m[1]);
}

// Combine all scripts + a runner at the end
const outputStore = { html: '', status: '' };

// Override document.getElementById so we can capture test-output
global.document.getElementById = function(id) {
    if (id === 'test-output') {
        return {
            style: { display: '' },
            get innerHTML() { return outputStore.html; },
            set innerHTML(v) { outputStore.html = v; }
        };
    }
    if (id === 'status-text') {
        return {
            get textContent() { return outputStore.status; },
            set textContent(v) { outputStore.status = v; }
        };
    }
    return makeEl();
};

// Run all scripts using Function constructor (same global scope)
const allCode = scripts.join('\n;\n') + `
;\n
// Run tests
TestRunner.run();
`;

try {
    const fn = new Function('document', allCode);
    fn(global.document);
} catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack.split('\n').slice(1, 5).join('\n'));
    process.exit(1);
}

// Parse results
const lines = outputStore.html.split('<div');
for (const line of lines) {
    if (line.includes('PASS:')) {
        const name = line.replace(/[^>]*>/, '').replace(/<.*/, '').replace('PASS: ', '').trim();
        console.log('  PASS: ' + name);
    } else if (line.includes('FAIL:')) {
        const msg = line.replace(/[^>]*>/, '').replace(/<.*/, '').trim();
        console.error('  ' + msg);
    }
}

const passCount = (outputStore.html.match(/PASS:/g) || []).length;
const failCount = (outputStore.html.match(/FAIL:/g) || []).length;
const total = passCount + failCount;

console.log('\n=== RESULTS ===');
console.log('Status: ' + outputStore.status);
console.log('Total: ' + total + ' | Pass: ' + passCount + ' | Fail: ' + failCount);

if (failCount > 0) { process.exit(1); }
if (total === 0) { console.error('No tests ran!'); process.exit(1); }
console.log('All ' + passCount + ' tests passed!');
