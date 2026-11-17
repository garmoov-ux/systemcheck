import pandas as pd
import os
import telnetlib
import time
import logging
import json
import requests


class Log:
    def __init__(self, logger_name):
        self.file_name = None
        self.logger = logging.getLogger(logger_name)
        self.logger.setLevel(logging.INFO)
        self.formatter = logging.Formatter('[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s')

    def setup_handler(self):
        if self.logger.hasHandlers():
            self.logger.handlers.clear()
        self.stream_handler = logging.StreamHandler()
        self.stream_handler.setFormatter(self.formatter)
        self.file_handler = logging.FileHandler(self.file_name, mode='a', encoding='utf-8')
        self.file_handler.setFormatter(self.formatter)
        self.logger.addHandler(self.file_handler)
        self.logger.addHandler(self.stream_handler)


def check_telnet(ip, port, timeout=5):
    try:
        tn = telnetlib.Telnet(ip, port, timeout=timeout)
        tn.close()
        return 1
    except Exception as e:
        return 0


def check_ports(ip, ports, log, device_id):
    url = 'http://192.168.9.113:8088/api/v2/KeepAlive'

    data = {
        'REGLTEQPMN_ID': ''
    }

    count = 0

    for port in ports:
        result = check_telnet(ip, port)

        if result:
            log.logger.info(f'{device_id} -> {ip}:{port} 포트 연결 성공')

            data['REGLTEQPMN_ID'] = device_id

            json_data = json.dumps(data)

            log.logger.info(f'URL -> {url}')
            log.logger.info(f'JSON -> {data}')

            response = requests.post(url=url, json=data)

            log.logger.info(f'응답코드 -> {response.status_code}')

            if response.status_code == 200:
                log.logger.info(f'{device_id} -> KeepAlive 성공')
            else:
                log.logger.info(f'{device_id} -> KeepAlive 실패')
        else:
            log.logger.warning(f'{device_id} -> {ip}:{port} 포트 연결 실패')
            log.logger.info(f'{device_id} -> KeepAlive 실패')

        count += result

    return count


def run(df, file_path):
    log = Log('device_check')

    for i, row in df.iterrows():
        log.file_name = f"{config['path']['log']}/{time.strftime('%Y%m%d')}_device_check.log"
        log.setup_handler()
        device_id = row['DeviceId']
        ip = row['Ip']
        mstsc_port = row['PortMS']
        vnc_port = row['PortVNC']

        count = 0

        ping_command = f'ping -n 1 {ip} > nul'
        check = os.system(ping_command)

        log.logger.info(f'장비번호: {device_id}')
        log.logger.info(f'아이피: {ip}')

        if check == 0:
            count += 1
            log.logger.info('핑테스트: 정상')

            count += check_ports(ip, [mstsc_port, vnc_port], log, device_id)

            if count > 1:
                df.at[i, 'Status'] = 'Up'
                log.logger.info('상태: 정상')
            else:
                df.at[i, 'Status'] = 'Down'
                log.logger.warning('상태: 비정상')
        else:
            log.logger.info('핑테스트: 비정상')

            count += check_ports(ip, [mstsc_port, vnc_port], log, device_id)

            if count > 0:
                df.at[i, 'Status'] = 'Up'
                log.logger.info('상태: 정상')
            else:
                df.at[i, 'Status'] = 'Down'
                log.logger.warning('상태: 비정상')

        check_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
        df.at[i, 'CheckTime'] = check_time

        log.logger.info(f'체크시간: {check_time}')

        df.to_csv(file_path, index=False, encoding='cp949')


if __name__ == '__main__':
    config_path = 'config.json'

    try:
        if not os.path.isfile(config_path):
            json_data = {
                'path': {
                    'log': './log',
                    'check': './check',
                },
                'check_time': 5,
            }

            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=4)

        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        if not os.path.isdir(config['path']['log']):
            os.makedirs(config['path']['log'], exist_ok=True)

        if not os.path.isdir(config['path']['check']):
            os.makedirs(config['path']['check'], exist_ok=True)

        log = Log('system')
        log.file_name = f"{config['path']['log']}/{time.strftime('%Y%m%d')}_system_check.log"
        log.setup_handler()
    except Exception as e:
        log.logger.error('[설정 파일 읽기 오류]')
        log.logger.error(f'{e}')
        exit(1)

    file_path = f"{config['path']['check']}/data.csv"

    try:
        df = pd.read_csv(file_path, encoding='cp949')
    except Exception as e:
        log.logger.error('[데이터 파일 읽기 오류]')
        log.logger.error(f'{e}')
        exit(1)

    check_time = config['check_time']

    log.logger.info('[장비 상태 체크 시작]')

    try:
        while True:
            run(df, file_path)
            time.sleep(check_time)

            log.file_name = f"{config['path']['log']}/{time.strftime('%Y%m%d')}_system_check.log"
            log.setup_handler()
    except KeyboardInterrupt:
        log.logger.info('[장비 상태 체크 종료]')
        exit(0)
