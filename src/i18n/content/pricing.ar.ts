import {
  AD_LIVE_DAYS,
  AD_POST_PRICE_EGP,
  BALANCE_EXPIRY_DAYS,
  SIGNUP_FREE_ADS,
  EMAIL_VERIFY_BONUS_FREE_AUCTIONS,
  WELCOME_BALANCE_EGP,
  WELCOME_FREE_ADS,
} from "@/constants/adPricing";
import type { PricingContent } from "./pricing.en";

const pricingSharedAr = {
  badge: "قائمة الأسعار",
  title: "أسعار نشر الإعلانات",
  quickRef: "مرجع سريع",
  colItem: "البند",
  colPrice: "السعر",
  colNotes: "ملاحظات",
  howBilling: "كيف يعمل الدفع",
  faqTitle: "أسئلة شائعة",
  postAd: "أضف إعلان",
  createAccount: "إنشاء حساب",
  backHome: "← العودة للرئيسية",
  comingSoon: "قريباً",
  free: "مجاني",
};

export const pricingArLaunch: PricingContent = {
  ...pricingSharedAr,
  badge: "يدي",
  title: "انشر مجاناً",
  howBilling: "معلومات مفيدة",
  intro:
    "كل الإعلانات مجانية حالياً — سعر ثابت أو مزاد، جميع الأقسام. سجّل حساباً، أضف إعلانك، ونراجعه قبل النشر على yaddii.com.",
  plans: [
    {
      id: "launch",
      name: "إعلانات مجانية",
      priceLabel: "مجاني",
      subtitle: "للجميع، بدون خطوة دفع",
      badge: "الآن",
      features: [
        "انشر بعدد الإعلانات الذي تحتاجه",
        "صور وتفاصيل واتصال وواتساب على إعلانك",
        "مراجعة الإدارة قبل ظهور الإعلان",
        `${AD_LIVE_DAYS} يوماً بعد الموافقة — تجديد مجاني من إعلاناتي`,
      ],
    },
  ],
  table: [],
  notes: [
    "لا تُفرض رسوم عند إرسال أو تجديد إعلان طالما النشر مجاني.",
    `بعد الموافقة يبقى إعلانك على السوق ${AD_LIVE_DAYS} يوماً. جدّده من إعلاناتي عند الانتهاء.`,
    "أسئلة؟ راسل support@yaddii.com.",
  ],
  faq: [
    {
      q: "هل النشر مجاني فعلاً؟",
      a: "نعم. لا يوجد دفع أو محفظة عند النشر أو التجديد حالياً.",
    },
    {
      q: "كم يبقى إعلاني نشطاً؟",
      a: `كل إعلان معتمد يظهر ${AD_LIVE_DAYS} يوماً. جدّده من إعلاناتي لـ ${AD_LIVE_DAYS} يوماً إضافية مجاناً.`,
    },
  ],
};

