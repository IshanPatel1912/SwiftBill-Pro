# modules/whatsapp_service.py
import os
import sys
import subprocess
import logging
import requests
import atexit
import configparser

_whatsapp_proc = None

BASE_URL = "http://localhost:3000"

def get_bridge_dir():
    """Locates the whatsapp_bridge directory, handling frozen PyInstaller executables."""
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(sys.executable)
        local_bridge = os.path.join(exe_dir, "whatsapp_bridge")
        if os.path.exists(local_bridge):
            return local_bridge
        mei_bridge = os.path.join(getattr(sys, '_MEIPASS', ''), "whatsapp_bridge")
        if os.path.exists(mei_bridge):
            return mei_bridge
        return local_bridge
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "whatsapp_bridge"))

def get_node_executable():
    """Finds node binary (local portable node.exe in app folder or system PATH)."""
    bridge_dir = get_bridge_dir()
    candidates = [
        os.path.join(bridge_dir, "node.exe"),
        os.path.join(os.path.dirname(bridge_dir), "node.exe"),
    ]
    if getattr(sys, 'frozen', False):
        candidates.append(os.path.join(os.path.dirname(sys.executable), "node.exe"))

    for c in candidates:
        if os.path.exists(c):
            return c
    return "node"

def get_config_file_path():
    """Gets config.ini path, preferring next to executable when frozen."""
    if getattr(sys, 'frozen', False):
        p = os.path.join(os.path.dirname(sys.executable), 'config.ini')
        if os.path.exists(p):
            return p
    return 'config.ini'

def is_whatsapp_enabled() -> bool:
    """Checks config.ini to see if the user has enabled automatic WhatsApp messaging."""
    try:
        cfg = configparser.ConfigParser()
        cfg_path = get_config_file_path()
        cfg.read(cfg_path, encoding='utf-8')
        return cfg.getboolean('SETTINGS', 'whatsapp_enabled', fallback=True)
    except Exception:
        return True

def set_whatsapp_enabled(enabled: bool):
    """Saves the user's preference to enable/disable WhatsApp messaging in config.ini."""
    try:
        cfg = configparser.ConfigParser()
        cfg_path = get_config_file_path()
        cfg.read(cfg_path, encoding='utf-8')
        if 'SETTINGS' not in cfg:
            cfg['SETTINGS'] = {}
        cfg['SETTINGS']['whatsapp_enabled'] = str(enabled)
        with open(cfg_path, 'w', encoding='utf-8') as f:
            cfg.write(f)
    except Exception as e:
        logging.warning(f"Failed to save whatsapp_enabled setting: {e}")

def enable_whatsapp():
    """Turns WhatsApp messaging ON, saves setting, and starts the background service."""
    set_whatsapp_enabled(True)
    start_whatsapp_service()
    print("[WHATSAPP LOG] ▶️ WhatsApp Messaging ENABLED and STARTED.")

def disable_whatsapp():
    """Turns WhatsApp messaging OFF, saves setting, and stops the background service."""
    set_whatsapp_enabled(False)
    stop_whatsapp_service()
    print("[WHATSAPP LOG] ⏹️ WhatsApp Messaging DISABLED and STOPPED.")

def is_service_running() -> bool:
    """Checks if background Node.js process is active."""
    global _whatsapp_proc
    return _whatsapp_proc is not None and _whatsapp_proc.poll() is None

def start_whatsapp_service():
    """
    Starts the local Node.js WhatsApp bridge silently in the background.
    Hides all terminal/cmd windows using CREATE_NO_WINDOW.
    """
    global _whatsapp_proc
    if _whatsapp_proc and _whatsapp_proc.poll() is None:
        return _whatsapp_proc

    bridge_dir = get_bridge_dir()
    server_js = os.path.join(bridge_dir, "server.js")

    if not os.path.exists(server_js):
        logging.warning(f"whatsapp_bridge/server.js not found at {server_js}")
        return None

    node_cmd = get_node_executable()

    try:
        creationflags = 0
        if sys.platform == "win32":
            creationflags = subprocess.CREATE_NO_WINDOW

        _whatsapp_proc = subprocess.Popen(
            [node_cmd, "server.js"],
            cwd=bridge_dir,
            creationflags=creationflags,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        logging.info(f"WhatsApp background service started (PID: {_whatsapp_proc.pid}) using '{node_cmd}'")
        return _whatsapp_proc
    except Exception as e:
        logging.warning(f"Failed to start WhatsApp background service: {e}")
        return None

def stop_whatsapp_service():
    """
    Terminates the WhatsApp background service on application exit or user stop.
    """
    global _whatsapp_proc
    if _whatsapp_proc:
        try:
            pid = _whatsapp_proc.pid
            if sys.platform == "win32":
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], 
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                _whatsapp_proc.terminate()
        except Exception:
            pass
        _whatsapp_proc = None
        logging.info("WhatsApp background service stopped.")

atexit.register(stop_whatsapp_service)

def get_whatsapp_status():
    """Returns (is_connected: bool, phone_number: str|None, has_qr: bool)"""
    try:
        res = requests.get(f"{BASE_URL}/api/status", timeout=2)
        if res.status_code == 200:
            data = res.json()
            return data.get("connected", False), data.get("phone", None), data.get("hasQR", False)
    except Exception:
        pass
    return False, None, False

def get_whatsapp_qr_image():
    """Returns Base64 image data string or None"""
    try:
        res = requests.get(f"{BASE_URL}/api/qr", timeout=3)
        if res.status_code == 200:
            data = res.json()
            return data.get("image", None)
    except Exception:
        pass
    return None

def logout_whatsapp():
    """Logs out and clears saved WhatsApp session"""
    try:
        res = requests.post(f"{BASE_URL}/api/logout", timeout=5)
        return res.status_code == 200
    except Exception:
        return False
