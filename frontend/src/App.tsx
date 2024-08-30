import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import FileUpload from './components/FileUpload';
import FileBrowser from './components/FileBrowser';

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #f0f2f5;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
`;

const AppContainer = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
`;

const Header = styled.header`
    background-color: #ffffff;
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
    color: #2c3e50;
    text-align: center;
    margin: 0 0 1rem;
    font-size: 2.5rem;
`;

const ContentContainer = styled.div`
    background-color: #ffffff;
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const NavContainer = styled.nav`
    display: flex;
    justify-content: center;
    margin-top: 1rem;
`;

const NavLink = styled(Link)<{ $isActive: boolean }>`
    color: ${props => (props.$isActive ? '#ffffff' : '#4a90e2')};
    background-color: ${props => (props.$isActive ? '#4a90e2' : 'transparent')};
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 25px;
    transition: all 0.3s ease;
    font-weight: 600;

    &:hover {
        background-color: ${props => (props.$isActive ? '#3a7bc8' : '#e9f2fe')};
    }

    &:not(:last-child) {
        margin-right: 1rem;
    }
`;

const NavLinkWrapper: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <NavLink to={to} $isActive={isActive}>
            {children}
        </NavLink>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <GlobalStyle />
            <AppContainer>
                <Header>
                    <Title>Autonomys Data Storage</Title>
                    <NavContainer>
                        <NavLinkWrapper to='/'>Upload</NavLinkWrapper>
                        <NavLinkWrapper to='/browse'>Browse</NavLinkWrapper>
                    </NavContainer>
                </Header>
                <ContentContainer>
                    <Routes>
                        <Route path='/' element={<FileUpload />} />
                        <Route path='/browse' element={<FileBrowser />} />
                    </Routes>
                </ContentContainer>
            </AppContainer>
        </Router>
    );
};

export default App;
