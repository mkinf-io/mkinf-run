import {
  Client,
  Code,
  ConnectError
} from '@connectrpc/connect';
import { AuthenticationError, CommandRequestOpts, Commands, ConnectionConfig, InvalidArgumentError, NotFoundError, SandboxError, TimeoutError } from "e2b";
import { CommandHandle } from './commandHandle';
import { ConnectResponse, Process as ProcessService, Signal, StartResponse } from './process_pb';

export interface CommandExtConnectOpts extends CommandRequestOpts {
  /**
  * Callback for command stdout output.
  */
  onStdout?: (data: string) => void | Promise<void>
  /**
  * Callback for command stderr output.
  */
  onStderr?: (data: string) => void | Promise<void>
  /**
  * Callback for command data output.
  */
  onData?: (data: Uint8Array) => void | Promise<void>
  /**
  * Timeout for the command in **milliseconds**.
  *
  * @default 60_000 // 60 seconds
  */
  timeoutMs?: number
}

export class CommandsExt {
  defaultProcessConnectionTimeoutMs = 60_000 // 60 seconds
  KEEPALIVE_PING_HEADER = 'Keepalive-Ping-Interval'
  KEEPALIVE_PING_INTERVAL_SEC = 50 // 50 seconds

  constructor(
    protected readonly rpc: Client<typeof ProcessService>,
    private readonly connectionConfig: ConnectionConfig
  ) { }
  /**
  * Connect to a running command.
  * You can use {@link CommandHandle.wait} to wait for the command to finish and get execution results.
  *
  * @param pid process ID of the command to connect to. You can get the list of running commands using {@link Commands.list}.
  * @param opts connection options.
  *
  * @returns `CommandHandle` handle to interact with the running command.
  */
  async connectWithData(
    pid: number,
    opts?: CommandExtConnectOpts
  ): Promise<CommandHandle> {
    const requestTimeoutMs =
      opts?.requestTimeoutMs ?? this.defaultProcessConnectionTimeoutMs //this.connectionConfig.requestTimeoutMs

    const controller = new AbortController()

    const reqTimeout = requestTimeoutMs
      ? setTimeout(() => {
        controller.abort()
      }, requestTimeoutMs)
      : undefined

    const events = this.rpc.connect(
      {
        process: {
          selector: {
            case: 'pid',
            value: pid,
          },
        },
      },
      {
        signal: controller.signal,
        headers: {
          [this.KEEPALIVE_PING_HEADER]: this.KEEPALIVE_PING_INTERVAL_SEC.toString(),
        },
        timeoutMs: opts?.timeoutMs ?? this.defaultProcessConnectionTimeoutMs,
      }
    )

    try {
      const pid = await handleProcessStartEvent(events)

      clearTimeout(reqTimeout)

      return new CommandHandle(
        pid,
        () => controller.abort(),
        () => this.kill(pid),
        events,
        opts?.onStdout,
        opts?.onStderr,
        opts?.onData
      )
    } catch (err) {
      throw handleRpcError(err)
    }
  }

  /**
    * Kill a running command specified by its process ID.
    * It uses `SIGKILL` signal to kill the command.
    *
    * @param pid process ID of the command. You can get the list of running commands using {@link Commands.list}.
    * @param opts connection options.
    *
    * @returns `true` if the command was killed, `false` if the command was not found.
    */
  async kill(pid: number, opts?: CommandRequestOpts): Promise<boolean> {
    try {
      await this.rpc.sendSignal(
        {
          process: {
            selector: {
              case: 'pid',
              value: pid,
            },
          },
          signal: Signal.SIGKILL,
        },
        {
          signal: this.connectionConfig.getSignal(opts?.requestTimeoutMs),
        }
      )

      return true
    } catch (err) {
      if (err instanceof ConnectError) {
        if (err.code === Code.NotFound) {
          return false
        }
      }

      throw handleRpcError(err)
    }
  }
}

export async function handleProcessStartEvent(
  events: AsyncIterable<StartResponse | ConnectResponse>
) {
  let startEvent: StartResponse | ConnectResponse

  try {
    startEvent = (await events[Symbol.asyncIterator]().next()).value
  } catch (err) {
    if (err instanceof ConnectError) {
      if (err.code === Code.Unavailable) {
        throw new NotFoundError('Sandbox is probably not running anymore')
      }
    }

    throw err
  }
  if (startEvent.event?.event.case !== 'start') {
    throw new Error('Expected start event')
  }

  return startEvent.event.event.value.pid
}

export function handleRpcError(err: unknown): Error {
  if (err instanceof ConnectError) {
    switch (err.code) {
      case Code.InvalidArgument:
        return new InvalidArgumentError(err.message)
      case Code.Unauthenticated:
        return new AuthenticationError(err.message)
      case Code.NotFound:
        return new NotFoundError(err.message)
      case Code.Unavailable:
        return formatSandboxTimeoutError(err.message)
      case Code.Canceled:
        return new TimeoutError(
          `${err.message}: This error is likely due to exceeding 'requestTimeoutMs'. You can pass the request timeout value as an option when making the request.`
        )
      case Code.DeadlineExceeded:
        return new TimeoutError(
          `${err.message}: This error is likely due to exceeding 'timeoutMs' — the total time a long running request (like command execution or directory watch) can be active. It can be modified by passing 'timeoutMs' when making the request. Use '0' to disable the timeout.`
        )
      default:
        return new SandboxError(`${err.code}: ${err.message}`)
    }
  }

  return err as Error
}

export function formatSandboxTimeoutError(message: string) {
  return new TimeoutError(
    `${message}: This error is likely due to sandbox timeout. You can modify the sandbox timeout by passing 'timeoutMs' when starting the sandbox or calling '.setTimeout' on the sandbox with the desired timeout.`
  )
}
