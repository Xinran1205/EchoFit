import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../components/app/AppShell'
import { EchoPage } from '../pages/EchoPage/EchoPage'
import { HomePage } from '../pages/HomePage/HomePage'
import { InsightPage } from '../pages/InsightPage/InsightPage'
import { LogPage } from '../pages/LogPage/LogPage'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { RecordPage } from '../pages/RecordPage/RecordPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'log',
        element: <LogPage />
      },
      {
        path: 'insights',
        element: <InsightPage />
      },
      {
        path: 'record/new',
        element: <RecordPage />
      },
      {
        path: 'record/edit/:recordId',
        element: <RecordPage />
      },
      {
        path: 'echo/:recordId',
        element: <EchoPage />
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />
  }
])
