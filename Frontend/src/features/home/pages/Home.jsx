import React from 'react'
import FaceExpression from '../../Expressions/components/FaceExpression'
import Player from '../components/Player'
import { useSong } from '../hooks/useSong'
import '../style/home.scss'

const Home = () => {
    const { handleGetSong } = useSong()

    return (
        <div className="site-container home-hero">
            <section className="hero-section neon-hero">
                <div className="hero-left">
                    <p className="eyebrow">Realtime</p>
                    <h1 className="hero-title">Detect expression</h1>
                    <p className="lead">Realtime face expression detection powered by MediaPipe — try it now.</p>
                </div>

                <div className="hero-right">
                    <div className="glass-card neon-card">
                            <FaceExpression compact onClick={(expression) => { handleGetSong({ mood: expression }) }} />
                        </div>
                </div>
            </section>

            <Player />
        </div>
    )
}

export default Home