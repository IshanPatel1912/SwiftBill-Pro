import os
import sys
import shutil
import subprocess

def build(skip_pyinstaller=False):
    print("==================================================")
    print("      BILLING SYSTEM - STANDALONE EXE BUILDER     ")
    print("==================================================")

    root_dir = os.path.abspath(os.path.dirname(__file__))
    dist_dir = os.path.join(root_dir, "dist")
    build_dir = os.path.join(root_dir, "build")
    target_app_dir = os.path.join(dist_dir, "BillingSystem")

    if not skip_pyinstaller:
        # Step 1: Clean previous builds
        print("\n[1/5] Cleaning previous build artifacts...")
        for folder in [build_dir, dist_dir]:
            if os.path.exists(folder):
                try:
                    shutil.rmtree(folder)
                    print(f"  ✓ Cleaned {folder}")
                except Exception as e:
                    print(f"  ⚠️ Could not clean {folder}: {e}")

        # Step 2: Run PyInstaller
        print("\n[2/5] Running PyInstaller packaging...")
        cmd = [sys.executable, "-m", "PyInstaller", "--noconfirm", "BillingSystem.spec"]
        print(f"  Command: {' '.join(cmd)}")
        res = subprocess.run(cmd, cwd=root_dir)
        if res.returncode != 0:
            print("\n❌ PyInstaller packaging failed! Check errors above.")
            return False

        print("  ✓ Core application packaged successfully into dist/BillingSystem.")
    else:
        print("\n[INFO] Skipping PyInstaller step, finalizing assets & bridge...")

    # Step 3: Bundle WhatsApp Bridge
    print("\n[3/5] Bundling WhatsApp Node.js Bridge...")
    src_bridge = os.path.join(root_dir, "whatsapp_bridge")
    dest_bridge = os.path.join(target_app_dir, "whatsapp_bridge")

    if os.path.exists(src_bridge):
        try:
            if os.path.exists(dest_bridge):
                shutil.rmtree(dest_bridge)
            shutil.copytree(src_bridge, dest_bridge, ignore=shutil.ignore_patterns(".git", "*.log"))
            print(f"  ✓ Copied whatsapp_bridge/ to dist/BillingSystem/whatsapp_bridge/")
        except Exception as e:
            print(f"  ⚠️ Error copying whatsapp_bridge: {e}")
    else:
        print("  ⚠️ whatsapp_bridge directory not found!")

    # Step 4: Bundle Portable Node.js (Optional, makes app 100% standalone)
    print("\n[4/5] Checking for Node.js portable binary...")
    node_source_candidates = [
        r"C:\Program Files\nodejs\node.exe",
        os.path.join(root_dir, "node.exe")
    ]
    bundled_node = False
    for candidate in node_source_candidates:
        if os.path.exists(candidate):
            try:
                dest_node = os.path.join(target_app_dir, "node.exe")
                shutil.copy2(candidate, dest_node)
                print(f"  ✓ Bundled portable node.exe ({candidate}) -> dist/BillingSystem/node.exe")
                print("    (Application will now run WhatsApp on ANY PC without Node.js installed!)")
                bundled_node = True
                break
            except Exception as e:
                print(f"  ⚠️ Could not copy node.exe: {e}")

    if not bundled_node:
        print("  ℹ️ node.exe not found for bundling. Client PCs will need Node.js installed on their system.")

    # Step 5: Verify Critical Config, Assets & Fonts
    print("\n[5/5] Finalizing assets & config...")
    src_assets = os.path.join(root_dir, "assets")
    dest_assets = os.path.join(target_app_dir, "assets")
    if os.path.exists(src_assets):
        if os.path.exists(dest_assets):
            shutil.rmtree(dest_assets)
        shutil.copytree(src_assets, dest_assets)
        print("  ✓ Copied assets/ directory")

    for fname in ["config.ini", "app_icon.ico", "arial.ttf"]:
        src_f = os.path.join(root_dir, fname)
        dest_f = os.path.join(target_app_dir, fname)
        if os.path.exists(src_f) and not os.path.exists(dest_f):
            shutil.copy2(src_f, dest_f)
            print(f"  ✓ Copied {fname}")

    # Step 6: Build Inno Setup Installer (Single .exe)
    iscc_candidates = [
        r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        r"C:\Program Files\Inno Setup 6\ISCC.exe",
        "ISCC.exe"
    ]
    iscc_path = None
    for c in iscc_candidates:
        if os.path.exists(c) or shutil.which(c):
            iscc_path = c
            break

    iss_file = os.path.join(root_dir, "installer.iss")
    setup_file_path = None
    if iscc_path and os.path.exists(iss_file):
        print("\n[Optional 6/6] Compiling Inno Setup Installer (BillingSystem_Setup.exe)...")
        res_iss = subprocess.run([iscc_path, iss_file], cwd=root_dir)
        if res_iss.returncode == 0:
            setup_file_path = os.path.join(root_dir, "dist_installer", "BillingSystem_Setup.exe")
            print(f"  ✓ Single-file Setup Installer ready at: {setup_file_path}")

    print("\n==================================================")
    print("      ✓ BUILD COMPLETED SUCCESSFULLY!             ")
    print("==================================================")
    if setup_file_path and os.path.exists(setup_file_path):
        print(f"\n📦 SINGLE-FILE INSTALLER (Share this file):")
        print(f"   {setup_file_path}")
    print(f"\n📁 Standalone Folder:")
    print(f"   {target_app_dir}")
    print("==================================================")
    return True

if __name__ == "__main__":
    skip = "--skip-pyinstaller" in sys.argv
    success = build(skip_pyinstaller=skip)
    sys.exit(0 if success else 1)
