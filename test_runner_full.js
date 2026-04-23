// Full test runner - runs all registered tests via TestRunner
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const scriptBlocks = [];
const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let m;
while ((m = regex.exec(content)) !== null) {
    scriptBlocks.push(m[1]);
}

const sandbox = {
    console,
    Math,
    Date,
    JSON,
    Array,
    Object,
    Float64Array,
    Float32Array,
    Int32Array,
    Uint32Array,
    Uint8Array,
    Promise,
    Error,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    setTimeout: () => {},
    clearTimeout: () => {},
    document: {
        getElementById: (id) => ({
            style: {},
            innerHTML: '',
            value: '',
            checked: false,
            min: '0', max: '1', step: '0.01',
            addEventListener: () => {},
            querySelectorAll: () => ({ forEach: () => {} }),
            appendChild: () => {},
            removeChild: () => {},
            click: () => {},
            getContext: () => ({
                clearRect: () => {}, fillRect: () => {}, strokeRect: () => {},
                beginPath: () => {}, closePath: () => {}, moveTo: () => {}, lineTo: () => {},
                arc: () => {}, arcTo: () => {}, quadraticCurveTo: () => {}, bezierCurveTo: () => {},
                fill: () => {}, stroke: () => {},
                fillText: () => {}, strokeText: () => {},
                measureText: () => ({ width: 10 }),
                save: () => {}, restore: () => {},
                translate: () => {}, scale: () => {}, rotate: () => {},
                setTransform: () => {}, transform: () => {},
                createLinearGradient: () => ({ addColorStop: () => {} }),
                createRadialGradient: () => ({ addColorStop: () => {} }),
                drawImage: () => {},
                canvas: { width: 900, height: 500 },
                lineWidth: 1, strokeStyle: '#000', fillStyle: '#000',
                font: '12px sans-serif', textAlign: 'left', textBaseline: 'top',
                globalAlpha: 1, globalCompositeOperation: 'source-over',
                lineCap: 'butt', lineJoin: 'miter', setLineDash: () => {}
            }),
            toDataURL: () => 'data:image/png;base64,fake',
            width: 900, height: 500
        }),
        querySelectorAll: (sel) => ({ forEach: () => {}, length: 0, [Symbol.iterator]: function*(){} }),
        querySelector: () => null,
        createElement: (tag) => ({
            href: '',
            download: '',
            style: {},
            setAttribute: () => {},
            appendChild: () => {},
            removeChild: () => {},
            click: () => {},
            toDataURL: () => 'data:image/png;base64,fake',
            getContext: () => null
        }),
        body: {
            appendChild: () => {},
            removeChild: () => {},
            classList: { add: () => {}, remove: () => {}, contains: () => false }
        },
        addEventListener: () => {},
        createElementNS: (ns, tag) => ({
            setAttribute: () => {}, appendChild: () => {}, style: {},
            addEventListener: () => {}
        })
    },
    window: null,
    navigator: { userAgent: 'node' },
    URL: { createObjectURL: () => 'blob:fake', revokeObjectURL: () => {} },
    Blob: function(data, opts) { this.data = data; },
    requestAnimationFrame: () => {},
    cancelAnimationFrame: () => {}
};
sandbox.window = sandbox;

const ctx = vm.createContext(sandbox);

function prepareScript(code) {
    return code.replace(/^const\s+/mg, 'var ');
}

for (let i = 0; i < scriptBlocks.length; i++) {
    try {
        vm.runInContext(prepareScript(scriptBlocks[i]), ctx);
    } catch(e) {
        // ignore DOM errors
    }
}

// Patch TestRunner to capture results
const tests = ctx.TestRunner._tests || [];
// Access internal tests array by running in context
const resultsScript = `
(function() {
    var results = [];
    var el = { style: {}, innerHTML: '' };
    var pass = 0, fail = 0;
    // Re-run using TestRunner internals
    // We need to access the tests array
    // Since TestRunner is an IIFE, access via closure trick
    var output = [];
    // Run each test
    for (var i = 0; i < TestRunner._testCount; i++) {
        // Not directly accessible, so we'll use a different approach
    }
    return {pass: pass, fail: fail};
})()
`;

// Inject a patched run function that captures results
const captureScript = `
(function() {
    var pass = 0, fail = 0, results = [];
    // Access tests by patching TestRunner
    // We can't access the closure directly, but we can run the run() function
    // with a patched document.getElementById
    var origGet = document.getElementById;
    var capturedLines = [];
    document.getElementById = function(id) {
        if (id === 'test-output') {
            return {
                style: {},
                get innerHTML() { return ''; },
                set innerHTML(v) { capturedLines.push(v); }
            };
        }
        if (id === 'status-text') {
            return { textContent: '' };
        }
        return origGet(id);
    };
    TestRunner.run();
    document.getElementById = origGet;
    // Parse results from capturedLines
    var passCount = 0, failCount = 0;
    var testResults = [];
    for (var line of capturedLines) {
        if (line.includes('PASS:')) { passCount++; testResults.push(line.replace(/<[^>]+>/g, '')); }
        if (line.includes('FAIL:')) { failCount++; testResults.push(line.replace(/<[^>]+>/g, '')); }
        if (line.includes('Total:')) { testResults.push(line.replace(/<[^>]+>/g, '')); }
    }
    return { pass: passCount, fail: failCount, results: testResults };
})()
`;

try {
    const result = vm.runInContext(captureScript, ctx);
    console.log(`\nFull test suite results: ${result.pass} passed, ${result.fail} failed\n`);
    // Show failures
    for (const r of result.results) {
        if (r.includes('FAIL:') || r.includes('Total:')) {
            console.log(r);
        }
    }
    // Show pass count
    console.log(`PASS: ${result.pass}`);
    console.log(`FAIL: ${result.fail}`);
    process.exit(result.fail > 0 ? 1 : 0);
} catch(e) {
    console.error('Error running tests:', e.message);
    process.exit(1);
}
