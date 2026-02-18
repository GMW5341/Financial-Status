import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import TransactionHistory from './pages/TransactionHistory';
import Trends from './pages/Trends';
import IncomeStatement from './pages/IncomeStatement';
import InvestmentPortfolio from './pages/InvestmentPortfolio';
import Settings from './pages/Settings';
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
                accounts={store.accounts}
                onAdd={store.addTransaction}
              />
            }
          />
          <Route
            path="/transactions"
            element={
              <TransactionHistory
                transactions={store.transactions}
                categories={store.categories}
                accounts={store.accounts}
                onDelete={store.deleteTransaction}
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
          <Route
            path="/settings"
            element={
              <Settings
                accounts={store.accounts}
                onAddAccount={store.addAccount}
                onUpdateAccount={store.updateAccount}
                onDeleteAccount={store.deleteAccount}
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
