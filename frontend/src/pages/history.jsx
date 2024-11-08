import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';


import CardContent from '@mui/material/CardContent';

import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton } from '@mui/material';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }

        fetchHistory();
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    return (
        <div style={{ padding: "20px", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
            <IconButton 
                onClick={() => { routeTo("/home") }}
                style={{ backgroundColor: "#fff", marginBottom: "20px" }}>
                <HomeIcon style={{ color: "#4caf50" }} />
            </IconButton >

            {
                (meetings.length !== 0) ? meetings.map((e, i) => {
                    return (
                        <Card key={i} variant="outlined" 
                              sx={{ 
                                  maxWidth: "500px", 
                                  margin: "0 auto", 
                                  marginBottom: "20px", 
                                  padding: "20px", 
                                  borderRadius: "12px", 
                                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                                  backgroundColor: "#fff"
                              }}>
                            <CardContent>
                                <Typography sx={{ fontSize: 16, fontWeight: "bold", color: "#333" }} gutterBottom>
                                    Meeting Code: {e.meetingCode}
                                </Typography>

                                <Typography sx={{ mb: 1.5, fontSize: 14, color: "#757575" }}>
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    );
                }) : <Typography sx={{ fontSize: 16, textAlign: "center", color: "#757575" }}>No meeting history available</Typography>
            }
        </div>
    );
}
