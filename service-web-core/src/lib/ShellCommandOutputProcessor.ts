import { Transform, TransformCallback } from 'stream';

export default class ShellCommandOutputProcessor extends Transform {

   protected _buffer: Buffer;

   public constructor(private _prefix: string) {
      super({ encoding: 'utf-8', readableObjectMode: true });
      this._buffer = Buffer.from('');
   }

   public _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
      try {
         this._buffer = Buffer.concat([ this._buffer, chunk ]);

         const asString = this._buffer.toString(),
               lines = asString.split('\n');

         if (lines.length > 1) {
            this._buffer = Buffer.from(lines.pop() as string);

            lines.forEach((line) => {
               // Strip out any move/erase ANSI control characters
               const trimmedLine = line.replace(/(\u001B\[\d*[AGJK])|\r/g, ''); // eslint-disable-line no-control-regex

               if (trimmedLine) {
                  this.push(`${this._prefix} ${trimmedLine}\n`);
               }
            });
         }
      } catch(err) {
         if (err instanceof Error) {
            return callback(err);
         }
         throw err;
      }

      callback();
   }

   public _flush(callback: TransformCallback): void {
      this.push(this._buffer.toString());
      callback();
   }

}
