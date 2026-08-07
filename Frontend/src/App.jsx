import {RouterProvider} from 'react-router'
import { router } from './app.routes'
import './features/shared/styles/global.scss'
import {AuthProvider} from './features/auth/auth.context'
import {SongContextProvider} from './features/home/song.context'

function App() {
  return (
    <SongContextProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </SongContextProvider>
  )
}

export default App
