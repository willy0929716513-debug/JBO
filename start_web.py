#!/usr/bin/env python3
"""Launch the NPB AI 分析儀表板."""
import subprocess
import sys
import os

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(os.environ.get("PORT", 8000))
    print(f"╔══════════════════════════════════════════╗")
    print(f"║   NPB AI 分析儀表板 啟動中...              ║")
    print(f"║   http://localhost:{port}                    ║")
    print(f"╚══════════════════════════════════════════╝")
    print(f"\n賠率 API Key 請在網頁右上角設定。")
    print(f"免費申請：https://the-odds-api.com\n")
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "web.app:app",
        "--host", "0.0.0.0",
        "--port", str(port),
        "--reload",
    ])
