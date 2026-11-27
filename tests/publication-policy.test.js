const test=require('node:test');
const assert=require('node:assert/strict');
const store=require('../lib/store');
const monitor=require('../lib/news-monitor');
const rebirthPublic=require('../lib/rebirth-public');
const geminiBridge=require('../lib/gemini-bridge');
const articleTools=require('../lib/article-tools');

const funeralNotice={
  id:'legacy-funeral-1',slug:'legacy-funeral-1',status:'published',imported:false,
  title:'مراسم تشییع و تدفین مرحوم "محمدرسول شهدادی" (فرزند مراد) فردا شنبه ساعت ۹ از غسالخانه عنبرآباد به سمت گلزار شهدای روستای رومرز برگزار میشود.',
  lead:'مراسم تشییع و تدفین مرحوم محمدرسول شهدادی فردا برگزار می‌شود.',
  body:'هوالباقی؛ خانواده داغدار از مردم برای حضور در مراسم دعوت کردند.'
};
const martyrFuneral={
  id:'legacy-funeral-2',slug:'legacy-funeral-2',status:'published',imported:true,
  title:'مراسم تشییع پیکر شهید علی اکبر فیروزی و استقبال از شهید گمنام همزمان در شهرستان رودبار جنوب برگزار می‌شود',
  lead:'زمان: سه‌شنبه ۱۹ آبان ماه ساعت ۱۴ مکان: میدان اصلی شهر',
  body:'مراسم تشییع پیکر و استقبال از شهید گمنام برگزار می‌شود.'
};
const advertisement={
  id:'legacy-ad-1',slug:'legacy-ad-1',status:'published',imported:false,
  title:'رپورتاژ آگهی؛ معرفی خدمات یک مجموعه تجاری',
  lead:'این مطلب با هدف معرفی خدمات منتشر شده است.',
  body:'محتوای تبلیغاتی و اسپانسری.'
};
const fatalAccident={
  id:'real-incident-1',slug:'real-incident-1',status:'published',imported:false,
  title:'تصادف مرگبار در محور جیرفت؛ دو نفر جان باختند',
  lead:'در پی برخورد دو خودرو در محور جیرفت، دو نفر جان خود را از دست دادند.',
  body:'نیروهای امدادی مصدومان را به بیمارستان منتقل کردند و علت حادثه در دست بررسی است.'
};
const ordinaryNews={
  id:'real-news-1',slug:'real-news-1',status:'published',imported:false,
  title:'اجرای طرح جدید آبیاری در بلوارهای جیرفت آغاز شد',
  lead:'عملیات اجرایی طرح آبیاری قطره‌ای در چند بلوار شهر آغاز شد.',
  body:'شهرداری اعلام کرد این طرح با هدف مدیریت مصرف آب اجرا می‌شود.'
};
const funeralTraffic={
  id:'legacy-funeral-traffic',slug:'legacy-funeral-traffic',status:'published',imported:false,
  title:'اعلام محدودیت های ترافیکی برگزاری مراسم " تشییع شهید" صادق قدرتی" در جیرفت',
  lead:'در راستای برگزاری مراسم تشییع شهید صادق قدرتی، محدودیت‌های ترافیکی اعلام شد.',
  body:'زمان و مسیر برگزاری مراسم تشییع اعلام شد.'
};
const clinicAdvertisement={
  id:'legacy-clinic-ad',slug:'legacy-clinic-ad',status:'published',imported:false,
  title:'دکتر سینا سیدی پور',
  lead:'متخصص جراحی عمومی، لاپاروسکوپی و زیبایی؛ تلفن رزرو نوبت: ۰۹۰۲۰۵۷۱۰۰۷؛ آدرس: خیابان لرها، جیرفت.',
  body:'برای رزرو نوبت با شماره درج‌شده تماس بگیرید.'
};
const bakeryAdvertisement={
  id:'legacy-bakery-ad',slug:'legacy-bakery-ad',status:'published',imported:false,
  title:'کلوچه‌سرای محبوب؛ طعم اصیل شیرینی‌های سنتی جنوب کرمان',
  lead:'معرفی محصولات و طعم اصیل شیرینی‌های محلی.',
  body:'تجربه‌ای متفاوت از شیرینی‌های سنتی.'
};
const poem={
  id:'legacy-poem',slug:'legacy-poem',status:'published',imported:false,
  title:'امشب تو را به خوبی نسبت به ماه کردم',
  lead:'شب و شعر امشب تو را به خوبی نسبت به ماه کردم؛ تو خوب‌تر ز ماهی، من اشتباه کردم.',
  body:'دوشینه پیش رویت آیینه را نهادم؛ روز سفید خود را آخر سیاه کردم.'
};
const congratulatoryMessage={
  id:'legacy-congratulation',slug:'legacy-congratulation',status:'published',imported:false,
  title:'سرکار خانم نادری عزیز',
  lead:'مدیر محترم مدرسه غیردولتی پروین اعتصامی؛ موفقیت دانش‌آموزان مجموعه شما را تبریک می‌گوییم.',
  body:'این موفقیت را به مجموعه شما تبریک عرض می‌کنیم.'
};
const communityMemorial={
  id:'real-memorial-news',slug:'real-memorial-news',status:'published',imported:false,
  title:'گرامیداشت سالگرد شهید گمنام در دوساری برگزار شد',
  lead:'برنامه گرامیداشت با حضور مردم و مسئولان محلی برگزار شد.',
  body:'این برنامه با هدف پاسداشت یاد شهید گمنام برگزار شد.'
};

