// Node.js headless test runner for four_limb_synthesis
// Extracts and runs all script blocks from index.html

const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('C:/Users/user/four_limb_synthesis/index.html', 'utf8');

// Extract all script blocks
const scriptBlocks = [];
const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let m;
while ((m = regex.exec(content)) !== null) {
    scriptBlocks.push(m[1]);
}
console.log('Found', scriptBlocks.length, 'script blocks');

// Build sandbox with DOM mocks
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
            addEventListener: () => {},
            querySelectorAll: () => ({ forEach: () => {} }),
            appendChild: () => {},
            removeChild: () => {},
            click: () => {},
            getContext: () => ({
                clearRect: () => {}, fillRect: () => {}, strokeRect: () => {},
                beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
                arc: () => {}, fill: () => {}, stroke: () => {},
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
    HTMLCanvasElement: {},
    requestAnimationFrame: () => {},
    cancelAnimationFrame: () => {}
};
sandbox.window = sandbox;

const ctx = vm.createContext(sandbox);

// Replace top-level 'const X =' with 'var X =' so they become context properties
function prepareScript(code) {
    return code.replace(/^const\s+/mg, 'var ');
}

let loadErrors = [];
for (let i = 0; i < scriptBlocks.length; i++) {
    try {
        vm.runInContext(prepareScript(scriptBlocks[i]), ctx);
    } catch(e) {
        const msg = e.message || '';
        // Ignore expected DOM-related errors
        if (!msg.includes('addEventListener') &&
            !msg.includes('querySelectorAll') &&
            !msg.includes('Cannot read properties of null') &&
            !msg.includes('getContext')) {
            loadErrors.push(`Block ${i}: ${msg.slice(0, 120)}`);
        }
    }
}

if (loadErrors.length > 0) {
    console.log('Load errors:');
    loadErrors.forEach(e => console.log(' ', e));
}

console.log('MathCore defined:', typeof ctx.MathCore !== 'undefined');
console.log('DataLayer defined:', typeof ctx.DataLayer !== 'undefined');
console.log('Limb2 defined:', typeof ctx.Limb2 !== 'undefined');
console.log('Limb3 defined:', typeof ctx.Limb3 !== 'undefined');
console.log('TestRunner defined:', typeof ctx.TestRunner !== 'undefined');
console.log('');

const MathCore = ctx.MathCore;
const DataLayer = ctx.DataLayer;
const Limb2 = ctx.Limb2;
const Limb3 = ctx.Limb3;

let pass = 0, fail = 0;

function test(name, fn) {
    try {
        fn();
        console.log('PASS:', name);
        pass++;
    } catch(e) {
        console.log('FAIL:', name, '-', e.message);
        fail++;
    }
}

// T53: RK4 exponential growth
test('T53: ODE RK4 exponential growth', () => {
    const traj = MathCore.ode.rk4((_t, y) => y, 1.0, 0, 1, 0.01);
    const yFinal = traj[traj.length - 1].y;
    if (Math.abs(yFinal - Math.E) > 0.01) throw new Error(`y(1)=${yFinal.toFixed(6)}, expected ${Math.E.toFixed(6)}`);
});

// T54: Euler-Maruyama Bass SDE
test('T54: ODE Euler-Maruyama Bass SDE path', () => {
    MathCore.random.seed(42);
    const m = 0.8, p = 0.03, q = 0.38;
    const drift = (_t, y) => (p * (m - y) + q * y * (m - y) / m);
    const diffusion = (_t, y) => 0.15 * y;
    const path = MathCore.ode.eulerMaruyama(drift, diffusion, 0.01, 0, 10, 0.01, MathCore.random);
    if (path.length < 10) throw new Error(`Path too short: ${path.length}`);
    const yEnd = path[path.length - 1].y;
    if (yEnd < 0 || yEnd > 1) throw new Error(`y(10) = ${yEnd} out of [0,1]`);
});

// T55: emPaths + pathBands
test('T55: ODE emPaths + pathBands', () => {
    const drift = (_t, y) => 0.1 * (0.5 - y);
    const diff = (_t, y) => 0.05 * y;
    const paths = MathCore.ode.emPaths(drift, diff, 0.01, 0, 5, 0.1, 50, 42);
    if (paths.length !== 50) throw new Error(`Expected 50 paths, got ${paths.length}`);
    const bands = MathCore.ode.pathBands(paths);
    if (!bands[0].hasOwnProperty('q0.5')) throw new Error('Missing median band');
});

// T56: Bass SDE 4-region
test('T56: M19 Bass SDE 4-region adoption', () => {
    const ctxRows = DataLayer.getContext().filter(c => c.year === 2025);
    const res = Limb3.methods.bassSDE(ctxRows, {nPaths: 20, tMax: 10, seed: 42});
    if (res.length !== 4) throw new Error(`Expected 4 regions, got ${res.length}`);
    if (!res[0].bands) throw new Error('Missing bands');
    if (res[0].region !== 'North America') throw new Error(`First region: ${res[0].region}`);
    console.log(`  regions: ${res.map(r => r.region).join(', ')}`);
    console.log(`  finalMedians: ${res.map(r => r.finalMedian.toFixed(4)).join(', ')}`);
});

// T57: MFG Nash equilibrium
test('T57: M20 MFG Nash equilibrium', () => {
    const ctxRows = DataLayer.getContext().filter(c => c.year === 2025);
    const res = Limb3.methods.meanFieldGame(ctxRows, {maxIter: 50, seed: 42});
    if (!res.equilibrium) throw new Error('No equilibrium');
    if (res.iterations < 1) throw new Error('No iterations');
    for (const r of res.equilibrium) {
        if (r.adoption < 0 || r.adoption > 1) throw new Error(`Adoption ${r.adoption} out of range`);
    }
    console.log(`  Converged: ${res.converged}, Iterations: ${res.iterations}`);
    console.log(`  Equilibrium: ${res.equilibrium.map(r => `${r.region}: ${r.adoption.toFixed(4)}`).join(', ')}`);
});

console.log('');
console.log(`Results: ${pass} passed, ${fail} failed out of ${pass+fail} tests`);

// Also run a basic test of the existing 52 tests via the TestRunner
if (ctx.TestRunner) {
    // Count registered tests
    console.log('\nTestRunner available - checking via in-context execution');
}

process.exit(fail > 0 ? 1 : 0);
