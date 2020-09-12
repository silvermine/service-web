export default class InputError extends Error {
   public constructor(msg: string) {
      super(msg);
      Object.setPrototypeOf(this, InputError.prototype);
   }
}