export const pricingArPaid: PricingContent = {
  ...pricingSharedAr,
  intro: `أسعار بسيطة بالجنيه. البائع الجديد يحصل على ${SIGNUP_FREE_ADS} إعلانات مجانية عند التسجيل. تحقق من بريدك لـ ${EMAIL_VERIFY_BONUS_FREE_AUCTIONS} مزادات مجانية. تحقق من هاتفك لـ ${WELCOME_BALANCE_EGP} ج.م. بعد ذلك، الإعلان العادي ${AD_POST_PRICE_EGP} ج.م.`,
  plans: [
    {
      id: "starter",
      name: "إعلان مجاني للبداية",
      priceLabel: "مجاني",
      subtitle: "مضمن مع كل حساب جديد",
      badge: "مستخدمون جدد",
      features: [
        `${SIGNUP_FREE_ADS} إعلانات مجانية عند التسجيل`,
        "جميع الأقسام والأقسام الفرعية",
        `${AD_LIVE_DAYS} يوماً نشطاً بعد الموافقة`,
      ],
    },
    {
      id: "welcome_balance",
      name: "مكافأة التحقق من الهاتف",
      priceLabel: `${WELCOME_BALANCE_EGP} ج.م`,
      subtitle: "تُفتح بعد التحقق من الهاتف",
      badge: "مكافأة",
      features: [
        `${WELCOME_BALANCE_EGP} ج.م تُضاف لمحفظتك`,
        `الرصيد صالح ${BALANCE_EXPIRY_DAYS} يوماً`,
        `يكفي ~${Math.floor(WELCOME_BALANCE_EGP / AD_POST_PRICE_EGP)} إعلانات أو مزادات`,
      ],
    },
    {
      id: "standard",
      name: "إعلان عادي",
      priceLabel: `${AD_POST_PRICE_EGP} ج.م`,
      subtitle: "لكل إعلان بعد استخدام الرصيد المجاني",
      features: [
        "إرسال إعلان واحد (قيد مراجعة الإدارة)",
        "صور متعددة وتفاصيل حسب القسم",
        "اتصال وواتساب على إعلانك",
        `${AD_LIVE_DAYS} يوماً على السوق بعد الموافقة`,
      ],
    },
  ],
  table: [
    { item: "إعلانات مجانية للبداية", price: "مجاني", notes: `${SIGNUP_FREE_ADS} إعلانات عند التسجيل` },
    {
      item: "مكافأة التحقق من البريد",
      price: "مجاني",
      notes: `${EMAIL_VERIFY_BONUS_FREE_AUCTIONS} مزادات مجانية بعد تأكيد البريد`,
    },
    {
      item: "رصيد ترحيب المحفظة",
      price: `${WELCOME_BALANCE_EGP} ج.م`,
      notes: `بعد التحقق من الهاتف (صلاحية ${BALANCE_EXPIRY_DAYS} يوماً)`,
    },
    {
      item: "نشر إعلان عادي",
      price: `${AD_POST_PRICE_EGP} ج.م`,
      notes: `لكل إعلان · ${AD_LIVE_DAYS} يوماً بعد الموافقة`,
    },
    {
      item: "تجديد الإعلان",
      price: `${AD_POST_PRICE_EGP} ج.م`,
      notes: `تمديد إعلان منتهٍ ${AD_LIVE_DAYS} يوماً إضافية (إعلاناتي)`,
    },
    { item: "إعلانات مميزة / معززة", price: "قريباً", notes: "خيارات ظهور أعلى قيد التخطيط" },
  ],
  notes: [
    `تبقى الإعلانات نشطة ${AD_LIVE_DAYS} يوماً بعد موافقة الإدارة، ثم تختفي من البحث حتى التجديد.`,
    "التحقق من البريد يفتح المزادات المجانية.",
    `التحقق من الهاتف يفتح ${WELCOME_BALANCE_EGP} ج.م في المحفظة (${BALANCE_EXPIRY_DAYS} يوماً).`,
    `كل ${WELCOME_FREE_ADS} إعلانات الترحيب المجانية تُمنح عند التسجيل.`,
    `تجديد الإعلان المنتهي بنفس تكلفة إعلان عادي (${AD_POST_PRICE_EGP} ج.م أو إعلان مجاني).`,
    "شحن المحفظة قريباً — تواصل مع الدعم للإضافة اليدوية.",
    "حسابات الإدارة تنشر مجاناً.",
  ],
  faq: [
    {
      q: "كم يبقى إعلاني نشطاً؟",
      a: `كل إعلان معتمد يظهر ${AD_LIVE_DAYS} يوماً. بعدها يختفي من البحث؛ جدّده من إعلاناتي لـ ${AD_LIVE_DAYS} يوماً إضافية.`,
    },
    {
      q: "متى أدفع؟",
      a: "يُخصم من الرصيد المجاني أو المحفظة عند إرسال الإعلان. إذا فشل الإرسال، لا يُخصم شيء.",
    },
    {
      q: "هل أدفع مرة أخرى إذا رُفض إعلاني؟",
      a: "إذا رُفض الإعلان أثناء المراجعة، تواصل مع الدعم — يمكن استرداد الرصيد في الحالات المناسبة.",
    },
    {
      q: "هل يمكن استرداد الرصيد غير المستخدم؟",
      a: "رصيد المحفظة رصيد مسبق الدفع للإعلانات فقط ولا يُسحب نقداً.",
    },
  ],
};

export const pricingAr = pricingArLaunch;
