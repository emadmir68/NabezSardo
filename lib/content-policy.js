function normalizeText(v=''){
  return String(v||'')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&zwnj;|&#8204;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/ك/g,'ک').replace(/ي/g,'ی')
    .replace(/[\u200c\u200f\u200e\ufeff]/g,' ')
    .replace(/\s+/g,' ').trim().toLowerCase();
}

function blockedMonitoredContentReason(c={}){
  const title=normalizeText(c.title||'');
  const lead=normalizeText(c.lead||'');
  const body=normalizeText([c.body,c.bodyHtml].filter(Boolean).join(' ')).slice(0,10000);
  const headline=(title+' '+lead).trim();
  const text=(headline+' '+body).trim();

  // Never promote raw citizen messages, greetings, or direct requests as news.
  const devotionalLead=/^(?:بسم\s*الله(?:\s+الرحمن\s+الرحیم)?|اللهم\s+عجل\s+لولیک\s+الفرج|یا\s+(?:الله|حسین|علی|زهرا))(?:$|[\s،,:؛.!؟])/u;
  const greetingLead=/^(?:وقت\s+بخیر|صبح\s+بخیر|ظهر\s+بخیر|عصر\s+بخیر|شب\s+بخیر|درود(?:\s+بر\s+شما)?)(?:$|[\s،,:؛.!؟])|^سلام(?:$|[،,:؛.!؟]|\s+(?:علیکم|وقت|صبح|ظهر|عصر|شب|عرض|خسته|دوستان|لطفا|لطفاً|این|من|ما|آقا|خانم)(?:$|[\s،,:؛.!؟]))/u;
  const directRequest=/(?:لطفا|لطفاً|خواهشا|خواهشاً|خواهشمندم|زحمت\s+بکشید|ممنون\s+میشم|ممنون\s+می\s*شم).{0,80}(?:بررسی|پیگیری|رسیدگی|منتشر|اطلاع\s*رسانی|اعلام|خبر|اقدام)/u;
  const firstPersonChat=/^(?:من|ما)\s+(?:می\s*خواستم|می\s*خوام|می\s*خواهم|گفتم|می\s*گم|فرستادم|خواستم|هستم|بودم)(?:$|\s)/u;
  const messageLabel=/^(?:پیام\s+(?:مردمی|شهروندی|شهروند|کاربر)|پیام\s+ارسالی|دلنوشته|متن\s+ارسالی)(?:$|[\s:：،-])/u;
  if(devotionalLead.test(title)||greetingLead.test(title)||directRequest.test(title)||firstPersonChat.test(title)||messageLabel.test(title))return 'non-news-message';

  // Opinion pieces and personal essays are outside the hard-news monitor.
  const editorialLead=/^(?:یادداشت|واکاوی|تحلیل|دیدگاه|سرمقاله|دلنوشته|به\s+قلم|روایت\s+شخصی)(?:$|[\s:：،-])/u;
  const ceremonialLead=/^به\s+نام(?:$|\s)/u;
  if(editorialLead.test(title)||ceremonialLead.test(title))return 'opinion-or-non-news';

  // Funeral/death notices are excluded, but ordinary reports of fatal accidents
  // remain eligible unless they announce a funeral, burial, condolence, or memorial.
  const funeralNoticeTitle=/(?:آگهی|اطلاعیه|اعلامیه)\s*(?:مراسم\s*)?(?:فوت|درگذشت|ترحیم|تشییع|تدفین|خاکسپاری|ختم)|(?:مجلس|مراسم)\s*(?:ترحیم|ختم|تشییع|تدفین|خاکسپاری|یادبود|سالگرد|بزرگداشت)|(?:تشییع|خاکسپاری|تدفین)\s+(?:پیکر|جنازه|مرحوم|مرحومه)|(?:زمان|مکان|جزئیات)\s+(?:تشییع|خاکسپاری|تدفین)|(?:دعوت|حضور)\s+.{0,50}(?:مراسم|مجلس).{0,40}(?:ترحیم|ختم|تشییع|تدفین)|(?:مراسم\s+)?(?:سوم|هفتم|چهلم|سالگرد)\s+(?:مرحوم|مرحومه|درگذشت|فوت|رحلت)|(?:مراسم\s+)?(?:سومین|هفتمین|چهلمین)\s+(?:روز\s+)?(?:درگذشت|فوت|رحلت)|سالگرد\s+(?:درگذشت|فوت|رحلت)|(?:پیام|متن)\s+(?:تسلیت|تعزیت)|یادبود\s+(?:مرحوم|مرحومه|شادروان)|بزرگداشت\s+(?:مرحوم|مرحومه|شادروان)/u;
  const funeralEvent=/(?:مراسم|مجلس)\s*(?:ترحیم|ختم|تشییع|تدفین|خاکسپاری|یادبود|سالگرد|بزرگداشت)|تشییع\s+(?:پیکر|جنازه)|خاکسپاری\s+(?:پیکر|مرحوم|مرحومه)|به\s+خاک\s+سپرده\s+شد|مراسم\s+(?:سوم|هفتم|چهلم|سومین|هفتمین|چهلمین)/u;
  const bereavementContext=/(?:مرحوم|مرحومه|مغفور|مغفوره|شادروان|درگذشت|فوت|خانواده\s+داغدار|بازماندگان|روحش\s+شاد)/u;
  const funeralAnnouncementLead=/(?:با\s+(?:نهایت|کمال)\s+تاسف|به\s+اطلاع\s+(?:می\s*رساند|می‌رساند)|ضمن\s+عرض\s+تسلیت|بدین\s+وسیله).{0,180}(?:درگذشت|فوت|مرحوم|مرحومه)/u;
  if(funeralNoticeTitle.test(title)||(funeralEvent.test(text)&&bereavementContext.test(text))||funeralAnnouncementLead.test(text))return 'obituary';

  // Explicit advertorial/classified labels are a hard block.
  const explicitAdTitle=/(?:رپورتاژ(?:\s+آگهی)?|آگهی(?:\s*(?:تبلیغاتی|فروش|بازرگانی|استخدام|مناقصه|مزایده))?|محتوای\s+تبلیغاتی|(?:پست|گزارش|محتوا)\s+تبلیغاتی|تبلیغ\s+ویژه|اسپانسر(?:ی)?)/u;
  const explicitAdBody=/(?:رپورتاژ(?:\s+آگهی)?|آگهی\s*(?:تبلیغاتی|فروش|بازرگانی|استخدام|مناقصه|مزایده)|محتوای\s+تبلیغاتی|محتوای\s+اسپانسری)/u;
  const advertisingService=/(?:پذیرش\s+آگهی|جهت\s+تبلیغ(?:ات)?|برای\s+تبلیغ(?:ات)?|سفارش\s+تبلیغات|تعرفه\s+تبلیغات|محتوای\s+اسپانسری)/u;
  if(explicitAdTitle.test(title)||explicitAdBody.test(text)||advertisingService.test(text))return 'advertisement';

  // Detect promotional copy by combining a commercial offer with a clear CTA,
  // price/contact detail, or more than one independent sales signal. Avoid
  // rejecting ordinary economic news such as "افزایش فروش محصولات کشاورزی".
  const commercialOffer=/(?:فروش\s+(?:ویژه|مستقیم|اقساطی|انواع)|تخفیف(?:\s+\S+){0,2}|قیمت\s+(?:ویژه|استثنایی|باورنکردنی|مناسب)|پیشنهاد\s+ویژه|فرصت\s+(?:طلایی|ویژه)|ارسال\s+رایگان|خرید\s+اقساطی|مشاوره\s+رایگان|بهترین\s+قیمت|نازل\s*ترین\s+قیمت|ثبت\s+سفارش|سفارش\s+دهید|رزرو\s+کنید|پکیج\s+ویژه|خدمات\s+تخصصی|ارائه\s+خدمات|نمایندگی\s+فروش|فروش\s+انواع|فروش\s+فوری|فروش\s+با\s+شرایط|دوره\s+آموزشی|کلاس\s+آموزشی|کارگاه\s+آموزشی|ثبت\s+نام\s+دوره|پذیرش\s+هنرجو|دعوت\s+به\s+همکاری|استخدام\s+(?:فوری|نیرو|کارمند|کارگر)|جذب\s+نیرو|محصولات|کالاها|خدمات|آموزشگاه|پذیرش\s+(?:هنرجو|مشتری))/u;
  const callToAction=/(?:برای\s+(?:خرید|سفارش|رزرو|ثبت\s*نام)|جهت\s+(?:خرید|سفارش|رزرو|ثبت\s*نام)|با\s+شماره|تماس\s+(?:بگیرید|حاصل\s+فرمایید)|واتساپ|واتس\s*اپ|دایرکت|ثبت\s+سفارش|سفارش\s+دهید|خرید\s+کنید|رزرو\s+کنید|ثبت\s+نام\s+کنید|جهت\s+کسب\s+اطلاعات|برای\s+اطلاعات\s+بیشتر|همین\s+حالا|مشاوره\s+رایگان)/u;
  const contactDetail=/(?:شماره\s+تماس|تلفن|موبایل|واتساپ|واتس\s*اپ|دایرکت|۰?۹\d{9}|0?9\d{9}|0\d{2,3}[-\s]?\d{6,8})/u;
  const priceDetail=/(?:قیمت|تومان|ریال|درصد\s+تخفیف|٪|%)/u;
  const salesContext=/(?:فروش|خرید|محصول|کالا|خدمات|پکیج|رزرو|سفارش|تخفیف)/u;
  const hasOffer=commercialOffer.test(text);
  const hasCta=callToAction.test(text);
  if((hasOffer&&hasCta)||(hasOffer&&priceDetail.test(text)&&contactDetail.test(text))||(hasCta&&priceDetail.test(text)&&salesContext.test(text)))return 'advertisement';

  return '';
}

module.exports={blockedMonitoredContentReason};
