const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log(' SynthTrade Pro - Fix Activacion');
console.log('========================================');
console.log('');

const deployPath = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', '8g3roh', 'synthtrade-pro-deploy');
const chunkFile = path.join(deployPath, '_next', 'static', 'chunks', '62b5c9f401785f87.js');
const backupFile = chunkFile + '.backup';

if (!fs.existsSync(chunkFile)) {
    console.log('ERROR: No se encontro el archivo JS en:');
    console.log('  ' + chunkFile);
    console.log('');
    console.log('Asegurate de que la carpeta de deploy existe.');
    process.exit(1);
}

console.log('1. Creando backup...');
fs.copyFileSync(chunkFile, backupFile);
console.log('   OK - backup creado');

console.log('');
console.log('2. Leyendo archivo original...');
const content = fs.readFileSync(chunkFile, 'utf8');
console.log('   Tamano: ' + content.length + ' caracteres');

console.log('');
console.log('3. Aplicando parche...');

const zgetFunc = `var _zGet=async function(_r){var _u=_r.toString()+".json";var _p=await fetch(_u);var _d=await _p.json();return{exists:function(){return _d!==null&&_d!==undefined},val:function(){return _d},forEach:function(_c){if(_d&&typeof _d==="object"){Object.keys(_d).forEach(function(_k){_c({key:_k,val:function(){return _d[_k]}})})}}}};`;

const storeMarker = 'let oE=el((e,t)=>({licenseKey';
const storeIndex = content.indexOf(storeMarker);

if (storeIndex < 0) {
    console.log('   ERROR: No se encontro el store de zustand.');
    console.log('   Restaurando backup...');
    fs.copyFileSync(backupFile, chunkFile);
    process.exit(1);
}

console.log('   Store encontrado en posicion: ' + storeIndex);

const contentBefore = content.substring(0, storeIndex);
const contentAfter = content.substring(storeIndex);

const regex = /await t\(([a-z])\)(?!\()/g;
const matches = contentAfter.match(regex);
const count = matches ? matches.length : 0;

const patchedAfter = contentAfter.replace(regex, 'await _zGet($1)');
const patched = contentBefore + zgetFunc + patchedAfter;

console.log('   Se reemplazaron ' + count + ' llamadas a Firebase get()');

const remaining = patchedAfter.match(/await t\(([a-z])\)(?!\()/g);
if (remaining && remaining.length > 0) {
    console.log('   WARNING: Quedaron ' + remaining.length + ' patrones sin parchear');
} else {
    console.log('   Todos los patrones fueron parcheados correctamente');
}

console.log('');
console.log('4. Guardando archivo parcheado...');
fs.writeFileSync(chunkFile, patched, 'utf8');
console.log('   Archivo guardado exitosamente');

console.log('');
console.log('========================================');
console.log(' FIX APLICADO CORRECTAMENTE!');
console.log('========================================');
console.log('');
console.log('El backup esta en: ' + backupFile);
