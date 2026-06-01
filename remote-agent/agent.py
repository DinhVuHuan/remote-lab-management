import socketio
import time
import psutil  # Thư viện quét tài nguyên hệ thống
import os

sio = socketio.Client()

# Cấu hình tên máy trạm - Máy 1 để 'Kali_Lab_01', máy 2 sửa thành 'Kali_Lab_02'
MACHINE_NAME = 'Kali_Lab_01' 

@sio.event
def connect():
    print(f"\n✅ [SUCCESS] Đã kết nối thành công tới Server với tên: {MACHINE_NAME}")
    sio.emit('agent_register', {'machine_name': MACHINE_NAME})

@sio.event
def disconnect():
    print("❌ [DISCONNECTED] Đã mất kết nối tới Server.")

# LẮNG NGHE LỆNH TỪ SERVER GỬI XUỐNG
@sio.on('server_to_agent_cmd')
def on_command(data):
    action = data.get('action')
    detail = data.get('detail')
    print(f"🎮 Nhận lệnh từ Web: [{action}] - Chi tiết: [{detail}]")

    if action == 'SHUTDOWN':
        print("⚠️ Đang thực thi lệnh tắt máy vật lý...")
        os.system('shutdown -h now')
        
    elif action == 'RESTART':
        print("⚠️ Đang thực thi lệnh khởi động lại...")
        os.system('reboot')

    elif action == 'KILL_PROCESS':
        try:
            # detail nhận vào sẽ là chuỗi chứa PID, ta tách lấy số PID để kill
            pid = int(detail.split()[1]) 
            p = psutil.Process(pid)
            p.terminate() # Ra lệnh đóng tiến trình
            print(f"✅ Đã đóng tiến trình PID {pid} thành công.")
            # Gửi lại danh sách mới ngay lập tức sau khi kill
            send_processes()
        except Exception as e:
            print(f"❌ Không thể đóng tiến trình: {e}")

# HÀM QUÉT VÀ GỬI PROCESSES THẬT LÊN SERVER
def send_processes():
    try:
        process_list = []
        # Lấy top 15 tiến trình ngốn CPU hoặc đang hoạt động để tránh quá tải băng thông
        for proc in sorted(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']), 
                           key=lambda p: p.info['cpu_percent'] or 0, reverse=True)[:15]:
            
            # Tính dung lượng RAM tiêu thụ theo MB cho dễ đọc
            ram_mb = round(proc.info['memory_info'].rss / (1024 * 1024), 1)
            
            process_list.append({
                'pid': proc.info['pid'],
                'name': proc.info['name'],
                'cpu': f"{proc.info['cpu_percent'] or 0.0}%",
                'ram': f"{ram_mb} MB"
            })
            
        # Phát tín hiệu gửi data lên Server
        sio.emit('agent_send_procs', {'machine_name': MACHINE_NAME, 'processes': process_list})
    except Exception as e:
        print(f"Lỗi quét tiến trình: {e}")

if __name__ == '__main__':
    try:
        sio.connect('http://10.0.2.2:5000')
        
        # Tạo vòng lặp gửi dữ liệu tiến trình định kỳ mỗi 5 giây một lần (Realtime Monitor)
        while True:
            if sio.connected:
                send_processes()
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nĐang tắt Agent...")
        sio.disconnect()
