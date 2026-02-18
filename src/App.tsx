import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Trends from './pages/Trends';
import IncomeStatement from './pages/IncomeStatement';
import InvestmentPortfolio from './pages/InvestmentPortfolio';
import { useStore } from './store/useStore';

function App() {
  const store = useStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <Dashboard
                transactions={store.transactions}
                categories={store.categories}
                onDelete={store.deleteTransaction}
              />
            }
          />
          <Route
            path="/add"
            element={
              <AddTransaction
                categories={store.categories}
                onAdd={store.addTransaction}
              />
            }
          />
          <Route
            path="/trends"
            element={
              <Trends
                transactions={store.transactions}
                categories={store.categories}
              />
            }
          />
          <Route
            path="/income-statement"
            element={
              <IncomeStatement
                transactions={store.transactions}
                categories={store.categories}
              />
            }
          />
          <Route
            path="/investments"
            element={
              <InvestmentPortfolio
                investments={store.investments}
                onAdd={store.addInvestment}
                onUpdate={store.updateInvestment}
                onDelete={store.deleteInvestment}
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
