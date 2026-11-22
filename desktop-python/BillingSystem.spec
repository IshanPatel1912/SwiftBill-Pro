# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        ('config.ini', '.'),
        ('app_icon.ico', '.'),
        ('arial.ttf', '.'),
        ('arialbd.ttf', '.'),
        ('arialbi.ttf', '.'),
        ('ariali.ttf', '.'),
        ('ARIALN.TTF', '.'),
        ('ARIALNB.TTF', '.'),
        ('ARIALNBI.TTF', '.'),
        ('ARIALNI.TTF', '.'),
        ('ariblk.ttf', '.'),
        ('poppler', 'poppler'),
        ('assets', 'assets'),
    ],
    hiddenimports=[
        'PyQt6',
        'PyQt6.QtCore',
        'PyQt6.QtGui',
        'PyQt6.QtWidgets',
        'PyQt6.QtPrintSupport',
        'sqlalchemy',
        'sqlalchemy.orm',
        'sqlalchemy.dialects.sqlite',
        'bcrypt',
        'reportlab',
        'requests',
        'openpyxl',
        'pdf2image',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='BillingSystem',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='app_icon.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='BillingSystem',
)
