import {z} from "zod";
import {findProvince} from "@amlaklink/catalog";
export const propertyTypes=["house","apartment","land","shop","office","commercial"] as const;
export const transactionTypes=["sale","rent","gharawi"] as const;
export const currencyTypes=["AFN","USD"] as const;
export const photoId=z.uuid();
const optionalShort=z.string().trim().max(140);
const optionalText=z.string().trim().max(3500);
export const listingDraftSchema=z.object({
 title:optionalShort.default(""),
 description:optionalText.default(""),
 propertyType:z.enum(propertyTypes).default("house"),
 transactionType:z.enum(transactionTypes).default("sale"),
 location:z.object({
  provinceId:z.string().max(50).default("kabul"),
  city:z.string().trim().max(100).default(""),
  district:z.string().trim().max(100).default(""),
  neighborhood:z.string().trim().max(120).default(""),
  streetAddress:z.string().trim().max(200).optional(),
  precision:z.enum(["approximate","exact"]).default("approximate"),
  latitude:z.number().min(-90).max(90).optional(),
  longitude:z.number().min(-180).max(180).optional(),
 }).strict().prefault({}),
 attributes:z.object({
  areaM2:z.number().nonnegative().max(100_000_000).default(0),
  bedrooms:z.number().int().min(0).max(99).optional(),
  bathrooms:z.number().int().min(0).max(99).optional(),
  floor:z.number().int().min(-5).max(200).optional(),
  totalFloors:z.number().int().min(0).max(200).optional(),
  landFrontageM:z.number().positive().max(100000).optional(),
  condition:z.enum(["new","good","needs_work"]).optional(),
  furnished:z.boolean().optional(),
  parking:z.boolean().optional(),
  water:z.boolean().optional(),
  electricity:z.boolean().optional(),
 }).strict().prefault({}),
 price:z.object({
  currency:z.enum(currencyTypes).default("AFN"),
  askingPrice:z.number().positive().max(1e15).optional(),
  monthlyRent:z.number().nonnegative().max(1e15).optional(),
  refundableDeposit:z.number().nonnegative().max(1e15).optional(),
  refundablePrincipal:z.number().positive().max(1e15).optional(),
  maintenanceMonthly:z.number().nonnegative().max(1e15).optional(),
  durationMonths:z.number().int().positive().max(1200).optional(),
  refundTerms:z.string().trim().max(2000).optional(),
  negotiable:z.boolean().default(false)
 }).strict().prefault({}),
 photoIds:z.array(photoId).max(20).default([]),
 contact:z.object({
  phone:z.string().trim().regex(/^\+?[0-9]{7,16}$/).optional(),
  allowPhone:z.boolean().default(false),
  whatsapp:z.string().trim().regex(/^\+?[0-9]{7,16}$/).optional(),
  allowWhatsApp:z.boolean().default(false),
 }).strict().prefault({}),
}).strict();
export type ListingDraft=z.infer<typeof listingDraftSchema>;
export const listingSubmissionSchema=listingDraftSchema.superRefine((v,ctx)=>{
 const bad=(path:(string|number)[],message:string)=>ctx.addIssue({code:"custom",path,message});
 if(v.title.length<8)bad(["title"],"Title must contain at least 8 characters");
 if(v.description.length<25)bad(["description"],"Description must contain at least 25 characters");
 if(!findProvince(v.location.provinceId))bad(["location","provinceId"],"Invalid Afghanistan province");
 if(v.location.city.length<2 || v.location.district.length<2)bad(["location"],"City and district are required");
 if(v.location.precision==="exact" && ((v.location.latitude===undefined)!==(v.location.longitude===undefined)))
  bad(["location"],"Both coordinates must be supplied together");
 if(v.attributes.areaM2<=0)bad(["attributes","areaM2"],"Area must be greater than zero");
 if(v.propertyType==="land" && v.attributes.bedrooms!==undefined)
  bad(["attributes","bedrooms"],"Land does not have bedrooms");
 if(v.propertyType==="apartment" && v.attributes.floor!==undefined && v.attributes.totalFloors!==undefined && v.attributes.floor>v.attributes.totalFloors)
  bad(["attributes","floor"],"Floor cannot exceed total floors");
 if(v.transactionType==="sale"){
  if(v.price.askingPrice===undefined)bad(["price","askingPrice"],"Sale price required");
 }else if(v.transactionType==="rent"){
  if(v.price.monthlyRent===undefined)bad(["price","monthlyRent"],"Monthly rent required (zero is allowed)");
  if(v.price.refundableDeposit===undefined)bad(["price","refundableDeposit"],"Advance/deposit must be explicit, including zero");
 }else{
  if(v.price.refundablePrincipal===undefined)bad(["price","refundablePrincipal"],"Refundable gharawi principal required");
  if(v.price.monthlyRent===undefined)bad(["price","monthlyRent"],"Additional monthly rent must be explicit, including zero");
  if(v.price.durationMonths===undefined)bad(["price","durationMonths"],"Duration required");
  if(!v.price.refundTerms || v.price.refundTerms.length<12)bad(["price","refundTerms"],"Gharawi refund terms required");
 }
 if(v.photoIds.length<1)bad(["photoIds"],"At least one validated property photo is required");
 if(!v.contact.allowPhone && !v.contact.allowWhatsApp)bad(["contact"],"Enable at least one contact method");
 if(v.contact.allowPhone && !v.contact.phone)bad(["contact","phone"],"Call number required");
 if(v.contact.allowWhatsApp && !v.contact.whatsapp)bad(["contact","whatsapp"],"WhatsApp number required");
});
export type ListingSubmission=z.infer<typeof listingSubmissionSchema>;
export function publicListingPayload(data:ListingDraft):ListingDraft {
 const stripped=listingDraftSchema.parse(data);
 return {...stripped,
  location:{...stripped.location,
   streetAddress:undefined,
   ...(stripped.location.precision==="approximate"?{latitude:undefined,longitude:undefined}:{})},
  contact:{...stripped.contact,phone:undefined,whatsapp:undefined}
 };
}
export const createListingSchema=z.object({
 clientRequestId:z.uuid(),
 publisher:z.enum(["private","independent_agent","agency"]).default("private"),
 agencyId:z.uuid().optional(),
 propertyType:z.enum(propertyTypes),
 transactionType:z.enum(transactionTypes),
}).strict();
export const saveDraftSchema=z.object({
 expectedVersion:z.number().int().positive(),
 data:listingDraftSchema
}).strict();
export const listingSubmitSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const reviewDecisionSchema=z.object({
 revisionId:z.uuid(),decision:z.enum(["approve","reject"]),
 reason:z.string().trim().min(8).max(500),
}).strict();
export const listingStatusSchema=z.enum(["draft","pending_review","published","paused","sold","rented","rejected","archived"]);
