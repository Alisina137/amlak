import { z } from "zod";
export const localeSchema = z.enum(["fa","ps","en"]);
export const provinceSchema = z.object({
 id:z.string().min(1),
 names:z.object({en:z.string().min(1),fa:z.string().min(1),ps:z.string().min(1)}),
 aliases:z.array(z.string()).optional(),
});
export const provinceQuerySchema = z.object({
 q:z.string().trim().max(100).optional().default(""),
 locale:localeSchema.optional().default("fa"),
});
export const provinceListSchema=z.object({
 country:z.literal("AF"),
 defaultProvinceId:z.literal("kabul"),
 items:z.array(provinceSchema),
 count:z.number().int().nonnegative(),
});
export const healthSchema = z.object({ status:z.literal("ok"), service:z.literal("amlaklink-api") });
export const apiErrorSchema = z.object({ error:z.string(), requestId:z.string().optional() });
export type ProvinceDTO=z.infer<typeof provinceSchema>;
export type ProvinceListDTO=z.infer<typeof provinceListSchema>;