test('public feeds hide funeral notices and advertisements regardless of import source',()=>{
  assert.equal(store.publiclyVisibleArticle(funeralNotice),false);
  assert.equal(store.publiclyVisibleArticle(martyrFuneral),false);
  assert.equal(store.publiclyVisibleArticle(advertisement),false);
  assert.equal(store.publiclyVisibleArticle(funeralTraffic),false);
  assert.equal(store.publiclyVisibleArticle(clinicAdvertisement),false);
  assert.equal(store.publiclyVisibleArticle(bakeryAdvertisement),false);
  assert.equal(store.publiclyVisibleArticle(poem),false);
  assert.equal(store.publiclyVisibleArticle(congratulatoryMessage),false);
  assert.equal(store.publiclyVisibleArticle(fatalAccident),true);
  assert.equal(store.publiclyVisibleArticle(ordinaryNews),true);
  assert.equal(store.publiclyVisibleArticle(communityMemorial),true);
  assert.equal(articleTools._test.publicationPolicyReason(poem),'non-news-poetry');
  assert.equal(articleTools._test.publicationPolicyReason(clinicAdvertisement),'advertisement');
  const db={articles:[funeralNotice,martyrFuneral,advertisement,funeralTraffic,clinicAdvertisement,bakeryAdvertisement,poem,congratulatoryMessage,fatalAccident,ordinaryNews]};
  assert.deepEqual(store.published(db).map(a=>a.id).sort(),['real-incident-1','real-news-1']);
});

test('policy migration quarantines previously published funeral notices and advertisements without deleting their records',()=>{
  const db={
    articles:[{...funeralNotice},{...martyrFuneral},{...advertisement},{...fatalAccident}],
    newsMonitor:{
      settings:{},sources:[{id:'source-1',scope:'kerman',topic:'local',enabled:true}],
      queue:[{id:'queued-ad',status:'pending',title:'آگهی تبلیغاتی؛ فروش ویژه محصولات',lead:'برای خرید با ما تماس بگیرید.'}],
      logs:[],seenUrls:[],sourceConfigVersion:5,logicVersion:6,latestOnlyPolicyVersion:1,nonNewsPolicyVersion:2
    }
  };
  monitor.ensure(db);
  assert.equal(db.newsMonitor.nonNewsPolicyVersion,6);
  assert.equal(db.newsMonitor.nonNewsPolicyQuarantinedCount,3);
  for(const id of ['legacy-funeral-1','legacy-funeral-2','legacy-ad-1']){
    const item=db.articles.find(a=>a.id===id);
    assert.ok(item,'the record is retained for editorial audit');
    assert.equal(item.status,'draft');
    assert.equal(item.moderationStatus,'rejected');
    assert.equal(item.blockedByPolicyVersion,3);
  }
  assert.equal(db.articles.find(a=>a.id==='real-incident-1').status,'published');
  assert.equal(db.newsMonitor.queue[0].status,'rejected');
  assert.equal(db.newsMonitor.queue[0].articleId,null);
});

