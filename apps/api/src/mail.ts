import nodemailer from "nodemailer";
export type SendCode=(email:string,purpose:"verify"|"recover",code:string)=>Promise<void>;
export const sendCode:SendCode=async(email,purpose,code)=>{
 if(process.env.NODE_ENV!=="production" && process.env.AUTH_DEV_PRINT_CODES==="true"){
   console.log("[development email verification] recipient:",email,"purpose:",purpose,"code:",code);
   return;
 }
 const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASSWORD,SMTP_FROM}=process.env;
 if(!SMTP_HOST||!SMTP_PORT||!SMTP_USER||!SMTP_PASSWORD||!SMTP_FROM)
   throw new Error("Email verification transport not configured. Set SMTP_* or explicit dev-only AUTH_DEV_PRINT_CODES.");
 const transport=nodemailer.createTransport({host:SMTP_HOST,port:Number(SMTP_PORT),secure:Number(SMTP_PORT)===465,auth:{user:SMTP_USER,pass:SMTP_PASSWORD}});
 const subject=purpose==="verify"?"AmlakLink email verification":"AmlakLink password recovery";
 await transport.sendMail({from:SMTP_FROM,to:email,subject,text:"Your AmlakLink "+(purpose==="verify"?"email verification":"password recovery")+" code is "+code+". It expires in 10 minutes. Do not share this code."});
};
