const packager = require('electron-packager')
const exec = require('child_process').exec

if(process.argv.length < 2) {
    console.error('Usage: node compile.js (win32 | macintel | macarm | linux)')
    process.exit(1)
}

let type = process.argv[2]
let PLATFORM, ARCH

function execute(command, callback) {
    exec(command, (error, stdout, stderr) => { 
        callback(stdout); 
    });
};

async function bundleElectronApp(options) {
    const appPaths = await packager(options)
    console.log(`Electron app bundles created:\n${appPaths.join("\n")}`)
}

switch (type) {
    case "win32":
        PLATFORM = "win32"
        ARCH = "x64"
        break;
    case "macintel":
        PLATFORM = "darwin"
        ARCH = "x64"
        break;
    case "macarm":
        PLATFORM = "darwin"
        ARCH = "arm64"
        break;
    case "linux":
        PLATFORM = "linux"
        ARCH = "x64"
        break;
    
    default:
        console.error("Not supported or nonsense OS/Arch. Try again maybe?")
        break;
}

// build electron app (read parameter os and arch), ignore .gitignore, src/source, src/ignore
bundleElectronApp({
    dir: '.',
    name: 'BMS Radio Station',
    appBundleId: 'com.sorae42.bmsradio',
    arch: ARCH,
    platform: PLATFORM,
    ignore: [
        'node_modules',
        '.gitignore',
        'build.js',
        'builds'
    ],
    out: 'builds',
    overwrite: true,
    asar: true,
    prune: true,
    icon: 'iconset/logo',
    appVersion: '1.0.0'
})