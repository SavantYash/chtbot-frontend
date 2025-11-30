import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';
import './App.css'
import { protectedRoutes } from './routes/routes'
import ChatWidget from './components/user/ChatWidget';
import AdminLogin from './components/admincomp/AdminLogin';
import AdminDashboard from './components/admincomp/AdminDashboard';

function App() {
  return (
    <>
      {/* <Routes>
        {
          protectedRoutes.map((r) => {
            <Route key={r.path}path={r.path} Component={r.component}  />
            })
            }
            </Routes> */}
      <Routes>
        <Route path='/' element={<ChatWidget />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </>
  )
}

export default App
