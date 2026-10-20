import type {Locale} from "@amlaklink/localization";
import {photoRoomTypes,type PhotoDetail} from "@amlaklink/contracts";
export {photoRoomTypes};
export type PhotoRoom=PhotoDetail["room"];

const roomNames:Record<PhotoRoom,Record<Locale,string>>={
 living_room:{en:"Living room",fa:"اتاق نشیمن",ps:"د ناستې خونه"},
 bedroom:{en:"Bedroom",fa:"اتاق خواب",ps:"د خوب خونه"},
 kitchen:{en:"Kitchen",fa:"آشپزخانه",ps:"پخلنځی"},
 bathroom:{en:"Bathroom",fa:"تشناب",ps:"تشناب"},
 exterior:{en:"Exterior",fa:"نمای بیرونی",ps:"بهرنی انځور"},
 entrance:{en:"Entrance",fa:"ورودی",ps:"د ننوتلو ځای"},
 balcony:{en:"Balcony",fa:"بالکن",ps:"بالکون"},
 parking:{en:"Parking",fa:"پارکینگ",ps:"پارکینګ"},
 floor_plan:{en:"Floor plan",fa:"نقشه طبقات",ps:"د پوړ نقشه"},
 land:{en:"Land / plot",fa:"زمین",ps:"ځمکه"},
 other:{en:"Other",fa:"سایر",ps:"نور"}
};
export function roomName(locale:Locale,room:PhotoRoom|"all"){
 return room==="all"?locale==="en"?"All photos":locale==="fa"?"همه عکس‌ها":"ټول انځورونه":roomNames[room][locale];
}
export const mediaCopy={
 en:{cover:"Cover photo",photos:"Property photos",room:"Room / photo category",caption:"Short caption (optional)",
 captionHint:"Do not include phone numbers, personal details or exact private addresses.",choose:"Choose photo category",
 selected:"Selected category",view:"View full photo",close:"Close gallery",count:"photos",noPhotos:"No photos to display",
 details:"Photo details",coverAction:"Make cover",remove:"Remove from listing",upload:"Add photo",
 note:"Photo room labels and captions are reviewed before they appear publicly.",
 all:"All photos",next:"Next photo",previous:"Previous photo",imageUnavailable:"Photo could not load. Tap to retry."},
 fa:{cover:"عکس اصلی",photos:"عکس‌های ملک",room:"اتاق / دسته عکس",caption:"توضیح کوتاه (اختیاری)",
 captionHint:"شماره تماس، معلومات شخصی یا آدرس دقیق خصوصی را ننویسید.",choose:"انتخاب دسته عکس",
 selected:"دسته انتخاب‌شده",view:"نمایش عکس در اندازه بزرگ",close:"بستن گالری",count:"عکس",noPhotos:"عکسی برای نمایش نیست",
 details:"مشخصات عکس",coverAction:"عکس اصلی",remove:"حذف از آگهی",upload:"افزودن عکس",
 note:"دسته‌بندی و توضیحات عکس پیش از نشر بررسی می‌شود.",
 all:"همه عکس‌ها",next:"عکس بعدی",previous:"عکس قبلی",imageUnavailable:"عکس بارگیری نشد؛ برای تلاش دوباره لمس کنید."},
 ps:{cover:"اصلي انځور",photos:"د ملکیت انځورونه",room:"خونه / د انځور ډول",caption:"لنډ معلومات (اختیاري)",
 captionHint:"د اړیکې شمېره، شخصي معلومات یا پټه دقیقه پته مه لیکئ.",choose:"د انځور ډول وټاکئ",
 selected:"غوره شوې ډله",view:"انځور لوی وګورئ",close:"ګالري بنده کړه",count:"انځورونه",noPhotos:"د ښودلو لپاره انځور نشته",
 details:"د انځور معلومات",coverAction:"اصلي انځور کړه",remove:"له اعلان لرې کړه",upload:"انځور اضافه کړه",
 note:"د انځور ډول او معلومات له خپرېدو مخکې ارزول کېږي.",
 all:"ټول انځورونه",next:"بل انځور",previous:"مخکینی انځور",imageUnavailable:"انځور نه پورته کېږي؛ بیا هڅه وکړئ."}
};
