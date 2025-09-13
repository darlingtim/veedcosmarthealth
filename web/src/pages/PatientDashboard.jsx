import React, {useEffect, useState} from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PatientDashboard({user, profile}){
  const [hospitals, setHospitals] = useState([])
  const [loc, setLoc] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(()=>{ // fetch hospitals
    supabase.from('hospitals').select('*').then(r=> setHospitals(r.data || []))
    if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(p=> setLoc({lat:p.coords.latitude, lon:p.coords.longitude}), ()=>null) }
  },[])

  function haversine(lat1, lon1, lat2, lon2){
    const toRad = x=> x*Math.PI/180; const R=6371;
    const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1)
    const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  const nearest = loc ? hospitals.map(h=> ({...h, distance: haversine(loc.lat, loc.lon, parseFloat(h.latitude||0), parseFloat(h.longitude||0))})).sort((a,b)=>a.distance-b.distance) : hospitals

  async function createEmergency(hospitalId, severity='critical'){
    if(!loc) return alert('Allow location or enter manually')
    setCreating(true)
    const { data, error } = await supabase.from('emergency_cases').insert([{
      patient_user_id: user.id,
      hospital_id: hospitalId,
      case_type: 'direct_emergency',
      severity,
      latitude: loc.lat,
      longitude: loc.lon,
      status: 'active'
    }])
    setCreating(false)
    if(error) return alert(error.message)
    alert('Emergency created. Ambulances will be notified.')
  }

  return (<div>
    <div className='card'>
      <h3>Welcome, {profile.full_name || user.email}</h3>
      <p>Your role: {profile.role}</p>
    </div>
    <div className='card'>
      <h4>Nearby Hospitals</h4>
      {nearest.map(h=> (<div key={h.id} style={{marginBottom:8}}>
        <strong>{h.name}</strong> — {h.city} — Beds: {h.available_beds}/{h.total_beds} {h.distance && <span> — {h.distance.toFixed(1)} km</span>}
        <div style={{marginTop:6}}>
          <button onClick={()=>createEmergency(h.id)} disabled={creating}>Send Emergency (share location)</button>
        </div>
      </div>))}
    </div>
  </div>)
}
