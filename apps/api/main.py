from fastapi import FastAPI
import uvicorn
from src.routes.auth import router as auth_router
from src.routes.chat import router as chat_router

app = FastAPI(
    title="Gmail API Authentication & Agent Chat",
    description="FastAPI application with Gmail OAuth integration and AI agent chat",
    version="1.0.0"
)

# Include authentication routes
app.include_router(auth_router)
# Include chat routes
app.include_router(chat_router)

@app.get("/")
def read_root():
    return {
        "message": "Gmail API Authentication & Agent Chat Server",
        "endpoints": {
            "auth": {
                "login": "/auth/gmail/login",
                "callback": "/auth/gmail/callback",
                "status": "/auth/gmail/status"
            },
            "chat": {
                "send": "/chat/send",
                "stream": "/chat/stream",
                "health": "/chat/health",
                "thread_info": "/chat/threads/{thread_id}"
            }
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)