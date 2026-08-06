import {login, getMe, logout, register} from '../services/auth.api'
import {useContext, useEffect, useState} from 'react'
import {AuthContext} from '../auth.context'

export const useAuth = () =>  {
    const context = useContext(AuthContext)
    const {user, setUser, loading, setLoading} = context

    async function handleRegister({email, password, username}){
        setLoading(true)
        const data = await register({email, password, username})
        setUser(data.user)
        setLoading(false)
    }

    async function handleLogin({email, password, username}){
        setLoading(true)
        const data = await login({email, password, username})
        setUser(data.user)
        setLoading(false)
    }

    async function handleLogout(){
        setLoading(true)
        const data = await logout()
        setUser(null)
        setLoading(false)
    }

    async function handleGetMe(){
        setLoading(true)
        const data = await getMe()
        setUser(data.user)
        setLoading(false)
    }

    return {handleRegister, handleLogin, handleLogout, handleGetMe}
}