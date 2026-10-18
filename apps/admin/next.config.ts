import type {NextConfig} from "next";
const config:NextConfig={reactStrictMode:true,transpilePackages:["@amlaklink/localization","@amlaklink/design-tokens"],
 async headers(){return [{source:"/:path*",headers:[{key:"X-Frame-Options",value:"DENY"}]}];}
};
export default config;
