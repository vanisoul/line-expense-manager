type LogLevel = 'log' | 'info' | 'warn' | 'error';

export class Logger {
    private prefix: string;
    private requestId: string;

    constructor(prefix: string = '', requestId: string = '') {
        this.prefix = prefix ? `[${prefix}] ` : '';
        this.requestId = requestId ? `[RequestId: ${requestId}] ` : '';
    }

    private logMessage(level: LogLevel, message: string): void {
        const outputMessage = `${this.prefix}${this.requestId}${message}`;
        switch (level) {
            case 'log':
                console.log(outputMessage);
                break;
            case 'info':
                console.info(`INFO: ${outputMessage}`);
                break;
            case 'warn':
                console.warn(`WARN: ${outputMessage}`);
                break;
            case 'error':
                console.error(`ERROR: ${outputMessage}`);
                break;
        }
    }
    info(message: string): void {
        this.logMessage('info', message);
    }

    warn(message: string): void {
        this.logMessage('warn', message);
    }

    error(message: string): void {
        this.logMessage('error', message);
    }
}
