const COVER_PALETTES={
  incidents:['crimson','burgundy'],weather:['blue','indigo'],agriculture:['olive','green'],
  sports:['green','teal'],tourism:['teal','blue','olive'],social:['teal','blue','green'],
  culture:['violet','indigo','burgundy'],'city-village':['burgundy','violet','copper','crimson'],
  opinion:['burgundy','indigo','violet'],
  'short-news':['copper','blue','green','violet','teal','crimson','olive','indigo','gold'],
  video:['indigo','violet'],
  kerman:['copper','burgundy','blue','olive','teal','gold'],
  sardouiyeh:['gold','copper','green','blue','violet','teal']
};
const TOPICS={
 incidents:{label:'حوادث و ایمنی',art:'<path d="M32 6 59 54H5Z"/><path d="M32 23v13"/><circle cx="32" cy="44" r="1.5"/>'},
 weather:{label:'آب‌وهوا',art:'<circle cx="43" cy="20" r="10"/><path d="M43 3v3m0 28v3M26 20h3m28 0h4M31 8l3 3m18 18 3 3M55 8l-3 3"/><path d="M12 45a10 10 0 0 1-1-20 14 14 0 0 1 27-1 11 11 0 1 1 3 21Z"/><path d="m16 52-2 7m12-7-2 7m12-7-2 7"/>'},
 agriculture:{label:'کشاورزی',art:'<path d="M32 59V10M32 35C14 35 9 22 10 12c14 0 22 9 22 23ZM32 47c17 0 23-11 22-22-13 0-22 9-22 22Z"/><path d="m16 19 16 16m16-2-16 14M32 18c-9-3-9-12 0-16 9 4 9 13 0 16Z"/>'},
 sports:{label:'ورزش',art:'<path d="M19 7h26v18a13 13 0 0 1-26 0ZM19 13H8v9a13 13 0 0 0 14 13m23-22h11v9a13 13 0 0 1-14 13M32 38v13M21 58v-7h22v7Z"/><path d="m28 17 4-3 4 3-2 5h-4Z"/>'},
 tourism:{label:'گردشگری',art:'<path d="m3 54 20-34 12 21 8-14 18 27ZM14 35l9-15 9 16-9-5Z"/><circle cx="46" cy="13" r="7"/><path d="M4 60h56"/>'},
 social:{label:'جامعه و مردم',art:'<circle cx="24" cy="22" r="8"/><circle cx="46" cy="26" r="6"/><path d="M7 53v-6a17 17 0 0 1 34 0v6ZM43 39a12 12 0 0 1 15 12v2H46M7 13h6m-3-3v6"/>'},
 culture:{label:'فرهنگ',art:'<path d="M32 17C21 9 12 9 4 13v39c10-4 18-3 28 4 10-7 18-8 28-4V13c-8-4-17-4-28 4ZM32 17v39"/><path d="M12 24c5-1 9 0 13 3M12 34c5-1 9 0 13 3M39 27c4-3 8-4 13-3M39 37c4-3 8-4 13-3"/>'},
 'city-village':{label:'سیاسی',art:'<path d="m5 20 27-13 27 13ZM9 26h46M10 51h44M6 58h52M15 26v25m11-25v25m12-25v25m11-25v25"/>'},
 opinion:{label:'یادداشت و مطالبه',art:'<path d="m10 51 4-15L44 6l14 14-30 30-18 5ZM14 36l14 14M40 10l14 14M10 59h45"/><path d="m14 49 5 1-4 4"/>'},
 'short-news':{label:'خبر کوتاه',art:'<path d="M9 9h44v47H9ZM16 17h30M16 23h30M16 30h12v12H16Zm19 0h11m-11 6h11m-30 14h30"/>'},
 video:{label:'گزارش ویدئویی',art:'<rect x="5" y="12" width="43" height="40" rx="5"/><path d="m48 26 12-8v28l-12-8ZM21 23l15 9-15 9Z"/>'},
 kerman:{label:'اخبار استان کرمان',art:'<path d="m3 52 15-30 12 17 8-10 23 23ZM20 60V43h24v17M27 43v-8h10v8M29 60V49h6v11"/><circle cx="48" cy="12" r="6"/>'},
 sardouiyeh:{label:'ساردوئیه',art:'<path d="m2 48 20-32 13 22 11-16 16 26ZM13 60V45h39v15M22 45v-7l10-6 10 6v7M28 60V48h8v12"/><path d="M8 60h48"/>'}
};
function coverAssetName(article){
 const category=String(article.categoryId||'');
 if(!TOPICS[category])return '';
 const colors=COVER_PALETTES[category];
 let hash=2166136261;
 for(const char of String(article.id||article.slug||article.title||''))hash=Math.imul(hash^char.codePointAt(0),16777619);
 return 'news-cover-'+category+'-'+colors[(hash>>>0)%colors.length]+'.svg';
}
function decorateCover(source,category){
 const topic=TOPICS[category];if(!topic)throw new Error('Unknown cover topic');
 let svg=source.replace('aria-label="کاور خبری نبض ساردو"','aria-label="کاور '+topic.label+' نبض ساردو"');
 const pulse=svg.match(/ <path d="M160 [^\n]+/g)||[];
 if(pulse.length!==3)throw new Error('Expected the three branded pulse paths');
 svg=svg.replace(/ <path d="M160 [^\n]+\n/g,'');
 const artwork='<g transform="translate(449 172) scale(4.7)" fill="none" stroke="url(#gold)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+topic.art+'</g>\n';
 svg=svg.replace(' <text x="600" y="495"',artwork+' <text x="600" y="495"');
 svg=svg.replace('font-size="18" fill="#d3b991">رسانه محلی ساردوئیه و جنوب کرمان','font-size="24" fill="#d3b991">'+topic.label);
 svg=svg.replace('</svg>','<g transform="translate(480 550) scale(.22)" aria-hidden="true">'+pulse.join('\n')+'</g>\n</svg>');
 return svg;
}
module.exports={TOPICS,COVER_PALETTES,coverAssetName,decorateCover};
