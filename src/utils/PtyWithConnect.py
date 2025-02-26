from e2b.sandbox_sync.commands.pty import Pty
from e2b.envd.process import process_pb2
from typing import Optional
from e2b.sandbox_sync.commands.command_handle import CommandHandle
from e2b.envd.rpc import handle_rpc_exception

class PtyWithConnect:
    def __init__(self, pty: Pty):
        self._pty = pty  # store the original instance

    def connect(
        self,
        pid: int,
        request_timeout: Optional[float] = None
    ) -> CommandHandle:
        """Connect to the remote PTY."""
        events = self._pty._rpc.connect(
            process_pb2.ConnectRequest(
                process=process_pb2.ProcessSelector(pid=pid),
            ),
            request_timeout=self._pty._connection_config.get_request_timeout(
                request_timeout
            ),
        )

        try:
            return CommandHandle(
                pid=pid,
                handle_kill=lambda: self._pty.kill(pid),
                events=events,
            )
        except Exception as e:
            raise handle_rpc_exception(e)

    def __getattr__(self, name):
        # Delegate attribute access to the wrapped instance.
        return getattr(self._pty, name)
