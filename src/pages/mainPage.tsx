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
 }, [role])

 if(role.length < 1 ) {
  return;
 }

  return (
    <>
    {
      role === "Directeur" ? <StatistiqueForDirecteur/> : role === "Admin" ? <Statistics/> : <StatisticsForSuperAdmin/>
    }
    </>
  )
}