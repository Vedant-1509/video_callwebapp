import React, { useEffect, useRef, useState} from 'react';
import { useNavigate } from 'react-router-dom';

import styles from "../styles/videoComponent.module.css";
import TextField from '@mui/material/TextField';
import { Badge, Button, IconButton } from '@mui/material';
import io from "socket.io-client"
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';

const server_url = "http://localhost:8000";

var connections = {};


const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

export default function VideoMeetComponent() {

    let routeTo = useNavigate()
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState([]);
    const [audio, setAudio] = useState();
    const [screen, setScreen] = useState();
    const [showModal, setShowModal] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState("");
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const videoRef = useRef([]);
    const [videos, setVideos] = useState([]);



    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };


    useEffect(() => {
        getPermissions();
    }, []);



    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }


    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enable: false })
    }


    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }




    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (error) {
                console.log(error);
            }
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video]);


    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                if (signal.sdp.type == "offer") {

                    connections[fromId].createAnswer().then((description) => {
                        connections[fromId].setLocalDescription(description).then(() => {
                            socketIdRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
                        }).catch(e => console.log(e))
                    }).catch(e => console.log(e))
                }
            }).catch(e => console.log(e))
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
        }
    }


    let addMessage = (data, sender, socketIdSender) => {

        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ])

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevMessages) => prevMessages + 1)
        }


    }


    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const connect = () => {
        setAskForUsername(false);
        getMedia();
    };

    let handleAudio = () => {
        setAudio(!audio)
    }

    let handleVideo = () => {
        setVideo(!video)
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) {
            console.log(e)

        }
        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id == socketIdRef.current) continue

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => [
                connections[id].setLocalDescription(description).AudioContext
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            ])
        }
        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            getUserMedia()

        })


    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia()
        }
    })

    let handleScreen = () => {
        setScreen(!screen)
    }

    let handleChatScreen = () => {
        setShowModal(!showModal)
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username)
        setMessage("")
    }

    let handleEndCall=()=>{
        try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (error) {
            console.log(error)
        }

         routeTo("/home")


    }
    return (
        <div>
            {askForUsername ? (
                <div>
                    <h2>Enter into Lobby</h2>

                    <TextField
                        id="outlined-basic"
                        label="UserName"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                    <Button variant="contained" onClick={connect}>Connect</Button>
                    <div>ddd
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>
                </div>
            ) : <div className={styles.meetVideoContainer}>

                {showModal ? <div className={styles.chatRoom}>
                    <div className={styles.chatContainer}>
                        <h1>Chat</h1>
                        <div className={styles.chattingDisplay}>
                            {messages.length > 0 ? messages.map((item, index) => {
                                return (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            marginBottom: '20px',
                                            justifyContent: item.sender === 'You' ? 'flex-end' : 'flex-start' // Align based on sender
                                        }}
                                        key={index}
                                    >
                                        {/* Display avatar on the left for others, not for 'You' */}
                                        {item.sender !== 'You' && (
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4CAF50', // Green background for avatar
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: '10px'
                                                }}
                                            >
                                                <PersonIcon style={{ color: 'white', fontSize: '24px' }} />
                                            </div>
                                        )}

                                        {/* Message bubble */}
                                        <div
                                            style={{
                                                maxWidth: '70%',
                                                backgroundColor: item.sender === 'You' ? '#DCF8C6' : '#f1f1f1', // Different color for sender vs receiver
                                                padding: '10px 15px',
                                                borderRadius: '20px',
                                                borderTopRightRadius: item.sender === 'You' ? '0' : '20px', // Slight change in shape
                                                borderTopLeftRadius: item.sender !== 'You' ? '0' : '20px',
                                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                position: 'relative'
                                            }}
                                        >
                                            <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>{item.sender}</p>
                                            <p style={{ margin: 0, color: '#555' }}>{item.data}</p>
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#888',
                                                    position: 'absolute',
                                                    bottom: '-20px',
                                                    right: '10px'
                                                }}
                                            >
                                                {item.timestamp} {/* Add a timestamp field in your messages data */}
                                            </span>
                                        </div>

                                        {/* Display avatar on the right for 'You' */}
                                        {item.sender === 'You' && (
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#4CAF50',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginLeft: '10px'
                                                }}
                                            >
                                                <PersonIcon style={{ color: 'white', fontSize: '24px' }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : <p style={{ fontWeight: 'bold', textAlign: 'center' }}>No messages available</p>}


                        </div>

                        <div className={styles.chattingArea}>

                            <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="filled-basic" label="message" variant="filled" />
                            <SendIcon variant="contained" onClick={sendMessage} />
                        </div>


                    </div>

                </div> : <></>}




                <div className={styles.buttonContainers}>
                    <IconButton onClick={handleVideo} style={{ color: "white", fontSize: "32" }}>
                        {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                    </IconButton>

                    <IconButton onClick={handleEndCall} style={{ color: "red", fontSize: "32" }}>
                        <CallEndIcon />
                    </IconButton>

                    <IconButton onClick={handleAudio} style={{ color: "white", fontSize: "32" }}>
                        {(audio === true) ? <MicIcon /> : <MicOffIcon />}
                    </IconButton>

                    {screenAvailable === true ?
                        <IconButton onClick={handleScreen} style={{ color: "white" }}>
                            {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                        </IconButton> : <></>}

                    <Badge badgeContent={newMessages} max={999} color='secondary'>
                        <IconButton onClick={handleChatScreen} style={{ color: 'white' }}>
                            <ChatIcon />
                        </IconButton>
                    </Badge>




                </div>

                <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>
                <div className={styles.conferenceView}>
                    {videos.map((video) => (
                        <div key={video.socketId}>

                            <h2>{video.socketId}</h2>

                            <video data-socket={video.socketId}
                                ref={ref => {
                                    if (ref && video.stream) {
                                        ref.srcObject = video.stream;
                                    }
                                }} autoplay></video>

                        </div>
                    ))}
                </div>

            </div>}
        </div>
    );
}
