import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Trends from './pages/Trends';
import IncomeStatement from './pages/IncomeStatement';
import BalanceSheet from './pages/BalanceSheet';
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
            path="/balance-sheet"
            element={
              <BalanceSheet
                assets={store.assets}
                liabilities={store.liabilities}
                onAddAsset={store.addAsset}
                onDeleteAsset={store.deleteAsset}
                onAddLiability={store.addLiability}
                onDeleteLiability={store.deleteLiability}
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
