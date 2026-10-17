import {NextResponse} from "next/server";
import {COOKIE,API,safeOrigin,staffToken} from "../../../../lib/staff";
export async function POST(request:Request){
 if(!safeOrigin(request))return NextResponse.json({error:"CROSS_SITE_REQUEST"},{status:403});
 const token=await staffToken();
 if(token)await fetch(API+"/v1/staff/auth/logout",{method:"POST",headers:{Authorization:"Bearer "+token}}).catch(()=>{});
 const response=NextResponse.json({success:true});
 response.cookies.delete(COOKIE);
 return response;
}
