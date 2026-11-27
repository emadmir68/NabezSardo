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
    .replace(/\u0640/g,'')
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
  const greetingLead=/^(?:با\s+سلام(?:\s+و\s+احترام)?)(?:$|[\s،,:؛.!؟])|(?:وقت\s+بخیر|صبح\s+بخیر|ظهر\s+بخیر|عصر\s+بخیر|شب\s+بخیر|درود(?:\s+بر\s+شما)?)(?:$|[\s،,:؛.!؟])|^سلام(?:$|[،,:؛.!؟]|\s+(?:علیکم|وقت|صبح|ظهر|عصر|شب|عرض|خسته|دوستان|لطفا|لطفاً|این|من|ما|آقا|خانم)(?:$|[\s،,:؛.!؟]))/u;
  const directRequest=/(?:لطفا|لطفاً|خواهشا|خواهشاً|خواهشمندم|زحمت\s+بکشید|ممنون\s+میشم|ممنون\s+می\s*شم).{0,80}(?:بررسی|پیگیری|رسیدگی|منتشر|اطلاع\s*رسانی|اعلام|خبر|اقدام)/u;
  const firstPersonChat=/^(?:من|ما)\s+(?:می\s*خواستم|می\s*خوام|می\s*خواهم|گفتم|می\s*گم|فرستادم|خواستم|هستم|بودم)(?:$|\s)/u;
  const messageLabel=/^(?:پیام\s+(?:مردمی|شهروندی|شهروند|کاربر)|پیام\s+ارسالی|دلنوشته|متن\s+ارسالی)(?:$|[\s:：،-])/u;
  const directAddress=/^(?:جناب|سرکار)\s+(?:آقای|خانم)\s+[\u0600-\u06FF]+(?:\s+(?:عزیز|محترم|گرامی))/u;
  const congratulatoryLead=/^(?:پیام\s+تبریک|تبریک\s+(?:به|ویژه)|تبریک\s+و\s+تهنیت)/u;
  if(devotionalLead.test(title)||greetingLead.test(title)||directRequest.test(title)||firstPersonChat.test(title)||messageLabel.test(title)||directAddress.test(title)||congratulatoryLead.test(title))return 'non-news-message';

  // A labelled poetry feed or romantic poetry post is literary content, not local news.
  const hardNewsEvent=/(?:افتتاح\s+شد|گشایش\s+یافت|پلمب\s+شد|بازداشت|توقیف|آغاز\s+شد|برگزار\s+شد|اعلام\s+کرد|گفت|خبر\s+داد|گزارش\s+داد|حمایت\s+مسئولان|همایش|جشنواره)/u;
  const poetrySeriesLead=/^(?:شب\s+و\s+شعر|شعر\s+و\s+شعر|غزل\s+امشب|شعر\s+امشب)(?:$|[\s:：،-])/u;
  const romanticPoem=/(?:شعر\s+عاشقانه|غزل\s+عاشقانه|شعر\s+شاعرانه|ترانه\s+عاشقانه)/u;
  if(poetrySeriesLead.test(lead)||poetrySeriesLead.test(body)||(romanticPoem.test(text)&&!hardNewsEvent.test(text)))return 'non-news-poetry';

  // Opinion pieces and personal essays are outside the hard-news monitor.
  const editorialLead=/^(?:یادداشت|واکاوی|تحلیل|دیدگاه|سرمقاله|دلنوشته|به\s+قلم|روایت\s+شخصی)(?:$|[\s:：،-])/u;
  const ceremonialLead=/^به\s+نام(?:$|\s)/u;
  if(editorialLead.test(title)||ceremonialLead.test(title))return 'opinion-or-non-news';

  // Funeral/death notices & bereavement mourning decrees are excluded,
  // while ordinary reports of fatal accidents remain eligible.
  const funeralNoticeTitle=/(?:آگهی|اطلاعیه|اعلامیه)\s*(?:مراسم\s*)?(?:فوت|درگذشت|ترحیم|تشییع|تدفین|خاکسپاری|ختم|یادواره)|(?:مجلس|مراسم)\s*(?:ترحیم|ختم|تشییع|تدفین|خاکسپاری|یادبود|سالگرد|بزرگداشت)|(?:تشییع|خاکسپاری|تدفین)\s+(?:پیکر|جنازه|مرحوم|مرحومه)|(?:زمان|مکان|جزئیات)\s+(?:تشییع|خاکسپاری|تدفین|یادواره)|(?:دعوت|حضور)\s+.{0,50}(?:مراسم|مجلس).{0,40}(?:ترحیم|ختم|تشییع|تدفین|یادواره)|(?:مراسم\s+)?(?:سوم|هفتم|چهلم|سالگرد)\s+(?:مرحوم|مرحومه|درگذشت|فوت|رحلت)|(?:مراسم\s+)?(?:سومین|هفتمین|چهلمین)\s+(?:روز\s+)?(?:درگذشت|فوت|رحلت)|سالگرد\s+(?:درگذشت|فوت|رحلت)|(?:پیام|متن)\s+(?:تسلیت|تعزیت)|یادبود\s+(?:مرحوم|مرحومه|شادروان)|بزرگداشت\s+(?:مرحوم|مرحومه|شادروان)/u;
  const publicMourningNotice=/عزای\s+عمومی/u;
  const mourningBereavementVerb=/(?:در\s*پی\s+(?:رحلت|درگذشت|فوت|وفات|شهادت)|رحلت\s+(?:حضرت|آیت\s*الله|مرجع)|درگذشت\s+|فوت\s+)/u;
  const funeralEvent=/(?:مراسم|مجلس)[\s"«»'،:؛-]{0,12}(?:ترحیم|ختم|تشییع|تدفین|خاکسپاری|یادبود|سالگرد|بزرگداشت)|تشییع\s+(?:پیکر|جنازه)|خاکسپاری\s+(?:پیکر|مرحوم|مرحومه)|به\s+خاک\s+سپرده\s+شد|مراسم\s+(?:سوم|هفتم|چهلم|سومین|هفتمین|چهلمین)/u;
  const bereavementContext=/(?:مرحوم|مرحومه|مغفور|مغفوره|شادروان|درگذشت|فوت|رحلت|خانواده\s+داغدار|بازماندگان|روحش\s+شاد)/u;
  const funeralAnnouncementLead=/(?:با\s+(?:نهایت|کمال)\s+تاسف|به\s+اطلاع\s+(?:می\s*رساند|می‌رساند)|ضمن\s+عرض\s+تسلیت|بدین\s+وسیله).{0,180}(?:درگذشت|فوت|مرحوم|مرحومه|رحلت)/u;
  const burialAnnouncement=/(?:به\s+خاک\s+سپرده\s+شد|(?:مراسم|مجلس)[\s"«»'،:؛-]{0,12}تشییع|پیکر\s+.{0,80}\s+(?:تشییع(?:\s+و\s+تدفین)?|خاکسپاری)\s+شد|تشییع\s+و\s+تدفین\s+شد|آیین\s+خاکسپاری|مراسم\s+خاکسپاری|به\s+خاکسپاری\s+رسید)/u;
  if(funeralNoticeTitle.test(title)||burialAnnouncement.test(title)||burialAnnouncement.test(lead)||(publicMourningNotice.test(text)&&mourningBereavementVerb.test(text))||(funeralEvent.test(text)&&bereavementContext.test(text))||funeralAnnouncementLead.test(text))return 'obituary';

  // Explicit advertorial/classified labels are a hard block.
  const explicitAdTitle=/(?:رپورتاژ(?:\s+آگهی)?|آگهی(?:\s*(?:تبلیغاتی|فروش|بازرگانی|استخدام|مناقصه|مزایده))?|محتوای\s+تبلیغاتی|(?:پست|گزارش|محتوا)\s+تبلیغاتی|تبلیغ\s+ویژه|اسپانسر(?:ی)?)/u;
  const explicitAdBody=/(?:رپورتاژ(?:\s+آگهی)?|آگهی\s*(?:تبلیغاتی|فروش|بازرگانی|استخدام|مناقصه|مزایده)|محتوای\s+تبلیغاتی|(?:پست|گزارش|محتوا)\s+تبلیغاتی|محتوای\s+اسپانسری)/u;
  const advertisingService=/(?:پذیرش\s+آگهی|جهت\s+تبلیغ(?:ات)?|برای\s+تبلیغ(?:ات)?|سفارش\s+تبلیغات|تعرفه\s+تبلیغات|محتوای\s+اسپانسری)/u;
  const phoneDetail=/(?:^|\D)(?:0?9\d{9}|0\d{2,3}[-\s]?\d{6,8})(?:\D|$)/u;
  const serviceProvider=/(?:دکتر|پزشک|متخصص|جراح|دندانپزشک|کلینیک|مطب|درمانگاه)/u;
  const bookingOrAddress=/(?:رزرو\s+نوبت|تلفن\s+رزرو|جهت\s+نوبت|نوبت\s*دهی|تعیین\s+وقت|آدرس|نشانی|شماره\s+تماس|ساعات\s+پذیرش)/u;
  if(serviceProvider.test(text)&&bookingOrAddress.test(text)&&(phoneDetail.test(text)||serviceProvider.test(headline))&&!/دانشگاه\s+علوم\s+پزشکی|گزارش\s+داد|به\s+گزارش|گرانی|هزینه\s+درمان/.test(text))return 'advertisement';
  const retailBusiness=/(?:کلوچه\s*سرای|شیرینی\s*سرای|قنادی|فروشگاه|نمایندگی|رستوران|کافه|املاک|گالری\s+(?:مبل|طلا|لباس)|تور\s+گردشگری|آژانس\s+مسافرتی)/u;
  const brandPitch=/(?:طعم\s+اصیل|محبوب|بهترین|کیفیت\s+(?:برتر|عالی)|تجربه(?:‌ای|\s+ای)?\s+متفاوت|معرفی\s+(?:خدمات|محصولات)|خاص‌ترین|بی‌نظیر|تخفیف\s+(?:ویژه|استثنایی)|آفر\s+ویژه|قرعه‌کشی)/u;
  const channelPromo=/(?:لینک\s+(?:عضویت|کانال)|عضویت\s+در\s+(?:کانال|گروه)|دعوت\s+به\s+کانال|پیج\s+اینستاگرام\s+ما)/u;
  if(channelPromo.test(text)&&!hardNewsEvent.test(text))return 'advertisement';
  if(retailBusiness.test(title)&&brandPitch.test(text)&&!hardNewsEvent.test(text))return 'advertisement';
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

  // Generic self-help / how-to advice reads as magazine filler, not local news.
  const adviceTitle=/^(?:چگونه|چطوری|نحوه\s+(?:ایجاد|انجام|کاهش|افزایش|رساندن|نگهداری|درمان)|راهکارهایی?\s+برای|نکاتی?\s+برای|آموزش\s+(?:گام\s+به\s+گام|کامل)|راهنمای\s+(?:کامل|جامع)|توصیه‌هایی?\s+برای|رمز\s+موفقیت|راز\s+(?:موفقیت|آدم\s+های\s+موفق))/u;
  if(adviceTitle.test(title))return 'non-news-advice';

  return '';
}

function isForeignNonLocalStory(c={}){
  const headline=normalizeText((c.title||'')+' '+(c.lead||''));
  const text=normalizeText([c.title,c.lead,c.body].filter(Boolean).join(' ')).slice(0,5000);
  const hasRegionalTie=/(?:ساردو|جیرفت|کرمان|عنبرآباد|عنبر\s*آباد|کهنوج|فاریاب|منوجان|رودبار\s*جنوب|قلعه\s*گنج|جازموریان|رفسنجان|سیرجان|زرند|بافت|بردسیر|ریگان|فهرج|شهربابک|شهر\s*بابک|کوهبنان|نرماشیر|ارزوئیه|راور|ماهان|شهداد|گلباف|هلیل|بحرآسمان|دلفارد|(?<![\u0600-\u06ff])(?:بم|رابر|انار)(?![\u0600-\u06ff]))/u.test(text);
  if(hasRegionalTie)return false;
  const foreignMilitaryOrWire=/(?:پنتاگون|وزارت\s+جنگ\s+آمریکا|ارتش\s+(?:متجاوز\s+)?(?:آمریکا|یمن)|نیروهای\s+آمریکایی|بندر\s+الحدیده|صنعا(?:\s+به\s+ریاض)?|فرودگاه\s+ریاض|ادعای\s+العربیه|العربیه|ناو\s+هواپیمابر\s+آمریکایی|ماکرون|کاخ\s+سفید|ویتکاف|شهپادها|ترامپ|ریاست\s*جمهوری\s+فرانسه|گروسی|شورای\s+امنیت|روبیو|زلنسکی|نتانیاهو|مقام\s+صهیونیست|رژیم\s+صهیونیستی|لبنان|لندن|ترکیه|بحرین|عمان|اکوساید|تنگه\s+هرمز|رسانه‌های\s+جهان|(?:^|[\s،,:«"])یمن(?:$|[\s،,:»"])|برق\s+صدها\s+هزار\s+نفر\s+را\s+در\s+آمریکا|مشکل\s+آمریکا\s+با\s+ایران)/u;
  return foreignMilitaryOrWire.test(headline)||foreignMilitaryOrWire.test(text);
}

module.exports={blockedMonitoredContentReason,isForeignNonLocalStory};
