const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const mysql = require('mysql2');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Conexión a la base de datos
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'chat_db',
});

conn.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
    console.log('Conexión a la base de datos establecida.');
  }
});

// Ruta para servir el HTML
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Ruta API para obtener mensajes
app.get('/api/messages', (req, res) => {
  const query = 'SELECT * FROM messages ORDER BY created_at';
  conn.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener mensajes:', err);
      res.status(500).json({ error: 'Error al obtener mensajes' });
    } else {
      res.json(results);
    }
  });
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado.');

  // Recibir mensaje del cliente
  socket.on('chat message', (data) => {
    const { user, text } = data;
    const query = 'INSERT INTO messages (user, text) VALUES (?, ?)';
    conn.query(query, [user, text], (err) => {
      if (err) {
        console.error('Error al guardar mensaje:', err);
      } else {
        io.emit('chat message', data); // Enviar a todos los usuarios
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Un usuario se ha desconectado.');
  });
});

// Iniciar servidor
server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000 🚀');
});




