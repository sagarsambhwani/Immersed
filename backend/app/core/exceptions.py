from fastapi import HTTPException, status

class ChatbotException(Exception):
    """Base exception for chatbot errors."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class SessionNotFoundException(ChatbotException):
    """Raised when a chat session is not found in the database."""
    def __init__(self, session_id: str):
        super().__init__(
            message=f"Chat session '{session_id}' not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )

class LLMProviderException(ChatbotException):
    """Raised when an LLM provider encounters an error."""
    def __init__(self, provider: str, details: str):
        super().__init__(
            message=f"LLM Provider '{provider}' error: {details}",
            status_code=status.HTTP_502_BAD_GATEWAY
        )

class ConfigurationException(ChatbotException):
    """Raised when application configuration is invalid or missing."""
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST
        )
