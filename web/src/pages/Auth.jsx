import React, {useState} from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth(){
  const [email,setEmail]=useState(''), [password,setPassword]=useState(''), [role,setRole]=useState('patient')
  async function signUp(){
    const { data, error } = await supabase.auth.signUp({ email, password }, { data: { role } })
    if(error) return alert(error.message)
    alert('Check your email for confirmation. Then complete your profile.')
  }
  async function signIn(){
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) return alert(error.message)
  }
  return (<div className='card'>
    <h3>Veed-Co Smart Health — Auth</h3>
    <input placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} />
    <input placeholder='Password' type='password' value={password} onChange={e=>setPassword(e.target.value)} />
    <select value={role} onChange={e=>setRole(e.target.value)}>
      <option value='patient'>Patient</option>
      <option value='ambulance'>Ambulance Operator</option>
      <option value='hospital_admin'>Hospital Admin</option>
    </select>
    <div style={{display:'flex',gap:8}}>
      <button onClick={signUp}>Sign up</button>
      <button onClick={signIn}>Sign in</button>
    </div>
  </div>)
}
