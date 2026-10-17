"use client";
export function LogoutButton(){
 return <button className="admin-button" onClick={async()=>{await fetch("/api/staff/logout",{method:"POST"}).catch(()=>{});window.location.replace("/admin/login");}}>خروج امن</button>;
}
