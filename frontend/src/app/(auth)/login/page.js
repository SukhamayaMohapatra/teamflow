'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Box,Paper,Typography,TextField,Button,Stack,Alert} from '@mui/material';
import api from '../../../lib/api';
export default function LoginPage(){
 const router=useRouter(); const [form,setForm]=useState({email:'',password:''}); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 const change=e=>setForm({...form,[e.target.name]:e.target.value});
 const submit=async e=>{e.preventDefault();setLoading(true);setError('');try{await api.post('/auth/login',form);router.replace('/dashboard');}catch(err){setError(err.response?.data?.message||'Unable to sign in. Please try again.');}finally{setLoading(false);}};
 return <Box sx={{minHeight:'100vh',display:'grid',placeItems:'center',p:2,background:'linear-gradient(135deg,#EEF2FF 0%,#F8FAFC 55%,#ECFEFF 100%)'}}><Paper sx={{width:'100%',maxWidth:440,p:{xs:3,sm:5}}}><Typography color="primary" fontWeight={800} letterSpacing={1}>TEAMFLOW</Typography><Typography variant="h4" sx={{mt:3}}>Welcome back</Typography><Typography color="text.secondary" sx={{mt:1,mb:3}}>Sign in to manage your projects and work.</Typography><Box component="form" onSubmit={submit}><Stack spacing={2.2}>{error&&<Alert severity="error">{error}</Alert>}<TextField label="Work email" name="email" type="email" value={form.email} onChange={change} required fullWidth autoComplete="username"/><TextField label="Password" name="password" type="password" value={form.password} onChange={change} required fullWidth autoComplete="current-password"/><Button type="submit" variant="contained" size="large" disabled={loading}>{loading?'Signing in…':'Sign in'}</Button></Stack></Box></Paper></Box>;
}
