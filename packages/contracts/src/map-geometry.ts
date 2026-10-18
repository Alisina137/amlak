/** Map search geometry only. No geocoding, customer address data, or tile provider access. */
export type GeoPoint={latitude:number;longitude:number};
const bounds=(p:GeoPoint)=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&
 p.latitude>=29&&p.latitude<=39&&p.longitude>=60&&p.longitude<=75;
const orientation=(a:GeoPoint,b:GeoPoint,c:GeoPoint)=>
 (b.longitude-a.longitude)*(c.latitude-a.latitude)-
 (b.latitude-a.latitude)*(c.longitude-a.longitude);
const onSegment=(a:GeoPoint,b:GeoPoint,p:GeoPoint)=>Math.min(a.longitude,b.longitude)<=p.longitude&&
 p.longitude<=Math.max(a.longitude,b.longitude)&&Math.min(a.latitude,b.latitude)<=p.latitude&&
 p.latitude<=Math.max(a.latitude,b.latitude);
function intersects(a:GeoPoint,b:GeoPoint,c:GeoPoint,d:GeoPoint){
 const abC=orientation(a,b,c),abD=orientation(a,b,d),cdA=orientation(c,d,a),cdB=orientation(c,d,b);
 if((abC>0)!==(abD>0)&&(cdA>0)!==(cdB>0)&&abC!==0&&abD!==0&&cdA!==0&&cdB!==0)return true;
 return (abC===0&&onSegment(a,b,c))||(abD===0&&onSegment(a,b,d))||
  (cdA===0&&onSegment(c,d,a))||(cdB===0&&onSegment(c,d,b));
}
export function validatePolygon(points:GeoPoint[]):GeoPoint[]{
 if(points.length<3||points.length>12)throw Error("INVALID_MAP_POLYGON");
 if(points.some(p=>!bounds(p)))throw Error("INVALID_MAP_POLYGON");
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];
  if(Math.abs(a.latitude-b.latitude)+Math.abs(a.longitude-b.longitude)<0.000001)
   throw Error("INVALID_MAP_POLYGON");
  for(let j=i+1;j<points.length;j++){
   if(j===i+1||(i===0&&j===points.length-1))continue;
   if(intersects(a,b,points[j],points[(j+1)%points.length]))
    throw Error("INVALID_MAP_POLYGON");
  }
 }
 const sum=points.reduce((area,p,i)=>{
  const n=points[(i+1)%points.length];
  return area+p.longitude*n.latitude-n.longitude*p.latitude;
 },0);
 if(Math.abs(sum)/2<0.00000001)throw Error("INVALID_MAP_POLYGON");
 return points;
}
export function parsePolygon(value:string):GeoPoint[]{
 if(value.length>400||!/^[-0-9.,;]+$/.test(value))throw Error("INVALID_MAP_POLYGON");
 const points=value.split(";").map(pair=>{
  const parts=pair.split(",");
  if(parts.length!==2||parts.some(n=>!n||!/^-?\d+(?:\.\d{1,6})?$/.test(n)))
   throw Error("INVALID_MAP_POLYGON");
  return {latitude:Number(parts[0]),longitude:Number(parts[1])};
 });
 return validatePolygon(points);
}
export function serializePolygon(points:GeoPoint[]):string{
 return validatePolygon(points).map(p=>p.latitude.toFixed(6)+","+p.longitude.toFixed(6)).join(";");
}
/** SQL polygon text uses x=longitude, y=latitude (NOT client lat,lng order). */
export function postgresPolygon(points:GeoPoint[]):string{
 return "("+validatePolygon(points).map(p=>"("+p.longitude+","+p.latitude+")").join(",")+")";
}
