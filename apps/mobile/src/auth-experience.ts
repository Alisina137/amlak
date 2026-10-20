import type {Locale} from "@amlaklink/localization";
const en={
 step:"Account access",show:"Show password",hide:"Hide password",passwordHint:"At least 10 characters, with a letter and a number.",
 invalidEmail:"Enter a valid email address.",invalidPassword:"Use 10–128 characters with at least one letter and one number.",
 invalidName:"Enter a name between 2 and 120 characters.",invalidCode:"Enter the 6-digit verification code.",
 submitting:"Checking…",resendWait:"Resend available soon",emailHelp:"We'll send a verification or recovery code to your email.",
 verifyHelp:"Enter the six-digit code sent to your email. Do not share this code.",
 recoverHelp:"If your email is registered, a reset code will be sent. Check spam if necessary.",
 resetHelp:"Set a new password and enter your recovery code.",
 resend:"Resend code",timeout:"Request failed or connection lost. Check your inbox before retrying.",
 strong:"Password requirements met",required:"Fill out the required fields.",signup:"1. Create account  →  2. Verify email",
 login:"Sign in with your verified email",otp:"6-digit code",disabled:"Complete the form to continue.",
 continue:"Continue",retry:"Try again",failed:"Unable to complete the request. Check your details.",success:"Changes saved.",
 noAccount:"Create an account",existing:"Sign in instead"
};
type Key=keyof typeof en;
const fa:Record<Key,string>={
 step:"دسترسی به حساب",show:"نمایش رمز",hide:"پنهان‌کردن رمز",passwordHint:"حداقل ۱۰ حرف شامل حروف و اعداد.",
 invalidEmail:"یک ایمیل معتبر وارد کنید.",invalidPassword:"رمز باید ۱۰ تا ۱۲۸ حرف و شامل حرف و عدد باشد.",
 invalidName:"نام باید بین ۲ تا ۱۲۰ حرف باشد.",invalidCode:"کد شش‌رقمی ایمیل را وارد کنید.",
 submitting:"در حال بررسی…",resendWait:"ارسال مجدد به‌زودی فعال می‌شود",emailHelp:"کد تأیید یا بازیابی به ایمیل شما فرستاده می‌شود.",
 verifyHelp:"کد شش‌رقمی ایمیل را وارد کنید. کد را با دیگران شریک نکنید.",
 recoverHelp:"اگر ایمیل حساب وجود داشته باشد، کد بازیابی ارسال می‌شود؛ اسپم را نیز ببینید.",
 resetHelp:"رمز جدید را با کد بازیابی وارد کنید.",
 resend:"ارسال مجدد کد",timeout:"اتصال قطع شد؛ پیش از تلاش دوباره ایمیل را بررسی کنید.",
 strong:"رمز شرایط لازم را دارد",required:"بخش‌های لازم را کامل کنید.",signup:"۱. ثبت حساب ← ۲. تأیید ایمیل",
 login:"با ایمیل تأییدشده وارد شوید",otp:"کد شش‌رقمی",disabled:"برای ادامه فرم را کامل کنید.",
 continue:"ادامه",retry:"تلاش دوباره",failed:"درخواست انجام نشد؛ معلومات را بررسی کنید.",success:"تغییرات ذخیره شد.",
 noAccount:"ساخت حساب جدید",existing:"حساب دارم؛ ورود"
};
const ps:Record<Key,string>={
 step:"حساب ته لاسرسی",show:"پټنوم ښکاره کړه",hide:"پټنوم پټ کړه",passwordHint:"لږ تر لږه ۱۰ توري، یو حرف او یوه شمېره.",
 invalidEmail:"سم ایمیل ولیکئ.",invalidPassword:"پټنوم باید ۱۰–۱۲۸ توري، حرف او شمېره ولري.",
 invalidName:"نوم باید ۲–۱۲۰ توري وي.",invalidCode:"شپږ رقمي ایمیل کوډ ولیکئ.",
 submitting:"کتل کېږي…",resendWait:"کوډ به لږ وروسته بیا ولېږل شي",emailHelp:"د تایید یا بیا ترلاسه کولو کوډ ایمیل ته استوو.",
 verifyHelp:"د ایمیل شپږ رقمي کوډ ولیکئ؛ له نورو سره یې مه شریکوئ.",
 recoverHelp:"که ایمیل ثبت وي، د بیا ترلاسه کولو کوډ استول کېږي؛ سپام هم وګورئ.",
 resetHelp:"نوی پټنوم او د بیا ترلاسه کولو کوډ ولیکئ.",
 resend:"کوډ بیا ولېږئ",timeout:"اړیکه بنده شوه؛ تر بیا هڅې مخکې ایمیل وګورئ.",
 strong:"پټنوم شرایط پوره کوي",required:"اړینې برخې بشپړې کړئ.",signup:"۱. حساب جوړول ← ۲. ایمیل تایید",
 login:"له تایید شوي ایمیل سره ننوځئ",otp:"شپږ رقمي کوډ",disabled:"د دوام لپاره فورمه بشپړه کړئ.",
 continue:"دوام",retry:"بیا هڅه",failed:"غوښتنه بشپړه نه شوه؛ معلومات وګورئ.",success:"بدلونونه خوندي شول.",
 noAccount:"نوی حساب جوړ کړه",existing:"حساب لرم؛ ننوځئ"
};
export const au=(locale:Locale,key:Key)=>({en,fa,ps})[locale][key];
export function validEmail(value:string){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())&&value.trim().length<=254;}
export function validPassword(value:string){return value.length>=10&&value.length<=128&&/[a-zA-Z]/.test(value)&&/[0-9]/.test(value);}
