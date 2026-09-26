from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class DomainError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFoundError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, 404)


class ConflictError(DomainError):
    def __init__(self, message: str) -> None:
        super().__init__(message, 409)


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(_: Request, error: DomainError) -> JSONResponse:
        return JSONResponse(status_code=error.status_code, content={"message": error.message})
