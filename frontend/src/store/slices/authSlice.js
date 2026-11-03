import {createSlice} from '@reduxjs/toolkit';
const slice=createSlice({name:'auth',initialState:{user:null,initialized:false},reducers:{setUser:(s,a)=>{s.user=a.payload;s.initialized=true;},clearUser:s=>{s.user=null;s.initialized=true;}}});
export const {setUser,clearUser}=slice.actions; export default slice.reducer;
