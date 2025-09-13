import React, {useEffect, useState} from 'react'
import { supabase } from './lib/supabaseClient'
import Auth from './pages/Auth'
import PatientDashboard from './pages/PatientDashboard'
import AmbulanceDashboard from './pages/AmbulanceDashboard'

export default function App(){
  const [user, setUser] = useState(null)
  useEffect(()=> {
    const s = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    // initial
    setUser(supabase.auth.getUser ? (async ()=>{ const r=await supabase.auth.getUser(); return r.data.user })() : null)
    return ()=> s?.subscription?.unsubscribe && s.subscription.unsubscribe()
  },[])

  if(!user) return <Auth />
  // rudimentary role detection via profile lookup
  const [profile, setProfile] = useState(null)
  useEffect(()=>{ if(user) supabase.from('profiles').select('*').eq('user_id', user.id).single().then(r=> setProfile(r.data)) },[user])
  if(!profile) return <div className='card'>Loading profile...</div>
  if(profile.role === 'ambulance') return <AmbulanceDashboard user={user} profile={profile} />
  return <PatientDashboard user={user} profile={profile} />
}
