#!/usr/bin/env python3
import uvicorn

if __name__ == "__main__":
    print("正在启动服务器...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