test('v5 hard-exclusion migration quarantines new ad, poetry, PR and quoted funeral patterns',()=>{
  const scheduledPoem={...poem,id:'scheduled-poem',slug:'scheduled-poem',status:'scheduled'};
  const blocked=[funeralTraffic,clinicAdvertisement,bakeryAdvertisement,poem,congratulatoryMessage,scheduledPoem].map(x=>({...x}));
  const valid=[{...fatalAccident},{...communityMemorial}];
  const db={articles:[...blocked,...valid],newsMonitor:{
    settings:{},sources:[{id:'source-1',scope:'jiroft',topic:'local',enabled:true}],
    queue:[
      {id:'queued-poem',status:'pending',title:poem.title,lead:poem.lead},
      {id:'queued-clinic-ad',status:'pending',title:clinicAdvertisement.title,lead:clinicAdvertisement.lead}
    ],logs:[],seenUrls:[],sourceConfigVersion:6,logicVersion:99,categoryClassifierVersion:3,
    textCleanupVersion:2,mixConfigVersion:1,fourHourCadenceVersion:1,subrequestConfigVersion:1,
    telegramAutoPublishVersion:1,telegramCurrentBatchReleaseVersion:1,latestOnlyPolicyVersion:1,nonNewsPolicyVersion:4
  }};
  monitor.ensure(db);
  assert.equal(db.newsMonitor.nonNewsPolicyVersion,6);
  assert.equal(db.newsMonitor.nonNewsPolicyQuarantinedCount,6);
  for(const item of blocked){
    const quarantined=db.articles.find(a=>a.id===item.id);
    assert.ok(quarantined,'quarantined record remains available for audit');
    assert.equal(quarantined.status,'draft');
    assert.equal(quarantined.moderationStatus,'rejected');
    assert.equal(quarantined.blockedByPolicyVersion,5);
  }
  for(const item of valid)assert.equal(db.articles.find(a=>a.id===item.id).status,'published');
  assert.ok(db.newsMonitor.queue.every(q=>q.status==='rejected'));
});

test('public archive filters blocked records and homepage expires stale ticker and briefs',()=>{
  const archiveHtml=rebirthPublic.archive({settings:{},categories:[{id:'incidents',name:'حوادث'},{id:'social',name:'اجتماعی'}],articles:[{...poem},{...clinicAdvertisement},{...fatalAccident}]},{});
  assert.doesNotMatch(archiveHtml,/امشب تو را به خوبی نسبت به ماه کردم/);
  assert.doesNotMatch(archiveHtml,/دکتر سینا سیدی پور/);
  assert.match(archiveHtml,/تصادف مرگبار در محور جیرفت/);

  const now=new Date().toISOString();
  const fresh={id:'fresh-home-story',slug:'fresh-home-story',status:'published',title:'خبر تازه جیرفت امروز',lead:'گزارش تازه از جیرفت',categoryId:'social',publishedAt:now,createdAt:now,views:2};
  const staleBrief={id:'stale-home-brief',slug:'stale-home-brief',status:'published',title:'خبر کوتاه قدیمی مهر',lead:'خبر کوتاه قدیمی',categoryId:'short-news',publishedAt:'2026-10-07T08:00:00.000Z',createdAt:'2026-10-07T08:00:00.000Z'};
  const homeHtml=rebirthPublic.home({settings:{liveDeskEnabled:true,breakingText:'هفتم مهر ماه روز آتش نشانی و ایمنی گرامی باد',breakingTextEn:'Old October notice',breakingUpdatedAt:'2026-10-07T08:00:00.000Z'},categories:[{id:'social',name:'اجتماعی'},{id:'short-news',name:'خبر کوتاه'}],articles:[fresh,staleBrief]});
  assert.match(homeHtml,/خبر تازه جیرفت امروز/);
  assert.doesNotMatch(homeHtml,/هفتم مهر ماه روز آتش نشانی/);
  assert.doesNotMatch(homeHtml,/خبر کوتاه قدیمی مهر/);
});

