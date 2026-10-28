import { Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { ProtectedRoute } from "./routes/ProtectedRoute"
import { RecordPage } from "./pages/RecordPage"
import { RecordFormPage } from "./pages/RecordFormPage"
import { RecordDetailsPage } from "./pages/RecordDetailsPage"
import { Layout } from "./components/Layout"
function App() {


  return (


    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/records" replace />} />

      <Route element={<ProtectedRoute />} >
        <Route element={<Layout />}>
          <Route path="/records" element={<RecordPage />} />
          <Route path="/records/new" element={<RecordFormPage />} />
          <Route path="/records/:id" element={<RecordDetailsPage />} />
          <Route path="/records/:id/edit" element={<RecordFormPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>



  )
}

export default App
