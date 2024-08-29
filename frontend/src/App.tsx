import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import styled from 'styled-components';
import FileUpload from './components/FileUpload';
import FileBrowser from './components/FileBrowser';

const AppContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: Arial, sans-serif;
    color: #333;
`;

const Title = styled.h1`
    color: #2c3e50;
    text-align: center;
    margin-bottom: 2rem;
`;

const ContentContainer = styled.div`
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NavContainer = styled.nav`
    margin-bottom: 2rem;
`;

const NavLink = styled(Link)`
    margin-right: 1rem;
    color: #007bff;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const App: React.FC = () => {
    return (
        <Router>
            <AppContainer>
                <Title>Autonomys Data Storage</Title>
                <ContentContainer>
                    <NavContainer>
                        <NavLink to='/'>Upload</NavLink>
                        <NavLink to='/browse'>Browse</NavLink>
                    </NavContainer>
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
