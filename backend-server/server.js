const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Cho phép kết nối xuyên nguồn (CORS)

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Nhận kết nối từ cả Web App lẫn Agent
});

// Object quản lý danh sách các máy trạm (Agent) đang online
let registeredAgents = {};

io.on('connection', (socket) => {
    console.log(`\n[+] Thiết bị mới kết nối socket: ${socket.id}`);

    // Nhận tín hiệu đăng ký định danh từ máy Kali Linux
    socket.on('agent_register', (data) => {
        registeredAgents[data.machine_name] = socket.id;
        console.log(`📌 MÁY ẢO ĐÃ ĐĂNG KÝ THÀNH CÔNG: [${data.machine_name}] -> Socket ID: ${socket.id}`);
        console.log("Danh sách máy phòng Lab đang online:", Object.keys(registeredAgents));
    });

    // Xử lý khi có bất kỳ thiết bị nào ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`[-] Thiết bị ngắt kết nối: ${socket.id}`);
        // Tự động tìm và xóa máy ra khỏi danh sách online
        for (let name in registeredAgents) {
            if (registeredAgents[name] === socket.id) {
                delete registeredAgents[name];
                console.log(`❌ Máy [${name}] đã Offline.`);
            }
        }
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`🚀 WINDOWS SERVER đang chạy và lắng nghe tại port ${PORT}...`);
});