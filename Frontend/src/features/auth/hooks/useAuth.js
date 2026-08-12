import {login, getMe, logout, register} from '../services/auth.api'
import {useContext, useEffect, useState} from 'react'
import {AuthContext} from '../auth.context'

export const useAuth = () =>  {
    const context = useContext(AuthContext)
    const {user, setUser, loading, setLoading} = context

    async function handleRegister({email, password, username}){
        setLoading(true)
        try {
            const data = await register({email, password, username})
            setUser(data.user)
        } catch (err) {
            setUser(null)
            console.warn('register failed', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleLogin({email, password, username}){
        setLoading(true)
        try {
            const data = await login({email, password, username})
            setUser(data.user)
        } catch (err) {
            setUser(null)
            console.warn('login failed', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleLogout(){
        setLoading(true)
        try {
            await logout()
        } catch (err) {
            console.warn('logout failed', err)
        } finally {
            setUser(null)
            setLoading(false)
        }
    }

    useEffect(() => {
        handleGetMe()
    }, [])

    async function handleGetMe(){
        setLoading(true)
        try {
            const data = await getMe()
            setUser(data.user)
        } catch (err) {
            // unauthorized or network error — ensure we clear user and stop loading
            setUser(null)
            console.warn('getMe failed', err)
        } finally {
            setLoading(false)
        }
    }

    return {handleRegister, handleLogin, handleLogout, handleGetMe, user, loading}
}