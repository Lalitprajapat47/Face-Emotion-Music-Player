import { createContext, useEffect, useState } from "react";
import { getMe } from "./services/auth.api";

export const AuthContext = createContext()


export const AuthProvider = ({children}) =>{
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    // true once the first "who am I?" check has finished (success or not)
    const [ready, setReady] = useState(false)

    // The session check lives here, so it runs once for the whole app.
    // (It used to be inside useAuth(), which meant EVERY component that called
    // useAuth() fired its own /get-me request — and re-triggered the loading
    // screen — each time it mounted.)
    useEffect(() => {
        let cancelled = false

        getMe()
            .then((data) => { if (!cancelled) setUser(data.user) })
            .catch(() => { if (!cancelled) setUser(null) })      // not logged in, or server unreachable
            .finally(() => {
                if (!cancelled) {
                    setLoading(false)
                    setReady(true)
                }
            })

        return () => { cancelled = true }
    }, [])

    return (
        <AuthContext.Provider value={{user, setUser, loading, setLoading, ready}}>
            {children}
        </AuthContext.Provider>
    )

}