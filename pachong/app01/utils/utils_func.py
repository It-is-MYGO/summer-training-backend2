from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options  # Edge专用Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium import webdriver
from time import sleep
import random
from pathlib import Path  # 正确导入Path类


# 提取字符串中的连续数字
def draw_num(str_data):
    """
    :param str_data: 字符串类型
    :return: 只含数字的字符串
    """
    num_filter = filter(str.isdigit, str_data)
    num_list = list(num_filter)
    num_str = "".join(num_list)
    return num_str


# 无头浏览与规避检测
def avoid_check():
    """
    :return: 浏览器窗口
    """
    option = Options()
    option.add_argument("--disable-blink-features=AutomationControlled")
    option.add_experimental_option("excludeSwitches", ["enable-automation"])
    option.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    option.add_argument('--headless')
    option.add_argument('--disable-gpu')
    option.add_experimental_option('excludeSwitches', ['enable-automation'])
    
    # 指定 msedgedriver.exe 的路径
    driver_path = Path(__file__).parent.parent.parent / "msedgedriver.exe"  # 确保文件存在
    bro = webdriver.Edge(service=Service(str(driver_path)), options=option)  # 使用Edge
    return bro

def handle_taobao_slider(browser):
    """专为淘宝优化的滑块处理"""
    try:
        # 等待滑块元素加载（淘宝的滑块ID为nc_1_n1z）
        slider = WebDriverWait(browser, 15).until(
            EC.presence_of_element_located((By.ID, "nc_1_n1z"))
        )
        
        # 模拟人类滑动轨迹
        action = ActionChains(browser)
        action.click_and_hold(slider).perform()
        
        # 生成变速滑动轨迹（淘宝需要先快速后慢速）
        for track in [30, 60, 40, 30, 20, 10, 5, 3, 2, 1]:
            action.move_by_offset(track, random.randint(-2, 2)).perform()
            sleep(random.uniform(0.1, 0.3))
        
        action.release().perform()
        print("淘宝滑块验证完成")
        return True
    except Exception as e:
        print(f"滑块处理失败: {str(e)}")
        return False
# 获取cookies
def get_cookies(url):
    bro = avoid_check()
    bro.get(url)
    sleep(20)
    # 滑动验证
    # 查找拖动按钮和目标位置
    # slid_btn = bro.find_element('id', value='nc_1_n1z')
    # target = bro.find_element(By.ID, 'nc_1__bg')
    # # 获取拖动按钮的位置和大小
    # slid_btn_size = slid_btn.size
    # slid_btn_loc = slid_btn.location
    # # 计算目标位置的x坐标
    # target_x = target.location['x'] - slid_btn_loc['x'] + slid_btn_size['width'] - 10
    # # 创建ActionChains对象，执行拖动操作
    # actions = ActionChains(bro)
    # actions.click_and_hold(slid_btn).move_by_offset(target_x, 0).release().perform()
    cookies = bro.get_cookies()
    return cookies


if __name__ == "__main__":
    url = 'https://login.taobao.com/member/login.jhtml'
    get_cookies(url)