test('about page exposes the newsroom responsibility text required by the public editorial policy',()=>{
  const html=rebirthPublic.simple({settings:{},categories:[],articles:[]},'about');
  assert.match(html,/تحریریه و مسئولیت انتشار/);
  assert.match(html,/راستی‌آزمایی اطلاعات/);
});

test('high-confidence political category correction reaches Gemini without misclassifying sports',()=>{
  const title='هشدار صریح صنعا به ریاض: جده در تیررس ارتش یمن است';
  const db={settings:{},categories:[{id:'weather',name:'آب‌وهوا'},{id:'city-village',name:'سیاسی'}],articles:[{id:'political-story',slug:'political-story',title,lead:'ارتش یمن درباره تحولات منطقه هشدار داد.',categoryId:'weather',status:'published'}]};
  store.normalizeEditorialDb(db);
  assert.equal(db.articles[0].categoryId,'city-village');
  const mapped=geminiBridge.mapArticle({...db.articles[0],publishedAt:new Date().toISOString()});
  assert.equal(mapped.category,'politics');
  const sport=geminiBridge.mapArticle({id:'sports-story',title:'تیم فوتبال جیرفت قهرمان لیگ شد',lead:'مسابقه ورزشی برگزار شد',categoryId:'sports',status:'published',publishedAt:new Date().toISOString()});
  assert.equal(sport.category,'sports');
});

