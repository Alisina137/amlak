/** Reference geographic catalog. Administrative boundaries / lower levels are separate future data. */
export type CatalogLocale = "fa" | "ps" | "en";
export type Province = Readonly<{ id: string; names: Readonly<Record<CatalogLocale, string>>; aliases?: readonly string[] }>;
const raw: readonly [string, string, string, string, string?][] = [
  ["badakhshan","Badakhshan","بدخشان","بدخشان"],
  ["badghis","Badghis","بادغیس","بادغیس"],
  ["baghlan","Baghlan","بغلان","بغلان"],
  ["balkh","Balkh","بلخ","بلخ"],
  ["bamyan","Bamyan","بامیان","بامیان","Bamian"],
  ["daykundi","Daykundi","دایکندی","دایکنډي","Daikundi"],
  ["farah","Farah","فراه","فراه"],
  ["faryab","Faryab","فاریاب","فاریاب"],
  ["ghazni","Ghazni","غزنی","غزني"],
  ["ghor","Ghor","غور","غور"],
  ["helmand","Helmand","هلمند","هلمند"],
  ["herat","Herat","هرات","هرات"],
  ["jowzjan","Jowzjan","جوزجان","جوزجان","Jawzjan"],
  ["kabul","Kabul","کابل","کابل"],
  ["kandahar","Kandahar","کندهار","کندهار","Qandahar"],
  ["kapisa","Kapisa","کاپیسا","کاپیسا"],
  ["khost","Khost","خوست","خوست"],
  ["kunar","Kunar","کنر","کونړ","Konar"],
  ["kunduz","Kunduz","کندز","کندوز","Kondoz"],
  ["laghman","Laghman","لغمان","لغمان"],
  ["logar","Logar","لوگر","لوګر"],
  ["nangarhar","Nangarhar","ننگرهار","ننګرهار"],
  ["nimruz","Nimruz","نیمروز","نیمروز"],
  ["nuristan","Nuristan","نورستان","نورستان"],
  ["paktia","Paktia","پکتیا","پکتیا","Paktya"],
  ["paktika","Paktika","پکتیکا","پکتیکا"],
  ["panjshir","Panjshir","پنجشیر","پنجشېر","Panjsher"],
  ["parwan","Parwan","پروان","پروان"],
  ["samangan","Samangan","سمنگان","سمنګان"],
  ["sar-e-pol","Sar-e Pol","سرپل","سرپل","Sar-e Pul"],
  ["takhar","Takhar","تخار","تخار"],
  ["urozgan","Urozgan","ارزگان","روزګان","Uruzgan"],
  ["wardak","Wardak","میدان وردک","میدان وردګ","Maidan Wardak"],
  ["zabul","Zabul","زابل","زابل"],
];
export const provinces: readonly Province[] = Object.freeze(raw.map(([id,en,fa,ps,alias]) =>
  Object.freeze({ id, names: Object.freeze({ en, fa, ps }), ...(alias ? {aliases: [alias]} : {}) })
));
/** Arabic/Persian character variants and common combining marks must not fragment search. */
export function normalizeLocation(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase()
    .replace(/[يى]/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670\u200C\u200D]/g, "")
    .replace(/[-_\s]+/g, " ").trim();
}
export function searchProvinces(query: string, locale: CatalogLocale = "fa"): Province[] {
  const term = normalizeLocation(query);
  return provinces
    .filter(p => !term || [p.id, ...Object.values(p.names), ...(p.aliases ?? [])]
      .some(name => normalizeLocation(name).includes(term)))
    .sort((a,b) => a.names[locale].localeCompare(b.names[locale], locale === "en" ? "en" : "fa"));
}
export const findProvince = (id: string): Province | undefined => provinces.find(p => p.id === id);
export const DEFAULT_PROVINCE_ID = "kabul";
export const COUNTRY_CODE = "AF" as const;
