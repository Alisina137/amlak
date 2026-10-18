import {and,asc,desc,eq,gt,lte} from "drizzle-orm";
import {type Database,schema} from "@amlaklink/database";

export const DAY_MS=86_400_000;
export const RENEWAL_NOTICE_DAYS=[7,3,1] as const;
/** Grace is a service continuity / renewal window, NOT an unverified paid plan extension. */
export const RENEWAL_GRACE_DAYS=3;
type Grant=typeof schema.growthEntitlements.$inferSelect;
export type SubscriptionStatus="free"|"active"|"grace"|"expired";
export type SubscriptionSnapshot={
 plan:string;listingLimit:number;seatLimit:number;expiresAt:Date|null;
 status:SubscriptionStatus;daysRemaining:number|null;previousPlan:string|null;
 lastExpiredAt:Date|null;graceEndsAt:Date|null;graceDaysRemaining:number|null;
 scheduled:{plan:string;startsAt:Date;expiresAt:Date;listingLimit:number;seatLimit:number}|null;
 renewalNeeded:boolean;graceAllowsNewPaidCapacity:false;
};
export function renewalStage(expires:Date,now:Date):"seven_days"|"three_days"|"one_day"|"grace_started"|"grace_ending"|"expired"|null{
 const diff=expires.getTime()-now.getTime();
 if(diff>7*DAY_MS)return null;
 if(diff>3*DAY_MS)return "seven_days";
 if(diff>DAY_MS)return "three_days";
 if(diff>0)return "one_day";
 if(diff>-(RENEWAL_GRACE_DAYS-1)*DAY_MS)return "grace_started";
 if(diff>-RENEWAL_GRACE_DAYS*DAY_MS)return "grace_ending";
 return "expired";
}
export function describeSubscription(grants:Grant[],scope:"agency"|"solo",now=new Date()):SubscriptionSnapshot{
 const active=grants.filter(x=>x.startsAt<=now&&x.expiresAt>now)
  .sort((a,b)=>b.listingLimit-a.listingLimit||b.expiresAt.getTime()-a.expiresAt.getTime())[0];
 const prior=grants.filter(x=>x.expiresAt<=now)
  .sort((a,b)=>b.expiresAt.getTime()-a.expiresAt.getTime())[0];
 const future=grants.filter(x=>x.startsAt>now).sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime())[0];
 const last=prior||null;
 const graceEndsAt=last?new Date(last.expiresAt.getTime()+RENEWAL_GRACE_DAYS*DAY_MS):null;
 const state:SubscriptionStatus=active?"active":last?(graceEndsAt&&now<graceEndsAt?"grace":"expired"):"free";
 const next=future?{plan:future.planCode,startsAt:future.startsAt,expiresAt:future.expiresAt,
  listingLimit:future.listingLimit,seatLimit:future.seatLimit}:null;
 return {plan:active?.planCode||"free",listingLimit:active?.listingLimit||3,
  seatLimit:active?.seatLimit||(scope==="agency"?3:1),expiresAt:active?.expiresAt||null,
  status:state,
  daysRemaining:active?Math.max(1,Math.ceil((active.expiresAt.getTime()-now.getTime())/DAY_MS)):null,
  previousPlan:last?.planCode||null,lastExpiredAt:last?.expiresAt||null,
  graceEndsAt:state==="grace"?graceEndsAt:null,
  graceDaysRemaining:state==="grace"&&graceEndsAt?Math.max(1,Math.ceil((graceEndsAt.getTime()-now.getTime())/DAY_MS)):null,
  scheduled:next,
  // Only surface a renewal CTA for a subscription already ending within seven days, or an expired plan.
  renewalNeeded:!next&&((state==="active"&&active.expiresAt.getTime()-now.getTime()<=7*DAY_MS)
    ||state==="grace"||state==="expired"),graceAllowsNewPaidCapacity:false};
}
export async function readSubscription(db:Database,scope:{agencyId:string}|{userId:string},now=new Date()){
 const clause="agencyId" in scope?eq(schema.growthEntitlements.agencyId,scope.agencyId):
  eq(schema.growthEntitlements.userId,scope.userId);
 const grants=await db.select().from(schema.growthEntitlements).where(clause)
  .orderBy(desc(schema.growthEntitlements.expiresAt)).limit(100);
 return describeSubscription(grants,"agencyId" in scope?"agency":"solo",now);
}
export function subscriptionNotice(locale:string,stage:NonNullable<ReturnType<typeof renewalStage>>,planCode:string){
 const name=planCode.replaceAll("_"," ");
 const text={
  seven_days:{en:`Your ${name} plan expires in 7 days. Review renewal options.`,fa:`اشتراک ${name} شما تا ۷ روز دیگر پایان می‌یابد. گزینه‌های تمدید را ببینید.`,ps:`ستاسو ${name} پلان په ۷ ورځو کې پای ته رسېږي. د نوي کولو لارې وګورئ.`},
  three_days:{en:`Your ${name} plan expires in 3 days.`,fa:`اشتراک ${name} شما تا ۳ روز دیگر پایان می‌یابد.`,ps:`ستاسو ${name} پلان په ۳ ورځو کې پای ته رسېږي.`},
  one_day:{en:`Your ${name} plan expires within 24 hours.`,fa:`اشتراک ${name} شما تا ۲۴ ساعت دیگر پایان می‌یابد.`,ps:`ستاسو ${name} پلان په ۲۴ ساعتونو کې پای ته رسېږي.`},
  grace_started:{en:"Your plan expired. A 3-day renewal window has started; free limits apply.",fa:"اشتراک شما پایان یافته است. فرصت ۳ روزه تمدید آغاز شد؛ محدودیت رایگان اجرا می‌شود.",ps:"ستاسو پلان پای ته ورسېد. د نوي کولو ۳ ورځنۍ موده پیل شوه؛ وړیا محدودیتونه پلي دي."},
  grace_ending:{en:"Your renewal window ends within 24 hours. Free limits remain in effect.",fa:"فرصت تمدید شما تا ۲۴ ساعت دیگر پایان می‌یابد. محدودیت رایگان پابرجاست.",ps:"ستاسو د نوي کولو موده په ۲۴ ساعتونو کې ختمېږي. وړیا محدودیتونه دوام لري."},
  expired:{en:"Your renewal window ended. Existing listings and conversations are preserved; free limits apply.",fa:"فرصت تمدید پایان یافت. آگهی‌ها و گفتگوهای قبلی محفوظ‌اند؛ محدودیت رایگان اجرا می‌شود.",ps:"د نوي کولو موده پای ته ورسېده. پخواني اعلانونه او خبرې خوندي دي؛ وړیا محدودیتونه پلي دي."}
 };
 const k=locale==="ps"?"ps":locale==="en"?"en":"fa";
 return text[stage][k].slice(0,160);
}
