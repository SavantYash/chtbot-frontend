import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';
import './App.css'
import { protectedRoutes } from './routes/routes'
import ChatWidget from './components/user/ChatWidget';

function App() {
  return (
    <>
      <ChatWidget />
      <Routes>
        {
          protectedRoutes.map((r) => {
            <Route key={r.path} Component={r.component} path={r.path} />
          })
        }
      </Routes>
    </>
  )
}

export default App
