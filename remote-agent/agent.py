import socketio
import time
import psutil  # Thư viện quét tài nguyên hệ thống
import os
import io
import base64
import threading
import mss  # Thư viện chụp màn hình siêu tốc bằng phần cứng
from PIL import Image  # Chỉ giữ lại cấu phần xử lý ảnh cơ bản để nén/resize

sio = socketio.Client()

# Cấu hình tên máy trạm - Máy 1 để 'Kali_Lab_01', máy 2 sửa thành 'Kali_Lab_02'
MACHINE_NAME = 'Kali_Lab_01' 

# Biến cờ (Flag) để kiểm soát trạng thái Live Stream
is_streaming_screen = False

@sio.event
def connect():
    print(f"\n✅ [SUCCESS] Đã kết nối thành công tới Server với tên: {MACHINE_NAME}")
    sio.emit('agent_register', {'machine_name': MACHINE_NAME})

@sio.event
def disconnect():
    global is_streaming_screen
    is_streaming_screen = False
    print("❌ [DISCONNECTED] Đã mất kết nối tới Server.")

# HÀM CHỤP MÀN HÌNH VÀ CHUYỂN THÀNH BASE64 (DÙNG MSS TỐI ƯU TỐC ĐỘ)
def capture_screen_to_base64():
    try:
        with mss.mss() as sct:
            # Lấy thông tin màn hình chính (Màn hình 1)
            monitor = sct.monitors[1]
            sct_img = sct.grab(monitor)
            
            # Chuyển raw bytes từ mss sang định dạng PIL Image để xử lý nén/hạ độ phân giải
            img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
            
            # ÉP HẠ ĐỘ PHÂN GIẢI: Giảm xuống kích thước 960x540 để giảm dung lượng gói tin qua socket
            img = img.resize((960, 540), Image.Resampling.LANCZOS)
            
            buffer = io.BytesIO()
            # Lưu ảnh vào bộ nhớ tạm dưới định dạng JPEG với chất lượng 45% (Tối ưu tuyệt đối cho 30 FPS)
            img.save(buffer, format="JPEG", quality=45)
            
            # Mã hóa binary của ảnh sang chuỗi mã Base64
            img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        print(f"❌ Lỗi khi chụp màn hình: {e}")
        return None

# HÀM GỬI ẢNH MÀN HÌNH ĐƠN LẺ
def send_single_screenshot():
    base64_image = capture_screen_to_base64()
    if base64_image:
        sio.emit('agent_send_screen', {'machine_name': MACHINE_NAME, 'image_base64': base64_image})
        print("📸 Đã gửi ảnh chụp màn hình đơn lẻ về Server.")

# LUỒNG CHẠY LIVE STREAM MÀN HÌNH SIÊU MƯỢT (~30 FPS)
def screen_stream_worker():
    global is_streaming_screen
    print("🚀 Bắt đầu luồng Live Stream màn hình mượt mà (30 FPS)...")
    
    TARGET_FPS = 30
    FRAME_INTERVAL = 1.0 / TARGET_FPS  # ~ 0.033 giây mỗi khung hình

    while is_streaming_screen:
        start_time = time.time()
        
        if sio.connected:
            base64_image = capture_screen_to_base64()
            if base64_image:
                sio.emit('agent_send_screen', {'machine_name': MACHINE_NAME, 'image_base64': base64_image})
        
        # Tính toán thời gian thực thi của tác vụ chụp/gửi để trừ hao thời gian sleep nhằm giữ chuẩn FPS
        elapsed_time = time.time() - start_time
        sleep_time = FRAME_INTERVAL - elapsed_time
        if sleep_time > 0:
            time.sleep(sleep_time)
            
    print("🛑 Đã dừng luồng Live Stream màn hình.")

# LẮNG NGHE LỆNH TỪ SERVER GỬI XUỐNG
@sio.on('server_to_agent_cmd')
def on_command(data):
    global is_streaming_screen
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
            pid = int(detail.split()[1]) 
            p = psutil.Process(pid)
            p.terminate() 
            print(f"✅ Đã đóng tiến trình PID {pid} thành công.")
            send_processes()
        except Exception as e:
            print(f"❌ Không thể đóng tiến trình: {e}")

    # XỬ LÝ CÁC HÀNH ĐỘNG SCREENSHOT VÀ LIVESTREAM 30 FPS
    elif action == 'SCREENSHOT':
        send_single_screenshot()

    elif action == 'START_STREAM':
        if not is_streaming_screen:
            is_streaming_screen = True
            # Khởi tạo luồng Thread chạy nền độc lập để không block chu kỳ quét dữ liệu hệ thống
            stream_thread = threading.Thread(target=screen_stream_worker, daemon=True)
            stream_thread.start()

    elif action == 'STOP_STREAM':
        is_streaming_screen = False

# HÀM QUÉT VÀ GỬI PROCESSES THẬT LÊN SERVER
def send_processes():
    try:
        process_list = []
        for proc in sorted(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']), 
                           key=lambda p: p.info['cpu_percent'] or 0, reverse=True)[:15]:
            
            ram_mb = round(proc.info['memory_info'].rss / (1024 * 1024), 1)
            
            process_list.append({
                'pid': proc.info['pid'],
                'name': proc.info['name'],
                'cpu': f"{proc.info['cpu_percent'] or 0.0}%",
                'ram': f"{ram_mb} MB"
            })
            
        sio.emit('agent_send_procs', {'machine_name': MACHINE_NAME, 'processes': process_list})
    except Exception as e:
        print(f"Lỗi quét tiến trình: {e}")

if __name__ == '__main__':
    try:
        # Thay đổi IP Server cho đúng với kiến trúc Lab của bạn
        sio.connect('http://10.0.2.2:5000')
        
        while True:
            if sio.connected:
                send_processes()
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nĐang tắt Agent...")
        is_streaming_screen = False
        sio.disconnect()