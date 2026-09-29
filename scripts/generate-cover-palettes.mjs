import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'public/news-cover.svg'),'utf8');

// Background, metallic stroke and ambient glow for each editorial palette.
const palettes={
  crimson:['#0b0d16','#211019','#4c1424','#8c263c','#ffb9af','#e04c62','#be334f','#ec7184'],
  burgundy:['#100d17','#261021','#4b1837','#8f416d','#f4a9ca','#bf638e','#a73e6b','#d788ae'],
  blue:['#091421','#102440','#153b60','#2876a8','#b6ebff','#63b9e7','#357cae','#8ad9fb'],
  indigo:['#111124','#201b43','#352c66','#5555ae','#d2c5ff','#8980db','#6d69c7','#b5a5f5'],
  olive:['#111910','#1b2b17','#304322','#647b35','#e2ec9b','#a9c666','#839d43','#c7df7b'],
  green:['#091a16','#103023','#18523a','#247f5b','#b6f4cb','#66d59f','#3baa75','#8be6b1'],
  teal:['#0a1b20','#103038','#17525a','#23858b','#b4f0eb','#68d6d0','#39aeb6','#85e8e0'],
  violet:['#151021','#291935','#482658','#734796','#edc7ff','#b982db','#9963c3','#d6a0f1'],
  copper:['#18120f','#2d1d15','#4c2c1c','#9a5b34','#ffe0ab','#d9925b','#bb7543','#efb477']
};

const keys=[
  '#090d14','#15111a','#29131e',
  '#8a5d2b','#ffebbb','#b57f3d',
  '#ad6339','#dfbd83','#e3b575','#e9c985',
  '#382519','#fff6d8','#d7a45e'
];
for(const [name,[bg1,bg2,bg3,metal1,metal2,metal3,glow,trim]] of Object.entries(palettes)){
  const colors=[bg1,bg2,bg3,metal1,metal2,metal3,glow,trim,trim,trim,bg3,metal2,trim];
  let svg=source;
  keys.forEach((key,i)=>{svg=svg.replaceAll(key,colors[i]);});
  fs.writeFileSync(path.join(root,`public/news-cover-${name}.svg`),svg);
}
