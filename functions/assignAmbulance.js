// Simple server-side logic to find nearest available ambulance and assign
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

module.exports = async function handler(req, res){
  try{
    const { emergency_id } = req.body
    // fetch emergency
    const { data: em } = await supabase.from('emergency_cases').select('*').eq('id', emergency_id).single()
    if(!em) return res.status(404).json({ error: 'not found' })
    // fetch available ambulances
    const { data: ambs } = await supabase.from('ambulances').select('*').eq('is_available', true)
    if(!ambs || ambs.length === 0) return res.status(404).json({ error: 'no ambulances' })
    // find nearest (basic)
    function dist(lat1,lon1,lat2,lon2){ const toRad=x=>x*Math.PI/180; const R=6371; const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1); const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2; return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) }
    let best = null; let bestD = 1e9
    for(const a of ambs){ if(a.latitude==null||a.longitude==null) continue; const d=dist(parseFloat(em.latitude),parseFloat(em.longitude),parseFloat(a.latitude),parseFloat(a.longitude)); if(d<bestD){ bestD=d; best=a } }
    if(!best) return res.status(404).json({ error: 'no geolocated ambulances' })
    // assign
    await supabase.from('emergency_cases').update({ ambulance_id: best.id, status: 'assigned' }).eq('id', emergency_id)
    // mark ambulance not available
    await supabase.from('ambulances').update({ is_available: false }).eq('id', best.id)
    return res.json({ ok: true, ambulance: best })
  }catch(e){
    console.error(e); return res.status(500).json({ error: e.message })
  }
}
