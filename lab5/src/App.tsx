//src/App.tsx
import React, { useEffect } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { useAppDispatch } from './hooks/redux'
import { checkTokenOnRefresh } from './store/slices/authSlice' // ИЗМЕНЕНО: checkTokenOnRefresh вместо resetAuth
import CustomNavbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PvlcPatientsPage from './pages/PvlcPatientsPage'
import PvlcPatientPage from './pages/PvlcPatientPage'
import PvlcLoginPage from './pages/PvlcLoginPage'
import PvlcRegisterPage from './pages/PvlcRegisterPage'
import PvlcProfilePage from './pages/PvlcProfilePage'
import PvlcMedCardsPage from './pages/PvlcMedCardsPage'
import PvlcMedCardPage from './pages/PvlcMedCardPage'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

const App: React.FC = () => {
	const dispatch = useAppDispatch()

	// ИСПРАВЛЕНИЕ: Проверяем токен при загрузке приложения (F5 reset)
	// Теперь при F5 пользователь становится гостем, но токен остается в localStorage
	useEffect(() => {
		dispatch(checkTokenOnRefresh())
	}, [dispatch])

	return (
		<Router>
			<div className='App'>
				<CustomNavbar />
				<main>
					<Container fluid>
						<Routes>
							{/* Существующие маршруты */}
							<Route path='/pvlc_home_page' element={<HomePage />} />
							<Route path='/pvlc_patients' element={<PvlcPatientsPage />} />
							<Route path='/pvlc_patient/:id' element={<PvlcPatientPage />} />

							{/* НОВЫЕ МАРШРУТЫ для лабораторной работы №7 */}
							<Route path='/pvlc_login' element={<PvlcLoginPage />} />
							<Route path='/pvlc_register' element={<PvlcRegisterPage />} />
							<Route path='/pvlc_profile' element={<PvlcProfilePage />} />
							<Route path='/pvlc_med_cards' element={<PvlcMedCardsPage />} />
							<Route path='/pvlc_med_card/:id' element={<PvlcMedCardPage />} />

							{/* Резервные маршруты */}
							<Route path='/' element={<HomePage />} />
							<Route path='*' element={<HomePage />} />
						</Routes>
					</Container>
				</main>
			</div>
		</Router>
	)
}

export default App