test('regional focus and SSR cleanup quarantine bereavement notices, foreign wires, card numbering and duplicated leads',()=>{
  const mourning={id:'bereavement-1',slug:'bereavement-1',title:'فردا عزای عمومی اعلام شد',lead:'در پی رحلت مرجع عالیقدر فردا عزای عمومی اعلام شد.',categoryId:'social',status:'published'};
  const foreignPentagon={id:'pentagon-1',slug:'pentagon-1',title:'گزارش جدید پنتاگون درباره عملیات ارتش یمن و ناو هواپیمابر آمریکا',lead:'پنتاگون درباره صنعا و جده در عربستان بیانیه داد.',categoryId:'politics',status:'published'};
  const doctorAd={id:'doc-ad-1',slug:'doc-ad-1',title:'دکتر متخصص قلب در جیرفت - نوبت دهی مطب با شماره تماس 09131234567',lead:'رزرو نوبت اینترنتی و آدرس کلینیک',categoryId:'health',status:'published'};
  const localFresh={id:'local-1',slug:'local-1',title:'افتتاح جاده روستایی ساردوئیه',lead:'افتتاح جاده روستایی ساردوئیه.',body:'افتتاح جاده روستایی ساردوئیه\nمسیر ارتباطی سه روستا به شبکه اصلی پیوست.',categoryId:'local',status:'published',publishedAt:new Date().toISOString(),views:45};
  const localTwo={id:'local-2',slug:'local-2',title:'آغاز برداشت مرکبات جیرفت',lead:'کشاورزان جیرفتی برداشت مرکبات پاییزی را آغاز کردند.',categoryId:'farming',status:'published',publishedAt:new Date(Date.now()-3600000).toISOString(),views:20};
  const localOldPopular={id:'old-popular',slug:'old-popular',title:'گزارش قدیمی دو ماه پیش',lead:'خبر قدیمی با بازدید بالا',categoryId:'social',status:'published',publishedAt:'2026-08-01T10:00:00.000Z',views:99999};

  assert.equal(store.publiclyVisibleArticle(mourning),false);
  assert.ok(articleTools._test.publicationPolicyReason(mourning));

  const db={
    settings:{},
    categories:[{id:'local',name:'محلی'},{id:'farming',name:'کشاورزی'},{id:'social',name:'اجتماعی'}],
    articles:[mourning,foreignPentagon,localFresh,localTwo,localOldPopular].map(x=>({...x})),
    newsMonitor:{settings:{},sources:[{id:'mehr-world',enabled:true},{id:'mehr-politics',enabled:true}],queue:[],logs:[],seenUrls:[],nonNewsPolicyVersion:6,regionalFocusVersion:0}
  };
  assert.equal(store.publiclyVisibleArticle(doctorAd),false);
  monitor.ensure(db);
  assert.equal(db.articles.find(a=>a.id==='bereavement-1').status,'draft');
  assert.equal(db.articles.find(a=>a.id==='pentagon-1').status,'draft');
  assert.equal(db.articles.find(a=>a.id==='local-1').status,'published');
  assert.equal(db.newsMonitor.sources.find(s=>s.id==='mehr-world').enabled,false);

  const homeHtml=rebirthPublic.home(db);
  assert.doesNotMatch(homeHtml,/rb-image-index|class="rb-en"|NABZ SARDO|01 \/ LEAD/);
  assert.match(homeHtml,/پربازدیدترین‌ها \(۳۰ روز اخیر\)/);
  assert.match(homeHtml,/آغاز برداشت مرکبات جیرفت/);
  assert.doesNotMatch(homeHtml,/پنتاگون|عزای عمومی/);

  const mapped=geminiBridge.mapArticle(localFresh);
  assert.equal(mapped.deck.fa,'مسیر ارتباطی سه روستا به شبکه اصلی پیوست.');
});

