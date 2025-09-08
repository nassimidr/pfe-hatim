import axios from 'axios';

export const askAI = async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, message: 'Question requise' });
  }
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Clé API OpenRouter manquante' });
    }
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Tu es un assistant utile pour la gestion de projet et de tâches.' },
          { role: 'user', content: question }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );
    const aiMessage = response.data.choices?.[0]?.message?.content || 'Aucune réponse.';
    res.json({ success: true, answer: aiMessage });
  } catch (error) {
    console.error('Erreur OpenRouter:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Erreur IA', details: error.response?.data || error.message });
  }
}; 