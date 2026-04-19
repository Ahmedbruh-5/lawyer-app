const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const penalCodeRoutes = require('./routes/penalCodeRoutes');
const statuteRoutes = require('./routes/statuteRoutes')
const sanctionRoutes = require('./routes/sanctionRoutes')
const lawyerRoutes = require('./routes/lawyerRoutes')
const legalChatRoutes = require('./routes/legalChatRoutes')

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  process.env.CORS_ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:5174'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow tools like curl/Postman (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/penal-codes', penalCodeRoutes);
app.use('/api/statutes', statuteRoutes);
app.use('/api/sanctions', sanctionRoutes);
app.use('/api/lawyers', lawyerRoutes);
/** Proxies to Python AI Lawyer RAG (see src/AI Lawyer/). Env: RAG_SERVICE_URL, RAG_API_KEY */
app.use('/api/legal-chat', legalChatRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Advokate Desk API is running' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
