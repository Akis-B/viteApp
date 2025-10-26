import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import './styles.css';

const App: React.FC = () => {
    return (
        <div>
            <Header />
            <main>
                <Home />
            </main>
            <Footer />
        </div>
    );
};

export default App;