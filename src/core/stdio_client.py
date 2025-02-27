from termcolor import colored
from e2b import Sandbox
import anyio
from anyio.streams.memory import MemoryObjectReceiveStream, MemoryObjectSendStream
from e2b.sandbox.commands.command_handle import PtySize
import mcp.types as types
import anyio.lowlevel
import anyio.to_thread
import anyio.from_thread
from contextlib import asynccontextmanager
from typing import Optional
import re
from src.exts.pty import PtyWithConnect


@asynccontextmanager
async def stdio_client(sandbox: Sandbox, pid: Optional[int] = None, bootstrap_command: Optional[str] = None, timeout: int = 60):
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
    #sandbox = Sandbox(template_id, timeout=timeout, envs=envs)
    #print('Sandbox initialized')
    #print('Starting process...')
    if(pid):
      ptyReader = PtyWithConnect(sandbox.pty).connect(pid)
    elif(bootstrap_command):
      ptyReader = sandbox.pty.create(size=PtySize(80, 80), user='root', timeout=timeout)
      #print('Process started')
      #print('Sending bootstrap command...')
      # print("BOOTSTRAP COMMAND:", bootstrap_command)
      sandbox.pty.send_stdin(
          pid=ptyReader.pid,
          data=bootstrap_command.encode()
      )
    else:
      raise ValueError("No process ID or bootstrap command provided")
    #print('Bootstrap command sent')
    ansi_escape = re.compile(r'(?:\x1B[@-_][0-?]*[ -/]*[@-~])')

    async def stdout_reader():
        assert ptyReader, "Opened process is missing ptyReader"
        try:
          buffer = ""
          async def send_to_reader(response: bytes):
              chunk = ansi_escape.sub('', response.decode())
              print(colored(chunk, 'yellow'))
              try:
                  nonlocal buffer
                  lines = (buffer + chunk).split("\n")
                  # print(colored(lines, "blue"))
                  buffer = lines.pop()

                  for line in lines:
                      try:
                          message = types.JSONRPCMessage.model_validate_json(line)
                      except Exception: # as exc:
                          # print(colored("EXCEPTION", 'red'))
                          # print("Skipping non-JSON line:")
                          # print(line)
                          # print(exc)
                          # await read_stream_writer.send(exc)
                          continue

                      await read_stream_writer.send(message)
              except anyio.ClosedResourceError:
                  await anyio.lowlevel.checkpoint()

          def handle_stdout(response: bytes):
              # Schedule send_to_reader on the main event loop.
              anyio.from_thread.run(send_to_reader, response)

          def ptyWait():
              #print(colored('Starting ptyReader wait...', 'green'))
              ptyReader.wait(
                  on_pty=handle_stdout,
                  on_stdout=lambda response: print(colored(response, 'yellow')),
                  on_stderr=lambda response: print(colored(response, 'red'))
              )

          #print(colored('Waiting for ptyReader...', 'green'))
          # Run the (potentially blocking) wait call in a separate thread.
          await anyio.to_thread.run_sync(ptyWait)
        except Exception as e:
            print(f"stdout_reader error: {e}")
            return

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
        yield read_stream, write_stream, ptyReader
