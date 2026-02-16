import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { TransactionType, Category } from '../types';

interface Props {
  categories: Category[];
  onAdd: (tx: { date: string; type: TransactionType; categoryId: string; amount: number; description: string }) => void;
}

export default function AddTransaction({ categories, onAdd }: Props) {
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;

    onAdd({
      date,
      type,
      categoryId,
      amount: Number(amount),
      description,
    });

    setAmount('');
    setDescription('');
    setCategoryId('');
    navigate('/');
  };

  return (
    <div>
      <div className="page-header">
        <h1>거래 기록</h1>
        <p>수입 또는 지출을 기록하세요</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="type-toggle">
            <button
              type="button"
              className={type === 'income' ? 'active-income' : ''}
              onClick={() => { setType('income'); setCategoryId(''); }}
            >
              수입
            </button>
            <button
              type="button"
              className={type === 'expense' ? 'active-expense' : ''}
              onClick={() => { setType('expense'); setCategoryId(''); }}
            >
              지출
            </button>
          </div>

          <div className="form-group">
            <label>날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>카테고리</label>
            <div className="category-grid">
              {filteredCategories.map(cat => (
                <div
                  key={cat.id}
                  className={`category-chip ${categoryId === cat.id ? 'selected' : ''}`}
                  onClick={() => setCategoryId(cat.id)}
                >
                  <span className="icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>금액 (원)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>메모 (선택)</label>
            <input
              type="text"
              placeholder="어디서, 무엇을"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!categoryId || !amount}
          >
            저장하기
          </button>
        </div>
      </form>
    </div>
  );
}
