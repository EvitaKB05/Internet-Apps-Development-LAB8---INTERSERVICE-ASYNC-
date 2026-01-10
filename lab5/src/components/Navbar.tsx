//src/components/Navbar.tsx
import React from 'react' // вместо import React, { useEffect } from 'react'
import { Navbar, Nav, Container, Button } from 'react-bootstrap'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { logoutUser } from '../store/slices/authSlice' // вместо { logoutUser, getProfile }
import { resetCart } from '../store/slices/cartSlice'
import { resetFilters } from '../store/slices/filterSlice'

const CustomNavbar: React.FC = () => {
	const location = useLocation()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()

	// Получаем состояние из Redux
	const { isAuthenticated, user } = useAppSelector(state => state.auth)

	// // При монтировании проверяем токен и загружаем профиль
	// useEffect(() => {
	// 	const token = localStorage.getItem('token')
	// 	if (token && !isAuthenticated && !loading) {
	// 		console.log('Token found, loading profile...')
	// 		dispatch(getProfile())
	// 	}
	// }, [dispatch, isAuthenticated, loading])

	const handleLogout = async () => {
		await dispatch(logoutUser())
		dispatch(resetCart())
		dispatch(resetFilters())
		navigate('/pvlc_home_page')
	}

	console.log('Navbar - Auth state:', { isAuthenticated, user: user?.login }) // Логирование

	return (
		<Navbar bg='light' expand='lg' className='mb-4'>
			<Container>
				<Navbar.Brand as={Link} to='/pvlc_home_page'>
					<img
						src='./lung.png'
						width='30'
						height='30'
						className='d-inline-block align-top me-2'
						alt='Лёгкая Жизнь'
					/>
					Лёгкая Жизнь - Расчет ДЖЕЛ
				</Navbar.Brand>
				<Navbar.Toggle aria-controls='basic-navbar-nav' />
				<Navbar.Collapse id='basic-navbar-nav'>
					<Nav className='me-auto' activeKey={location.pathname}>
						<Nav.Link as={Link} to='/pvlc_home_page'>
							Главная
						</Nav.Link>
						<Nav.Link as={Link} to='/pvlc_patients'>
							Категории пациентов
						</Nav.Link>

						{/* Показываем только авторизованным пользователям */}
						{isAuthenticated && (
							<>
								<Nav.Link as={Link} to='/pvlc_med_cards'>
									Мои заявки
								</Nav.Link>
							</>
						)}
					</Nav>
					<Nav>
						{isAuthenticated ? (
							<>
								{/* Имя пользователя */}
								<Navbar.Text className='me-3'>
									Привет, <strong>{user?.login}</strong>!
								</Navbar.Text>

								{/* Кнопка профиля */}
								<Nav.Link as={Link} to='/pvlc_profile' className='me-2'>
									Профиль
								</Nav.Link>

								{/* Кнопка выхода */}
								<Button
									variant='outline-danger'
									size='sm'
									onClick={handleLogout}
								>
									Выйти
								</Button>
							</>
						) : (
							<>
								{/* Кнопки для гостя */}
								<Nav.Link as={Link} to='/pvlc_login' className='me-2'>
									Вход
								</Nav.Link>
								<Nav.Link as={Link} to='/pvlc_register'>
									Регистрация
								</Nav.Link>
							</>
						)}
					</Nav>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	)
}

export default CustomNavbar
