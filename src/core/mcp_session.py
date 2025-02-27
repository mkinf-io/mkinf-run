from e2b import Sandbox
import anyio
import mcp.types as types
import anyio.lowlevel
import anyio.to_thread
import anyio.from_thread
from contextlib import AsyncExitStack
from mcp import ClientSession
from typing import Optional
from src.core.stdio_client import stdio_client
from typing import TypedDict

class MCPSession:
    def __init__(self, owner: str, repo: str, version: Optional[str], template_id: str, bootstrap_command: str, envs: Optional[dict[str, str]] = None):
      self.owner = owner
      self.repo = repo
      self.version = version
      self.template_id = template_id
      self.bootstrap_command = bootstrap_command
      self.envs = envs

    class SessionInfo(TypedDict):
        sandbox_id: str
        pid: int

    async def start(self, timeout: int = 60) -> Optional[SessionInfo]:
      async with AsyncExitStack() as exit_stack:
        sandbox = Sandbox(self.template_id, timeout=timeout, envs=self.envs)
        stdio_transport = await exit_stack.enter_async_context(stdio_client(
            sandbox,
            bootstrap_command=(
                f"cd /{self.repo} &&\n"
                "stty -echo &&\n"  # Disable terminal echo
                f"{self.bootstrap_command}\n"
            ),
            timeout=timeout
        ))
        stdio, write, ptyReader = stdio_transport
        session: ClientSession = await exit_stack.enter_async_context(ClientSession(stdio, write))
        await session.initialize()
        return {
          "sandbox_id": sandbox.sandbox_id,
          "pid": ptyReader.pid
        }
      return None

    async def list_tools(self, sandbox_id: str, pid: int, timeout: int = 60):
      start_time = anyio.current_time()
      async with AsyncExitStack() as exit_stack:
        sandbox = Sandbox.connect(sandbox_id)
        sandbox.set_timeout(timeout)
        stdio_transport = await exit_stack.enter_async_context(stdio_client(
            sandbox,
            pid=pid,
            timeout=timeout
        ))
        stdio, write, ptyReader = stdio_transport
        session = await exit_stack.enter_async_context(ClientSession(stdio, write))
        tools = await session.list_tools()
        end_time = anyio.current_time()
        print(f"Total time: {end_time - start_time}")
        return {
          "tools": tools,
          "run_seconds": end_time - start_time,
        }

    async def run(self, sandbox_id: str, pid: int, action: str, args: Optional[dict] = None, timeout: int = 60):
      start_time = anyio.current_time()
      async with AsyncExitStack() as exit_stack:
        sandbox = Sandbox.connect(sandbox_id)
        sandbox.set_timeout(timeout)
        stdio_transport = await exit_stack.enter_async_context(stdio_client(
            sandbox,
            pid=pid,
            timeout=timeout
        ))
        stdio, write, ptyReader = stdio_transport
        session = await exit_stack.enter_async_context(ClientSession(stdio, write))
        response = await session.call_tool(
            name=action,
            arguments=args
        )
        end_time = anyio.current_time()
        print(f"Total time: {end_time - start_time}")
        return {
          "response": response,
          "run_seconds": end_time - start_time,
        }

    async def close(self, sandbox_id: str):
        killed = Sandbox.kill(sandbox_id)
        return {
          "success": killed,
        }

    async def list_tools_once(self, timeout: int = 60):
      start_time = anyio.current_time()
      async with AsyncExitStack() as exit_stack:
        sandbox = Sandbox(self.template_id, timeout=timeout, envs=self.envs)
        stdio_transport = await exit_stack.enter_async_context(stdio_client(
            sandbox,
            bootstrap_command=(
                f"cd /{self.repo} &&\n"
                "stty -echo &&\n"  # Disable terminal echo
                f"{self.bootstrap_command}\n"
            ),
            timeout=timeout
        ))
        stdio, write, ptyReader = stdio_transport
        session = await exit_stack.enter_async_context(ClientSession(stdio, write))
        # await session.initialize()
        # Why should i wait the initialization? Lets skip it
        # Skip initialization
        await session.send_notification(
            types.ClientNotification(types.InitializedNotification(method="notifications/initialized"))
        )
        tools = await session.list_tools()
        ptyReader.kill()
        sandbox.kill()
        end_time = anyio.current_time()
        print(f"Total time: {end_time - start_time}")
        return {
          "tools": tools,
          "run_seconds": end_time - start_time,
        }

    async def run_once(self, action: str, args: Optional[dict] = None, timeout: int = 60):
      start_time = anyio.current_time()
      async with AsyncExitStack() as exit_stack:
          sandbox = Sandbox(self.template_id, timeout=timeout, envs=self.envs)
          stdio_transport = await exit_stack.enter_async_context(stdio_client(
              sandbox,
              bootstrap_command=(
                  f"cd /{self.repo} &&\n"
                  "stty -echo &&\n"  # Disable terminal echo
                  f"{self.bootstrap_command}\n"
              ),
              timeout=timeout
          ))
          stdio, write, ptyReader = stdio_transport
          session = await exit_stack.enter_async_context(ClientSession(stdio, write))
          # await session.initialize()
          # Why should i wait the initialization? Lets skip it
          # Skip initialization
          await session.send_notification(
              types.ClientNotification(types.InitializedNotification(method="notifications/initialized"))
          )
          response = await session.call_tool(
              name=action,
              arguments=args
          )
          ptyReader.kill()
          sandbox.kill()
          end_time = anyio.current_time()
          print(f"Total time: {end_time - start_time}")
          return {
            "response": response,
            "run_seconds": end_time - start_time,
          }
