import {login, getMe, logout, register} from '../services/auth.api'
import {useContext} from 'react'
import {AuthContext} from '../auth.context'

// Turn a failed request into something a person can read. The backend sends
// { message } for validation problems, wrong passwords, rate limits, etc.
function errorMessage(err, fallback) {
    const fromServer = err?.response?.data?.message
    if (fromServer) return fromServer
    if (err?.response) return fallback
    return "Can't reach the server. Check your connection and try again."
}

export const useAuth = () =>  {
    const context = useContext(AuthContext)
    const {user, setUser, loading, setLoading, ready} = context

    // Both resolve to { ok: true } or { ok: false, message } — they never
    // throw, so the page decides what to do (show the message, or move on).
    async function handleRegister({email, password, username}){
        setLoading(true)
        try {
            const data = await register({email, password, username})
            setUser(data.user)
            return { ok: true }
        } catch (err) {
            setUser(null)
            return { ok: false, message: errorMessage(err, 'Could not create your account. Please try again.') }
        } finally {
            setLoading(false)
        }
    }

    async function handleLogin({email, password, username}){
        setLoading(true)
        try {
            const data = await login({email, password, username})
            setUser(data.user)
            return { ok: true }
        } catch (err) {
            setUser(null)
            return { ok: false, message: errorMessage(err, 'Could not log you in. Please try again.') }
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

    // Manual re-check (not called automatically any more)
    async function handleGetMe(){
        setLoading(true)
        try {
            const data = await getMe()
            setUser(data.user)
        } catch (err) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    return {handleRegister, handleLogin, handleLogout, handleGetMe, user, loading, ready}
}