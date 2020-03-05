const express = require("express");
const socketio = require("socket.io");
const http = require("http");

const PORT = process.env.PORT || 5000;
const router = require('./router');

const {addUser, getUser, removeUser, getUsersInRoom} = require('./user');

const app = new express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection',(socket)=>{
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',{user:'admin', text: `${user.name} has left the room`});
        }
        console.log("You have disconnected!!!");
    });

    socket.on('join',({name, room}, callback)=>{
        const {user, error} = addUser({id: socket.id, name, room});
        if(error) return callback(error);
        socket.join(user.room);
        socket.emit('message', {user: 'admin', text: `Welcome to room ${user.room}, ${user.name}!`});
        socket.broadcast.to(user.room).emit('message',{user: 'admin', text: `${user.name} has been joined!`}); 
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        callback();
    });
    socket.on('sendMessage',(message, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('message',{user: user.name, text: message});
        io.to(user.room).emit('roomData',{room: user.room,users: getUsersInRoom(user.room)});
        callback();
    });
});

app.use(router);
server.listen(PORT, ()=>console.log(`Server is started on port: ${PORT}`));