serconst express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

// Xabarlar va chatlar xotirasi
let chats = [
  { id: 'main', name: 'Sinf Guruhi', type: 'group', avatar: '', initial: 'S', owner: 'admin', admins: ['admin'], members: [] },
  { id: 'news', name: 'Sinf Yangiliklari', type: 'channel', avatar: '', initial: 'Y', owner: 'admin', admins: ['admin'], members: [] }
];

let messages = {
  'main': [],
  'news': []
};

io.on('connection', (socket) => {
  // Yangi qurilma ulanganda chatlar va xabarlarni yuborish
  socket.emit('initData', { chats, messages });

  // Yangi foydalanuvchi qo'shilishi
  socket.on('joinUser', (user) => {
    socket.userData = user;
    chats.forEach(c => {
      if (!c.members.includes(user.name)) c.members.push(user.name);
    });
    io.emit('updateChats', chats);
  });

  // Yangi chat yaratish
  socket.on('createChat', (newChat) => {
    chats.push(newChat);
    messages[newChat.id] = [];
    io.emit('updateChats', chats);
  });

  // Xabar yuborish (barcha qurilmalarga tarqatish)
  socket.on('sendMessage', ({ chatId, messageData }) => {
    if (!messages[chatId]) messages[chatId] = [];
    messages[chatId].push(messageData);
    
    // Barcha ulangan qurilmalarga xabarni yetkazish
    io.emit('newMessage', { chatId, messageData });
  });

  // Admin darajasini o'zgartirish
  socket.on('toggleAdmin', ({ chatId, targetMember, action }) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      if (action === 'add' && !chat.admins.includes(targetMember)) {
        chat.admins.push(targetMember);
      } else if (action === 'remove') {
        chat.admins = chat.admins.filter(a => a !== targetMember);
      }
      io.emit('updateChats', chats);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishlamoqda`);
});