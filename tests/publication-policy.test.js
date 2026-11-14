const test=require('node:test');
const assert=require('node:assert/strict');
const store=require('../lib/store');
const monitor=require('../lib/news-monitor');

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

test('public feeds hide funeral notices and advertisements regardless of import source',()=>{
  assert.equal(store.publiclyVisibleArticle(funeralNotice),false);
  assert.equal(store.publiclyVisibleArticle(martyrFuneral),false);
  assert.equal(store.publiclyVisibleArticle(advertisement),false);
  assert.equal(store.publiclyVisibleArticle(fatalAccident),true);
  assert.equal(store.publiclyVisibleArticle(ordinaryNews),true);
  const db={articles:[funeralNotice,martyrFuneral,advertisement,fatalAccident,ordinaryNews]};
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
  assert.equal(db.newsMonitor.nonNewsPolicyVersion,3);
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
