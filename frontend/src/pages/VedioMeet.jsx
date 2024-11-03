import React, { useEffect, useRef, useState } from 'react';
import "../styles/videoComponent.css";
import TextField from '@mui/material/TextField';
import { Button } from '@mui/material';
import io from "socket.io-client"

const server_url = "http://localhost:8000";

var connections = {};


const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState([]);
    const [audio, setAudio] = useState();
    const [screen, setScreen] = useState();
    const [showModal, setShowModal] = useState();
    const [screenAvailable, setScreenAvailable] = useState();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const videoRef = useRef([]);
    const [videos, setVideos] = useState([]);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreen(true);
            } else {
                setScreen(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio: audioAvailable
                });

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


    // let getUserMediaSuccess = (stream) => {
    //     try {
    //         window.localStream.getTracks().forEach(track => track.stop())
    //     } catch (error) {
    //         console.log(error)
    //     }

    //     window.localStream = stream
    //     localVideoref.current.srcObject = stream

    //     for (let id in connections) {
    //         if (id == socketIdRef.current) continue
    //         connections[id].addStream(window.localStream)

    //         connections[id].createOffer().then((description) => {
    //             connections[id].setLocalDescription(description)
    //                 .then(() => {
    //                     socketIdRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
    //                 })
    //                 .catch(e => console.log(e))
    //         })
    //     }

    //     stream.getTracks().forEach(track => track.onended = () => {
    //         setVideo(false)
    //         setAudio(false)
    //         try {
    //             let tracks = localVideoref.current.srcObject.getTracks()
    //             tracks.forEach(track => track.stop())
    //         } catch (error) {
    //             console.log(error)
    //         }

    //         //todo blacksilence
    //         let blackSilence = (...args) => new MediaStream([black(...args), silence])
    //         window.localStream = blackSilence()
    //         localVideoref.current.srcObject = window.localStream

    //         for (let id in connections) {
    //             connections[id].addStream(window.localStream)
    //             connections[id].createOffer().then((description) => {
    //                 connections[id].setLocalDescription(description)
    //                     .then(() => {
    //                         socketIdRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
    //                     }).catch(e => console.log(e))
    //             })
    //         }

    //     })
    // }
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


    let addMessage = () => { }

    // let connectToSocketServer = () => {
    //     socketRef.current = io.connect(server_url, { secure: false })
    //     socketRef.current.on('signal', gotMessageFromServer)
    //     socketRef.current.on("connect", () => {
    //         socketRef.current.emit("join-call", window.location.href)
    //         socketIdRef.current = socketRef.current.id
    //         socketRef.current.on("chat-message", addMessage)
    //         socketRef.current.on("user-left", (id) => {
    //             setVideos((videos) => videos.filter((video) => video.socketId !== id))
    //         })

    //         socketRef.current.on("user-joined", (id, clients) => {
    //             clients.forEach((socketListId) => {

    //                 connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
    //                 connections[socketListId].onicecandidate = (event) => {
    //                     if (event.candidate != null) {
    //                         socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }))
    //                     }
    //                 }

    //                 connections[socketListId].onaddstream = (event) => {


    //                     let videoExists = videoRef.current.find(video => video.socketId == socketListId)

    //                     if (videoExists) {
    //                         setVideo(videos => {
    //                             const updateVideos = videos.map(video =>
    //                                 video.socketId == socketListId ? { ...video, stream: event.stream } : video
    //                             )

    //                             videoRef.current = updateVideos;
    //                             return updateVideos;
    //                         })
    //                     } else {

    //                         let newVideo = {
    //                             socketId: socketListId,
    //                             stream: event.stream,
    //                             autoPlay: true,
    //                             playsinline: true
    //                         }


    //                         setVideos(videos => {
    //                             const updatedVideos = [...videos, newVideo]
    //                             videoRef.current = updatedVideos;
    //                             return updatedVideos
    //                         })


    //                     }

    //                 }

    //                 if (window.localStream !== undefined && window.localStream !== null) {
    //                     connections[socketListId].addStream(window.localStream)
    //                 }
    //                 else {
    //                     // let blackSlience


    //                     let blackSilence = (...args) => new MediaStream([black(...args), silence])
    //                     window.localStream = blackSilence()
    //                     connections[socketListId].addStream(window.localStream)

    //                 }


    //             })

    //             if (id == socketIdRef.current) {
    //                 for (let id2 in connections) {
    //                     if (id2 == socketIdRef.current) continue

    //                     try {
    //                         connections[id2].addStream(window.localStream)
    //                     } catch (error) {

    //                     }
    //                     connections[id2].createOffer().then((description) => {
    //                         connections[id2].setLocalDescription(description)
    //                             .then(() => {
    //                                 socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].setLocalDescription }))
    //                             })
    //                             .catch(e => console.log(e))
    //                     })
    //                 }
    //             }
    //         })


    //     })


    // }

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

    // let connectToSocketServer = () => {
    //     socketRef.current = io.connect(server_url, { secure: false });
    //     socketRef.current.on('signal', gotMessageFromServer);
    //     socketRef.current.on("connect", () => {
    //         socketRef.current.emit("join-call", { room: window.location.href, username }); // send username here
    //         socketIdRef.current = socketRef.current.id;
    //         socketRef.current.on("chat-message", addMessage);
    //         socketRef.current.on("user-left", (id) => {
    //             setVideos((videos) => videos.filter((video) => video.socketId !== id));
    //         });

    //         socketRef.current.on("user-joined", (id, clients) => {
    //             clients.forEach((socketListId) => {
    //                 connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
    //                 connections[socketListId].onicecandidate = (event) => {
    //                     if (event.candidate != null) {
    //                         socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }));
    //                     }
    //                 };

    //                 connections[socketListId].onaddstream = (event) => {
    //                     let videoExists = videoRef.current.find(video => video.socketId === socketListId);

    //                     if (videoExists) {
    //                         setVideo(videos => {
    //                             const updateVideos = videos.map(video =>
    //                                 video.socketId === socketListId ? { ...video, stream: event.stream } : video
    //                             );
    //                             videoRef.current = updateVideos;
    //                             return updateVideos;
    //                         });
    //                     } else {
    //                         // here include the username when creating the video
    //                         let newVideo = {
    //                             socketId: socketListId,
    //                             stream: event.stream,
    //                             username, // include the username here
    //                             autoPlay: true,
    //                             playsinline: true
    //                         };

    //                         setVideos(videos => {
    //                             const updatedVideos = [...videos, newVideo];
    //                             videoRef.current = updatedVideos;
    //                             return updatedVideos;
    //                         });
    //                     }
    //                 };

    //                 if (window.localStream !== undefined && window.localStream !== null) {
    //                     connections[socketListId].addStream(window.localStream);
    //                 } else {
    //                     let blackSilence = (...args) => new MediaStream([black(...args), silence]);
    //                     window.localStream = blackSilence();
    //                     connections[socketListId].addStream(window.localStream);
    //                 }
    //             });

    //             if (id === socketIdRef.current) {
    //                 for (let id2 in connections) {
    //                     if (id2 === socketIdRef.current) continue;

    //                     try {
    //                         connections[id2].addStream(window.localStream);
    //                     } catch (error) { }

    //                     connections[id2].createOffer().then((description) => {
    //                         connections[id2].setLocalDescription(description)
    //                             .then(() => {
    //                                 socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }));
    //                             })
    //                             .catch(e => console.log(e));
    //                     });
    //                 }
    //             }
    //         });
    //     });
    // };



    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const connect = () => {
        setAskForUsername(false);
        getMedia();
    };

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
                    <div>
                        <video ref={localVideoref} autoPlay muted></video>
                    </div>
                </div>
            ) : <>

                <video ref={localVideoref} autoPlay muted></video>
                {videos.map((video) => (
                    <div key={video.socketId}>
                        
                        <h2>{video.socketId}</h2> 

                        <video data-socket={video.socketId}
                        ref={ref=>{
                            if(ref && video.stream){
                                ref.srcObject=video.stream;
                            }
                        }} autoplay></video>

                    </div>
                ))}

            </>}
        </div>
    );
}
