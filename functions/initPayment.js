// Server-side: initialize Paystack payment (example)
const axios = require('axios')
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY
module.exports = async function handler(req, res){
  try{
    const { amount, email, reference } = req.body
    const resp = await axios.post('https://api.paystack.co/transaction/initialize', {
      amount: Math.round(amount)*100,
      email, reference
    }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }})
    return res.json(resp.data)
  }catch(e){
    console.error(e.response?.data || e.message)
    return res.status(500).json({ error: 'payment_init_failed' })
  }
}
