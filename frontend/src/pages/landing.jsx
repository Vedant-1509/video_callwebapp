import React from 'react'
import "../App.css"
import {Link} from "react-router-dom"

const landing = () => {
    return (
        <div className='landingPagecontainer'>
            <nav>
                <div className='navHeader'>
                    <h2> TalkStream</h2>

                </div>
                <div className='navlist'>
                    <p> Join as guest</p>
                    <p>Register</p>
                    <div role='button'>
                        <p>login</p>
                    </div>
                </div >
            </nav>
            <div className="landingMainContainer">
                <div>
                   
                    <h1><span style={{color:"orange "}}>Connect </span>with your loved Ones </h1>
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

