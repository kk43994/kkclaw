import pyautogui
import time
from datetime import datetime

# 截图保存路径
output_dir = r"C:\Users\zhouk\Desktop\02_开发项目\desktop-pet\docs\images"

# 等待2秒准备
print("准备截图，请切换到桌面龙虾窗口...")
time.sleep(2)

# 截图1: 桌面龙虾主界面
print("截图1: 主界面...")
screenshot1 = pyautogui.screenshot()
screenshot1.save(f"{output_dir}/main-interface.png")
print("✅ 保存: main-interface.png")

time.sleep(1)

# 截图2: 全屏展示
print("截图2: 全屏展示...")
screenshot2 = pyautogui.screenshot()
screenshot2.save(f"{output_dir}/desktop-view.png")
print("✅ 保存: desktop-view.png")

print("\n🎉 截图完成！")
print(f"保存位置: {output_dir}")
