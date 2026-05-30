const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path'); // Thêm thư viện xử lý đường dẫn hệ thống

const app = express();
app.use(cors()); // Cho phép kết nối xuyên nguồn (CORS)

// 🎯 Phục vụ các file tĩnh (HTML, CSS, JS) nằm trong thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Nhận kết nối từ cả Web App lẫn Agent
});

// Object quản lý danh sách các máy trạm (Agent) đang online
let registeredAgents = {};

io.on('connection', (socket) => {
    console.log(`\n[+] Thiết bị mới kết nối socket: ${socket.id}`);

    // 1. Nhận tín hiệu đăng ký định danh từ máy Kali Linux
    socket.on('agent_register', (data) => {
        registeredAgents[data.machine_name] = socket.id;
        console.log(`📌 MÁY ẢO ĐÃ ĐĂNG KÝ THÀNH CÔNG: [${data.machine_name}] -> Socket ID: ${socket.id}`);
        console.log("Danh sách máy phòng Lab đang online:", Object.keys(registeredAgents));
    });

    // 2. Nhận lệnh điều khiển từ Trình duyệt Web gửi lên và chuyển tiếp (Forward) xuống Agent
    socket.on('client_command', (data) => {
        console.log(`🎮 Web ra lệnh: [${data.action}] gửi tới máy trạm: [${data.target}]`);

        // Tìm Socket ID của máy Kali mục tiêu dựa trên danh sách đang online
        const agentSocketId = registeredAgents[data.target];
        if (agentSocketId) {
            // Bắn lệnh thẳng xuống đúng máy Kali đó qua giao thức room/direct emit
            io.to(agentSocketId).emit('server_to_agent_cmd', { action: data.action, detail: data.detail });
            console.log(`👉 Đã chuyển tiếp lệnh [${data.action}] xuống Socket ID của Agent: ${agentSocketId}`);
        } else {
            console.log(`❌ Không thể thực thi! Máy trạm [${data.target}] hiện đang ngoại tuyến (Offline).`);
        }
    });

    // 3. Xử lý khi có bất kỳ thiết bị nào (Web hoặc Agent) ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`[-] Thiết bị ngắt kết nối: ${socket.id}`);
        // Tự động tìm và xóa máy ra khỏi danh sách online
        for (let name in registeredAgents) {
            if (registeredAgents[name] === socket.id) {
                delete registeredAgents[name];
                console.log(`❌ Máy [${name}] đã Offline.`);
                console.log("Danh sách máy phòng Lab còn lại:", Object.keys(registeredAgents));
            }
        }
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`🚀 WINDOWS SERVER đang chạy và lắng nghe tại địa chỉ: http://localhost:${PORT}`);
});