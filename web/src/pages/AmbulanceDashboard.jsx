import React, {useEffect, useState} from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AmbulanceDashboard({user, profile}){
  const [ambulance, setAmbulance] = useState(null)
  const [emergencies, setEmergencies] = useState([])
  const [locPerm, setLocPerm] = useState(null)

  useEffect(()=>{ // load ambulance record by operator_user_id
    supabase.from('ambulances').select('*').eq('operator_user_id', user.id).single().then(r=> setAmbulance(r.data))
    fetchEmergencies()
    const sub = supabase.channel('public:emergency_cases').on('postgres_changes', {event:'INSERT', schema:'public', table:'emergency_cases'}, payload => {
      fetchEmergencies()
    }).subscribe();
    return ()=> supabase.removeChannel(sub)
  },[])

  // get and update our own geo location periodically
  useEffect(()=> {
    let id
    if(navigator.geolocation){
      id = navigator.geolocation.watchPosition(async p => {
        const lat = p.coords.latitude, lon = p.coords.longitude
        setLocPerm({lat,lon})
        // update ambulance location server-side (must be secure in production)
        await supabase.from('ambulances').upsert([{ operator_user_id: user.id, latitude: lat, longitude: lon }], { onConflict: ['operator_user_id'] })
      }, err=> console.warn('geo err', err), { enableHighAccuracy: true, maximumAge: 30000 })
    }
    return ()=> navigator.geolocation.clearWatch && navigator.geolocation.clearWatch(id)
  },[user])

  async function fetchEmergencies(){
    const { data } = await supabase.from('emergency_cases').select('*').eq('status','active')
    setEmergencies(data || [])
  }

  function distanceTo(emLat, emLon){
    if(!locPerm) return null
    const toRad = x=> x*Math.PI/180; const R=6371
    const dLat=toRad(emLat-locPerm.lat), dLon=toRad(emLon-locPerm.lon)
    const a=Math.sin(dLat/2)**2 + Math.cos(toRad(locPerm.lat))*Math.cos(toRad(emLat))*Math.sin(dLon/2)**2
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  async function acceptEmergency(em){
    // assign ambulance (simple upsert)
    await supabase.from('emergency_cases').update({ ambulance_id: ambulance?.id, status: 'assigned' }).eq('id', em.id)
    alert('Assigned to emergency. Update status as you move.')
    fetchEmergencies()
  }

  return (<div>
    <div className='card'>
      <h3>Ambulance Dashboard</h3>
      <p>Operator: {profile.full_name || user.email}</p>
      <p>Your location: {locPerm ? `${locPerm.lat.toFixed(4)}, ${locPerm.lon.toFixed(4)}` : 'Waiting for permission...'}</p>
    </div>
    <div className='card'>
      <h4>Active Emergencies (nearby first)</h4>
      {emergencies.sort((a,b)=> (distanceTo(a.latitude,a.longitude)||999)-(distanceTo(b.latitude,b.longitude)||999)).map(em=> (
        <div key={em.id} style={{marginBottom:10}}>
          <strong>Case:</strong> {em.case_type} — Severity: {em.severity} <br/>
          Location: {em.latitude}, {em.longitude} — Distance: {locPerm ? distanceTo(em.latitude,em.longitude).toFixed(1)+' km' : 'unknown'}
          <div style={{marginTop:6}}>
            <button onClick={()=>acceptEmergency(em)}>Accept & Navigate</button>
          </div>
        </div>
      ))}
    </div>
  </div>)
}
