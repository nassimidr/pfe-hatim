import React, { useState } from 'react';
import Modal from './UI/Modal';
import Button from './UI/Button';
import Input from './UI/Input';
import Toast from './UI/Toast';
import { useAuth } from '../contexts/AuthContext';

const AIHelper: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAnswer('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Erreur IA');
      setAnswer(data.answer);
    } catch (err: any) {
      setError(err.message || 'Erreur IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="primary">Assistant IA</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Assistant IA">
        <form onSubmit={handleAsk} className="flex flex-col gap-3">
          <Input
            placeholder="Posez votre question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
            disabled={loading}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Fermer</Button>
            <Button type="submit" disabled={loading || !question}>{loading ? 'Envoi...' : 'Envoyer'}</Button>
          </div>
        </form>
        {error && <Toast type="error" message={error} />}
        {answer && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <div className="font-semibold mb-1">Réponse IA :</div>
            <div className="whitespace-pre-line text-gray-800 dark:text-gray-100">{answer}</div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AIHelper; 