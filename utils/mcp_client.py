from termcolor import colored
from e2b import Sandbox
import anyio
from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
import asyncio
from e2b.sandbox.commands.command_handle import PtySize
import mcp.types as types
import anyio.lowlevel
import anyio.to_thread
import anyio.from_thread
from contextlib import asynccontextmanager
from contextlib import AsyncExitStack
from mcp import ClientSession
import re
from typing import Any

@asynccontextmanager
async def stdio_client(bootstrap_command: str, template_id: str, env: list[dict] = [], timeout: int = 10):
    """
    Client transport for stdio: connects to a server by spawning a process and
    communicating with it over stdin/stdout.
    """
    read_stream: MemoryObjectReceiveStream[types.JSONRPCMessage | Exception]
    read_stream_writer: MemoryObjectSendStream[types.JSONRPCMessage | Exception]

    write_stream: MemoryObjectSendStream[types.JSONRPCMessage]
    write_stream_reader: MemoryObjectReceiveStream[types.JSONRPCMessage]
    # Create in-memory streams for exchanging JSONRPC messages.
    # (Each create_memory_object_stream returns a pair (send, receive).)
    read_stream_writer, read_stream = anyio.create_memory_object_stream()
    write_stream, write_stream_reader = anyio.create_memory_object_stream()

    #print('Initializing sandbox...')
    sandbox = Sandbox(template_id, timeout=timeout)
    #print('Sandbox initialized')
    #print('Starting process...')
    ptyReader = sandbox.pty.create(size=PtySize(80, 80), user='root')
    #print('Process started')
    #print('Sending bootstrap command...')

    sandbox.pty.send_stdin(
        pid=ptyReader.pid,
        data=bootstrap_command.encode()  # TODO: Use repo info
    )
    #print('Bootstrap command sent')

    async def stdout_reader():
        assert ptyReader, "Opened process is missing ptyReader"
        try:
          async def send_to_reader(response: bytes):
              chunk = response.decode()
              #print(colored(chunk, 'yellow'))

              try:
                  message = types.JSONRPCMessage.model_validate_json(chunk)
                  #print(colored(line, 'green'))
                  try:
                    # print(colored("Sending message to read_stream_writer", 'green'))
                    await read_stream_writer.send(message)
                    # print(colored("Message sent to read_stream_writer", 'green'))
                  except Exception as exc:
                    print(colored(f'read_stream_writer.send error {exc}', 'red'))
              except Exception:
                return
                # print(f"Skipping non-JSON line: {line} {exc}")

          def handle_stdout(response: bytes):
              # Schedule send_to_reader on the main event loop.
              anyio.from_thread.run(send_to_reader, response)

          def ptyWait():
              #print(colored('Starting ptyReader wait...', 'green'))
              res = ptyReader.wait(
                  on_pty=handle_stdout,
                  on_stdout=lambda response: print(colored(response, 'yellow')),
                  on_stderr=lambda response: print(colored(response, 'red'))
              )
              print("ptyReader.wait() returned", res)

          #print(colored('Waiting for ptyReader...', 'green'))
          # Run the (potentially blocking) wait call in a separate thread.
          await anyio.to_thread.run_sync(
              lambda: ptyWait()
          )
          print("ptyReader.wait() returned; keeping stdout_reader alive.")
          await anyio.sleep_forever()
        except Exception as e:
            print(f"stdout_reader error: {e}")
            await read_stream_writer.send(e)

    async def stdin_writer():
        assert sandbox.pty, "Opened process is missing pty"
        try:
          async with write_stream_reader:
            async for message in write_stream_reader:
                json_text = message.model_dump_json(by_alias=True, exclude_none=True)
                #print(colored(json_text, 'cyan'))
                sandbox.pty.send_stdin(
                    pid=ptyReader.pid,
                    data=(json_text + "\n").encode(
                        encoding="utf-8", # This came from StdioServerParameters
                        errors="strict" # This came from StdioServerParameters
                    )
                )
        except anyio.ClosedResourceError:
            await anyio.lowlevel.checkpoint()

    async with anyio.create_task_group() as tg:
        tg.start_soon(stdout_reader)
        tg.start_soon(stdin_writer)
        yield read_stream, write_stream

async def run_mcp_action(owner: str, repo: str, version: str | None, action: str, arguments: dict | None = None):
    start_time = anyio.current_time()
    #print('Creating client session...')
    exit_stack = AsyncExitStack()
    stdio_transport = await exit_stack.enter_async_context(stdio_client(
        bootstrap_command=(
            "cd /mcp-server-diff-python &&\n"
            "stty -echo &&\n"  # Disable terminal echo
            "uv run --no-sync mcp-server-diff-python\n"
        ),
        template_id='6qwjyhyr6ml18vcy64il'
    ))
    stdio, write = stdio_transport
    session = await exit_stack.enter_async_context(ClientSession(stdio, write))

    #print('Client session created')
    #print("Waiting for server to finish bootstrapping...")
    #await anyio.sleep(6)  # (Or use a more robust ready signal.)
    #print('Initializing session...')
    # This will send the "initialize" request and wait for a JSON response.
    # await session.initialize()
    # Why the fuck should i wait the initialization? Lets skip it
    await session.send_notification(
        types.ClientNotification(
            types.InitializedNotification(method="notifications/initialized")
        )
    )
    #print('Session initialized')
    #print('Call tool...')
    # tools = await session.list_tools()
    response = await session.call_tool(
        name='get-unified-diff',
        arguments=arguments
    )
    end_time = anyio.current_time()
    # print('Available tools:', tools)
    print('Diff res:', response)
    print(f"Total time: {end_time - start_time}")
    return response