test('smart taxonomy, channel cleanup, queue redaction, and admin monitor UI stay consistent',()=>{
  const rebirthAdmin=require('../lib/rebirth-admin');
  const miscatTurkey={id:'miscat-weather',slug:'miscat-weather',title:'ترکیه دسترسی کودکان زیر ۱۵ سال به شبکه‌های اجتماعی را ممنوع کرد',lead:'دولت این تصمیم را اعلام کرد.',categoryId:'weather',status:'published'};
  const miscatKonkoor={id:'miscat-sports',slug:'miscat-sports',title:'اختصاص بورس نخبگان دانشگاه تهران به رتبه‌های زیر ۱۰۰ در کنکور',lead:'دانشگاه تهران جزییات بورس را اعلام کرد.',categoryId:'sports',status:'published'};
  const miscatDatePalm={id:'miscat-palm',slug:'miscat-palm',title:'برگزاری کارگاه آموزشی مبارزه با آفت خرما در روستای کنارصندل',lead:'جهاد کشاورزی دوره آموزش مبارزه با آفت خرما برگزار کرد.',body:'این دوره در جنوب کرمان برگزار شد.\nلینک روبیکا',categoryId:'culture',status:'published'};
  const miscatPaving={id:'miscat-paving',slug:'miscat-paving',title:'نهضت آسفالت به محله کهوروئیه جیرفت رسید',lead:'شهرداری عملیات آسفالت معابر را اجرا کرد.',categoryId:'city-village',status:'published'};
  const blockedQueueAd={id:'q-ad',status:'pending',sourceId:'src-1',url:'https://t.me/s/test/1',title:'کلوچه سرای محبوب با طعم اصیل',lead:'بهترین کلوچه با شماره تماس 09131234567',body:'فروش ویژه کلوچه 09131234567'};

  const db={
    settings:{},
    categories:[{id:'weather',name:'آب‌وهوا'},{id:'sports',name:'ورزش'},{id:'culture',name:'فرهنگی'},{id:'agriculture',name:'کشاورزی'},{id:'city-village',name:'سیاسی'},{id:'social',name:'اجتماعی'}],
    articles:[miscatTurkey,miscatKonkoor,miscatDatePalm,miscatPaving].map(x=>({...x})),
    newsMonitor:{settings:{enabled:false},sources:[{id:'src-1',name:'منبع آزمون',url:'https://example.com',enabled:true,lastError:'HTTP 503'}],queue:[blockedQueueAd],logs:[{id:'l1',at:new Date().toISOString(),type:'filtered',sourceId:'src-1',blockedReason:'advertisement',message:'محتوای غیرخبری مسدود شد'}],seenUrls:[],nonNewsPolicyVersion:6,regionalFocusVersion:0}
  };

  monitor.ensure(db);
  store.normalizeEditorialDb(db);

  // Foreign Turkey non-local item is quarantined; local palm & paving stories stay published with corrected categories and no Rubika link
  assert.equal(db.articles.find(a=>a.id==='miscat-weather').status,'draft');
  assert.equal(db.articles.find(a=>a.id==='miscat-sports').categoryId,'social');
  assert.equal(db.articles.find(a=>a.id==='miscat-palm').categoryId,'agriculture');
  assert.doesNotMatch(db.articles.find(a=>a.id==='miscat-palm').body,/لینک\s+روبیکا/);
  assert.equal(db.articles.find(a=>a.id==='miscat-paving').categoryId,'social');

  // Blocked queue item is rejected and redacted (reason saved without retaining raw ad body)
  const redactedQ=db.newsMonitor.queue.find(q=>q.id==='q-ad');
  assert.equal(redactedQ.status,'rejected');
  assert.equal(redactedQ.rejectionReason,'advertisement');
  assert.equal(redactedQ.body,'');
  assert.equal(redactedQ.lead,'');

  // Admin panel renders pause/resume toggle, honest warning when monitorRun=0/paused, source error badge, discovered/accepted/rejected counts, and monitor logs
  db.newsMonitor.sources.find(s=>s.id==='src-1').lastError='HTTP 503';
  const snap=monitor.snapshot(db);
  const adminHtml=rebirthAdmin.admin(db,[],new URLSearchParams('monitorPaused=1'),{telegram:false,rubika:false,whatsapp:false,baseUrl:true},{totalPageViews:100,today:{pageViews:10}},snap);
  assert.match(adminHtml,/رصد هوشمند متوقف است/);
  assert.match(adminHtml,/شروع مجدد رصد/);
  assert.match(adminHtml,/آخرین اجرای موفق رصد/);
  assert.match(adminHtml,/دارای خطا/);
  assert.match(adminHtml,/HTTP 503/);
  assert.match(adminHtml,/دلایل رد اخبار و خطاهای پردازش/);

  // Word-boundary bombardment ("بمباران") vs rain ("باران"), plus duplicate paragraph cleanup
  const bombingWeather={id:'bombing-1',slug:'bombing-1',title:'از #ایران می‌آیم...',lead:'گزارش درباره بمباران مدرسه در ایران.',body:'گزارش درباره بمباران مدرسه در ایران.\n\nگزارش درباره بمباران مدرسه در ایران.\n\nجزئیات تازه از این رویداد منتشر شد.',categoryId:'weather',status:'published'};
  const db2={categories:[{id:'weather',name:'آب‌وهوا'},{id:'incidents',name:'حوادث'},{id:'social',name:'اجتماعی'}],articles:[bombingWeather]};
  store.normalizeEditorialDb(db2);
  assert.notEqual(db2.articles[0].categoryId,'weather');
  const mappedBomb=geminiBridge.mapArticle({...db2.articles[0],publishedAt:new Date().toISOString()});
  assert.equal(mappedBomb.body.fa.length,2);
});
