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
  assert.equal(articleTools._test.publicationPolicyReason(ordinaryNews),'');
  const db={articles:[funeralNotice,martyrFuneral,advertisement,funeralTraffic,clinicAdvertisement,bakeryAdvertisement,poem,congratulatoryMessage,fatalAccident,ordinaryNews,communityMemorial]};
  assert.deepEqual(store.published(db).map(a=>a.id).sort(),['real-incident-1','real-memorial-news','real-news-1']);
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
  assert.equal(db.newsMonitor.nonNewsPolicyVersion,5);
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
  assert.equal(db.newsMonitor.nonNewsPolicyVersion,5);
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
