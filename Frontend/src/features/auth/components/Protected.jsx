import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router'

const Protected = ({ children }) => {
    const { user, loading } = useAuth()


    if (loading) {
        return (
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'60vh'}}>
                <div className="loading-card">
                    <div className="spinner" aria-hidden="true" />
                    <div className="loading-text">Checking authentication…</div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" />
    }
    return children
}

export default Protected