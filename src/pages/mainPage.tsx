import Statistics from "./admin/Statistics"
import { useState, useEffect } from "react"
import StatisticsForSuperAdmin from "./admin/statisticsforSuperadmin"
import { StatistiqueForDirecteur } from "./director/statistiqueForDirecteur"

export default function MainPage() {

 const [role, setRole] = useState<string>("")

 useEffect(() => {
   const role = localStorage.getItem("role")
   if (role) {
     setRole(`${role}`)
   }
 }, [])

 if(role.length < 1 ) {
  return null;
 }

  return (
    <>
    {
      role === "Directeur" ? <StatistiqueForDirecteur/> : role === "Admin" ? <Statistics/> : role === "SuperAdmin" ? <StatisticsForSuperAdmin/> : role === "Invite" ? <Statistics/> : null
    }
    </>
  )
}