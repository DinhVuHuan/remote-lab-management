const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Phục vụ trực tiếp mã nguồn frontend khi dùng Vite
app.use('/src', express.static(path.join(__dirname, '../frontend/src')));

// Phục vụ các file tĩnh khác như index.html nằm trong thư mục 'public'
app.use(express.static(path.join(__dirname, '../frontend/public')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
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

        // 🎯 BẮN SỰ KIỆN ONLINE VỀ WEB INTERFACE để cập nhật Audit Log
        io.emit('server_send_audit_to_web', {
            action: 'AGENT_ONLINE',
            machine_name: data.machine_name,
            status: 'Kết nối thành công (Online)'
        });
    });

    // 2. Nhận lệnh điều khiển từ Trình duyệt Web gửi lên và chuyển tiếp (Forward) xuống Agent
    socket.on('client_command', (data) => {
        console.log(`🎮 Web ra lệnh: [${data.action}] gửi tới máy trạm: [${data.target}]`);

        const agentSocketId = registeredAgents[data.target];
        if (agentSocketId) {
            io.to(agentSocketId).emit('server_to_agent_cmd', { action: data.action, detail: data.detail });
            console.log(`👉 Đã chuyển tiếp lệnh [${data.action}] xuống Socket ID của Agent: ${agentSocketId}`);
        } else {
            console.log(`❌ Không thể thực thi! Máy trạm [${data.target}] hiện đang ngoại tuyến (Offline).`);
        }
    });

    // Nhận dữ liệu tiến trình thật từ Agent và chuyển tiếp về Web App
    socket.on('agent_send_procs', (data) => {
        io.emit('server_send_procs_to_web', data);
    });

    // 🎯 CHỖ MỚI SỬA: Nhận dữ liệu ảnh màn hình từ Agent và chuyển tiếp về Web App
    socket.on('agent_send_screen', (data) => {
        // data chứa { machine_name, image_base64 }
        io.emit('server_send_screen_to_web', data);
    });

    // 3. Xử lý khi có bất kỳ thiết bị nào (Web hoặc Agent) ngắt kết nối
    socket.on('disconnect', () => {
        console.log(`[-] Thiết bị ngắt kết nối: ${socket.id}`);

        for (let name in registeredAgents) {
            if (registeredAgents[name] === socket.id) {
                delete registeredAgents[name];
                console.log(`❌ Máy [${name}] đã Offline.`);
                console.log("Danh sách máy phòng Lab còn lại:", Object.keys(registeredAgents));

                // 🎯 BẮN SỰ KIỆN OFFLINE VỀ WEB INTERFACE để cập nhật Audit Log
                io.emit('server_send_audit_to_web', {
                    action: 'AGENT_OFFLINE',
                    machine_name: name,
                    status: 'Mất kết nối (Offline)'
                });
            }
        }
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`🚀 WINDOWS SERVER đang chạy và lắng nghe tại địa chỉ: http://localhost:${PORT}`);
});