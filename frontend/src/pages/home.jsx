import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import RestoreIcon from '@mui/icons-material/Restore';
import { IconButton, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {

    let {addToUserHistory}=useContext(AuthContext);

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`);
    };

    return (
        <>
           
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 20px',
                backgroundImage: 'url("/background.png")', 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'white'
            }}>
                <div style={{ display: "flex", alignItems: "center", color: "white" }}>
                    <h2>TalkStream</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={()=>{
                        navigate('/history')
                    }} style={{ color: "white" }}>
                        <RestoreIcon />
                        <p style={{ marginLeft: '5px' }}>History</p>
                    </IconButton>
                    <Button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate('/auth');
                        }}
                        style={{
                            backgroundColor: '#ff4d4d',
                            color: 'white',
                            marginLeft: '20px'
                        }}
                        variant="contained"
                    >
                        LOGOUT
                    </Button>
                </div>
            </div>

            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '50px 20px',
                backgroundColor: '#f0f0f0',
                height: 'calc(100vh - 60px)'
            }}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <h2 style={{ marginBottom: '20px' }}>Providing the Best Quality Video Call</h2>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <TextField 
                            onChange={e => setMeetingCode(e.target.value)} 
                            placeholder="Enter Meeting Code"
                            variant="outlined"
                            style={{ flex: 1 }}
                        />
                        <Button 
                            onClick={handleJoinVideoCall} 
                            variant='contained' 
                            style={{ backgroundColor: '#4caf50', color: 'white' }}
                        >
                            Join Call
                        </Button>
                    </div>
                </div>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <img 
                        src="/homepageimg.png" 
                        alt="Video Call" 
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                </div>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);
