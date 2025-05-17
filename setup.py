import subprocess
import sys
import os

def setup_project():
    
    try:
        subprocess.run(['wget', 'https://github.com/DefaultX-od/OnlineStoreTelegramWebApp/archive/refs/heads/main.zip'], check=True)
        print('Файлы проекта были успешно загружены!')
    except:
        print('Неудалось загрузить файлы проекта!')
        sys.exit(1)

    try:
        subprocess.run(['unzip', '-o','main.zip'], check=True, capture_output=True, text=True)
        
        print('Файлы проекта были успешно распакованы!')
    except:
        print('Неудалось распокавать файлы проекта!')
        sys.exit(1)
    
    try:
        subprocess.run('mv OnlineStoreTelegramWebApp-main/* .', shell=True, check=True, executable="/bin/bash")
    except:
        pass

    try:
        subprocess.run(['rm', '-r', 'OnlineStoreTelegramWebApp-main'], check=True)
        subprocess.run(['rm', 'main.zip'], check=True)
    except:
        pass

    try:
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
        print('Виртуальное окружение создано!')
    
    except subprocess.CalledProcessError as e:
        print('Ошибка создания виртуального окружения')
        sys.exit(1)

    pip_path = os.path.join('venv', 'bin', 'pip')
    

    print (pip_path)

    req_file = 'requirements.txt'

    if not os.path.exists(req_file):
        print('Файл с зависимостями не найден!')
        sys.exit(1)
    
    try:
        subprocess.run([pip_path, 'install', '-r', req_file], check=True)
        print('Зависимости были успешно установлены!')
    except:
        print('Ошибка установки зависимостей')
        sys.exit(1)

    python_path = os.path.abspath(os.path.join('venv', 'bin', 'python'))
    site_packages_path = subprocess.check_output([python_path, '-c', "import sysconfig; print(sysconfig.get_path('purelib'))"], text=True).strip()


    passenger_wsgi_content = f"""import sys, os
sys.path.append('{os.path.abspath(os.curdir)}')
sys.path.append('{os.path.join(os.path.abspath(os.curdir), "OnlineStore")}')
sys.path.append('{site_packages_path}')
from OnlineStore import app as application
from werkzeug.debug import DebuggedApplication
application.wsgi_app = DebuggedApplication(application.wsgi_app, False)
application.debug = False
"""

    
    try:
        with open("passenger_wsgi.py", "w") as f:
            f.write(passenger_wsgi_content)
            print("Файл passenger_wsgi.py успешно создан!")
    except Exception as e:
        print(f"Ошибка создания файла: {str(e)}")
        sys.exit(1)

    htaccess_content = f"""PassengerEnabled On
PassengerPython {python_path}
"""
    
    try:
        with open(".htaccess", "w") as f:
            f.write(htaccess_content)
            print("Файл .htaccess успешно создан!")
    except Exception as e:
        print(f"Ошибка создания файла: {str(e)}")
        sys.exit(1)

    try:
        subprocess.run(['ln', '-s','public_html', 'public'], check=True)        
        print('Необходимые ссылки были созданы успешно!')
    except:
        print('Неудалось создать необходимые ссылки!')
        sys.exit(1)

    try:
        subprocess.run(['mkdir', 'tmp'], check=True)        
        print('Дирректория для перезапуска успешно создана!')
    except:
        print('Неудалось создать дирректорию для перезапуска!')
        sys.exit(1)

setup_project()