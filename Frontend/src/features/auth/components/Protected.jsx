import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router'
import '../style/auth.scss'

const Protected = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="boot" role="status" aria-label="Checking your session">
                <span className="boot__spinner" aria-hidden="true" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }
    return children
}

export default Protected