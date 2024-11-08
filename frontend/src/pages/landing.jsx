import React from 'react'
import "../App.css"
import { Link } from "react-router-dom"

const landing = () => {
    return (
        <div className='landingPagecontainer'>
            <nav>
                <div className='navHeader'>
                    <h2> TalkStream</h2>

                </div>
                <div className='navlist'>
                    <p onClick={() => {
                        window.location.href = "/q23qsc"
                    }}> Join as guest</p>
                   <Link to={"/auth"}> <p>Register</p></Link>
                    <div role='button'>
                        <Link
                            to="/auth"
                            style={{
                                display: 'inline-block',
                                padding: '10px 20px',
                                backgroundColor: '#FFD700',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '5px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s ease'
                            }}
                        >
                            <p style={{ margin: 0 }}>Login</p>
                        </Link>
                    </div>
                </div >
            </nav>
            <div className="landingMainContainer">
                <div>

                    <h1><span style={{ color: "orange " }}>Connect </span>with your loved Ones </h1>
                    <p>Cover a distance by TalkStream</p>
                    <div role='button'>
                        <Link to={"/auth"}> Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="" />
                </div>
            </div>

        </div>
    )
}

export default landing

