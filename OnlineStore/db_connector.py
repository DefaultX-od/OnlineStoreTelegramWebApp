import os

import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def connect():
    dbname = os.getenv('db_name')
    user = os.getenv('db_user')
    password = os.getenv('db_user_pswd')
    host = os.getenv('db_host_name')

    try:
        conn = mysql.connector.connect(
            database=dbname,
            user=user,
            password=password,
            host=host
        )
        print("Успешное подключение к БД!")
        return conn
    except mysql.connector.Error as err:
        print(f'Ошибка подключения к БД: {err}')
        return None