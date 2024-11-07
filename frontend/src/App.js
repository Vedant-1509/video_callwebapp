
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Landing from './pages/landing.jsx';
import Authentication from './pages/authentication.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import VedioMeetComponent from './pages/VideoMeetComponent.jsx';
import HomeComponent from './pages/home.jsx'


function App() {
  return (
    <>
      <Router>

        <AuthProvider>
          <Routes>


            {/* <Route path="/home" element={<Home />} /> */}
            <Route path="/" element={<Landing />} />
            <Route path='/auth' element={<Authentication />} />

            <Route path='/home' element={<HomeComponent/>}/>

            <Route path='/:url' element={<VedioMeetComponent/>}/>
          </Routes>
        </AuthProvider>
      </Router>

    </>
  );
}

export default App;
