from contextlib import AsyncExitStack
from typing import Any, Optional

import anyio
import anyio.from_thread
import anyio.lowlevel
import anyio.to_thread
import mcp.types as types
from e2b import Sandbox
from mcp import ClientSession

from services.db import DBClient
from src.core.stdio_client import stdio_client
from src.repositories.hosted_releases_repository import HostedReleaseRepository
from src.repositories.runs_repository import RunsRepository
from src.utils.tokens import count_tokens


class RunSession:
    session_id: Optional[str] = None

    def __init__(
        self,
        db: DBClient,
        key_id: str,
        owner: str,
        repo: str,
        build_number: int,
        template_id: str,
        bootstrap_command: str,
        price_run_second: float,
        actions: list[dict[str, Any]],
        envs: Optional[dict[str, str]] = None,
    ):
        self.db = db
        self.key_id = key_id
        self.owner = owner
        self.repo = repo
        self.build_number = build_number
        self.template_id = template_id
        self.bootstrap_command = bootstrap_command
        self.price_run_second = price_run_second
        self.actions = actions
        self.envs = envs

    @classmethod
    def from_version(
        cls,
        db: DBClient,
        key_id: str,
        owner: str,
        repo: str,
        version: Optional[str],
        envs: Optional[dict[str, str]] = None,
    ):
        hosted_release_res = HostedReleaseRepository(db).get_latest_release(
            key_id, owner, repo, version
        )
        if hosted_release_res.data is None or len(hosted_release_res.data) < 1:
            raise ValueError("Not found")
        release = hosted_release_res.data[0]
        return cls(
            db=db,
            key_id=release["key_id"],
            owner=release["owner"],
            repo=release["repo"],
            build_number=release["build_number"],
            template_id=release["template_id"],
            bootstrap_command=release["bootstrap_command"],
            price_run_second=0,  # FIXME: Add price_run_second to hosted_release
            actions=release["actions"],
            envs=release["envs"],
        )

    @classmethod
    def from_session(cls, db: DBClient, session_id: str):
        run_session = RunsRepository(db).get_session(session_id)
        if run_session is None:
            raise ValueError("Not found")
        release = HostedReleaseRepository(db).get_latest_release(
            run_session["key_id"],
            run_session["organization_name"],
            run_session["repository_name"],
            run_session["version"],
        )
        if release is None:
            raise ValueError("Not found")
        cl = cls(
            db=db,
            key_id=run_session["key_id"],
            owner=run_session["organization_name"],
            repo=run_session["repository_name"],
            build_number=release["build_number"],
            template_id=release["template_id"],
            bootstrap_command=release["bootstrap_command"],
            price_run_second=0,  # FIXME: Add price_run_second to hosted_release
            actions=release["actions"],
            envs=release["envs"],
        )
        cl.session_id = session_id
        return cl

    def __check_session(self):
        if self.session_id is None or self.sandbox_id is None or self.pid is None:
            raise ValueError("Session is not initialized")
        run_session = RunsRepository(self.db).get_session(self.session_id)
        if run_session is None:
            raise ValueError("Session not found")
        if (
            run_session["key_id"] != self.key_id
            or run_session["sandbox_id"] != self.sandbox_id
            or run_session["pid"] != self.pid
        ):
            raise ValueError("Invalid session")

    async def start(self, timeout: int = 60) -> Optional[str]:
        async with AsyncExitStack() as exit_stack:
            # Start the sandbox
            sandbox = Sandbox(self.template_id, timeout=timeout, envs=self.envs)
            # Setup transport
            stdio_transport = await exit_stack.enter_async_context(
                stdio_client(
                    sandbox,
                    bootstrap_command=(
                        f"cd /{self.repo} &&\n"
                        "stty -echo &&\n"  # Disable terminal echo
                        f"{self.bootstrap_command}\n"
                    ),
                    timeout=timeout,
                )
            )
            stdio, write, ptyReader = stdio_transport
            # Setup session
            session: ClientSession = await exit_stack.enter_async_context(
                ClientSession(stdio, write)
            )
            # Initialize the session
            await session.initialize()
            # Start a new run session in the database
            run_session = RunsRepository(self.db).start_session(
                organization_name=self.owner,
                repository_name=self.repo,
                build_number=self.build_number,
                sandbox_id=sandbox.sandbox_id,
                pid=ptyReader.pid,
                price_run_second=self.price_run_second,
                key_id=self.key_id,
            )
            self.run_session_id = run_session
            self.sandbox_id = sandbox.sandbox_id
            self.pid = ptyReader.pid
            return run_session
        return None

    async def list_tools(self, timeout: Optional[int] = None):
        self.__check_session()
        start_time = anyio.current_time()
        async with AsyncExitStack() as exit_stack:
            # Connect to the sandbox
            sandbox = Sandbox.connect(self.sandbox_id)
            # Update timeout
            if timeout is not None:
                sandbox.set_timeout(timeout)
            # Setup transport
            stdio_transport = await exit_stack.enter_async_context(
                stdio_client(sandbox, pid=self.pid, timeout=timeout)
            )
            stdio, write, ptyReader = stdio_transport
            # Setup session
            session = await exit_stack.enter_async_context(ClientSession(stdio, write))
            # List tools
            tools = await session.list_tools()
            end_time = anyio.current_time()
            result = {
                "tools": tools,
                "run_seconds": end_time - start_time,
            }
            # Count output tokens
            output_tokens = count_tokens(str(tools))
            # Count run
            RunsRepository(self.db).count_run(
                key_id=self.key_id,
                owner=self.owner,
                repo=self.repo,
                build_number=self.build_number,
                action="list_tools",
                run_seconds=result["run_seconds"],
                price_run_second=0,  # FIXME: Set a fixed price for listing tools
                input_tokens=0,
                output_tokens=output_tokens,
            )
            return result

    async def run(
        self,
        action: str,
        args: Optional[dict] = None,
        timeout: int = 60,
    ):
        self.__check_session()
        start_time = anyio.current_time()
        input_tokens = count_tokens(str(args)) if args else 0
        async with AsyncExitStack() as exit_stack:
            sandbox = Sandbox.connect(self.sandbox_id)
            sandbox.set_timeout(timeout)
            stdio_transport = await exit_stack.enter_async_context(
                stdio_client(sandbox, pid=self.pid, timeout=timeout)
            )
            stdio, write, ptyReader = stdio_transport
            session = await exit_stack.enter_async_context(ClientSession(stdio, write))
            # Run the tool
            response = await session.call_tool(name=action, arguments=args)
            # Get result
            end_time = anyio.current_time()
            print(f"Total time: {end_time - start_time}")
            result = {
                "response": response,
                "run_seconds": end_time - start_time,
            }
            # Count output tokens
            output_tokens = count_tokens(str(response))
            # Find the action price
            action_info = next((a for a in self.actions if a["action"] == action), None)
            price_run_second = (
                action_info["price_run_second"] if action_info is not None else None
            )
            # Count run
            RunsRepository(self.db).count_run(
                key_id=self.key_id,
                owner=self.owner,
                repo=self.repo,
                build_number=self.build_number,
                action=action,
                run_seconds=result["run_seconds"],
                price_run_second=price_run_second,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )
            return result

    async def close(self):
        self.__check_session()
        if self.session_id is None:
            raise ValueError("Run session not initialized")
        # Get the run session
        run_session = RunsRepository(self.db).get_session(id=self.session_id)
        # Check if the run session exists
        if run_session is None:
            raise ValueError("Run session not found")
        # Check if the key_id matches
        if run_session["key_id"] != self.key_id:
            raise ValueError("Run session not found")
        # Kill the sandbox
        killed = Sandbox.kill(run_session["sandbox_id"])
        # End the run session in the database
        RunsRepository(self.db).end_session(id=self.session_id)
        return {
            "success": killed,
        }

    async def list_tools_once(self, timeout: int = 60):
        self.__check_session()
        start_time = anyio.current_time()
        async with AsyncExitStack() as exit_stack:
            sandbox = Sandbox(self.template_id, timeout=timeout, envs=self.envs)
            stdio_transport = await exit_stack.enter_async_context(
                stdio_client(
                    sandbox,
                    bootstrap_command=(
                        f"cd /{self.repo} &&\n"
                        "stty -echo &&\n"  # Disable terminal echo
                        f"{self.bootstrap_command}\n"
                    ),
                    timeout=timeout,
                )
            )
            stdio, write, ptyReader = stdio_transport
            session = await exit_stack.enter_async_context(ClientSession(stdio, write))
            # await session.initialize()
            # Why should i wait the initialization? Lets skip it
            # Skip initialization
            await session.send_notification(
                types.ClientNotification(
                    types.InitializedNotification(method="notifications/initialized")
                )
            )
            tools = await session.list_tools()
            ptyReader.kill()
            sandbox.kill()
            end_time = anyio.current_time()
            print(f"Total time: {end_time - start_time}")
            result = {
                "tools": tools,
                "run_seconds": end_time - start_time,
            }
            # Count output tokens
            output_tokens = count_tokens(str(tools))
            # Count run
            RunsRepository(self.db).count_run(
                key_id=self.key_id,
                owner=self.owner,
                repo=self.repo,
                build_number=self.build_number,
                action="list_tools",
                run_seconds=result["run_seconds"],
                price_run_second=0,
                input_tokens=0,
                output_tokens=output_tokens,
            )
            return result

    async def run_once(
        self, action: str, args: Optional[dict] = None, timeout: int = 60
    ):
        self.__check_session()
        start_time = anyio.current_time()
        input_tokens = count_tokens(str(args)) if args else 0
        async with AsyncExitStack() as exit_stack:
            # Start the sandbox
            sandbox = Sandbox(self.template_id, timeout=timeout, envs=self.envs)
            # Setup transport
            stdio_transport = await exit_stack.enter_async_context(
                stdio_client(
                    sandbox,
                    bootstrap_command=(
                        f"cd /{self.repo} &&\n"
                        "stty -echo &&\n"  # Disable terminal echo
                        f"{self.bootstrap_command}\n"
                    ),
                    timeout=timeout,
                )
            )
            stdio, write, ptyReader = stdio_transport
            # Setup session
            session = await exit_stack.enter_async_context(ClientSession(stdio, write))
            # await session.initialize()
            # Why should i wait the initialization? Lets skip it
            # Skip initialization
            await session.send_notification(
                types.ClientNotification(
                    types.InitializedNotification(method="notifications/initialized")
                )
            )
            # Run the tool
            response = await session.call_tool(name=action, arguments=args)
            # Kill the process and sandbox
            ptyReader.kill()
            sandbox.kill()
            # Get result
            end_time = anyio.current_time()
            print(f"Total time: {end_time - start_time}")
            result = {
                "response": response,
                "run_seconds": end_time - start_time,
            }
            # Count output tokens
            output_tokens = count_tokens(str(response))
            # Find the action price
            action_info = next((a for a in self.actions if a["action"] == action), None)
            price_run_second = (
                action_info["price_run_second"] if action_info is not None else None
            )
            # Count run
            RunsRepository(self.db).count_run(
                key_id=self.key_id,
                owner=self.owner,
                repo=self.repo,
                build_number=self.build_number,
                action=action,
                run_seconds=result["run_seconds"],
                price_run_second=price_run_second,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
            )
            return result
