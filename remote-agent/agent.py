import socketio
import time
import os

# Khởi tạo Socket.io Client
sio = socketio.Client()

@sio.event
def connect():
    print("\n✅ [SUCCESS] Đã kết nối thành công tới Windows Server!")
    # Đăng ký tên máy với Server ngay khi kết nối thành công
    sio.emit('agent_register', {'machine_name': 'Kali_Lab_01'})

@sio.event
def disconnect():
    print("❌ [DISCONNECTED] Mất kết nối với Server!")

@sio.on('server_to_agent_cmd')
def on_command(data):
    print(f"📥 Nhận lệnh từ Server: {data['action']}")
    if data['action'] == 'SHUTDOWN':
        print("⚠️ Đang thực thi lệnh tắt máy Linux...")
        os.system("shutdown -h now") # Lệnh tắt nguồn trên Kali Linux

if __name__ == '__main__':
    # IP Gateway mặc định của chế độ mạng NAT trong VirtualBox
    server_url = 'http://10.0.2.2:5000'
    
    print(f"[*] Đang thử kết nối tới Server tại {server_url}...")
    
    while True:
        try:
            if not sio.connected:
                sio.connect(server_url)
                sio.wait()
        except Exception as e:
            print("⚠️ Không thể kết nối tới Server. Thử lại sau 5 giây...")
            time.sleep(5)